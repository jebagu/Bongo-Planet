"""Prepare isolated percussion assets; this does not change Bongo Planet.

Requires Python with numpy and FFmpeg/ffprobe on PATH. Re-run with --download
to retrieve the exact hash-verified originals from the pinned source commits.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import urllib.request
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
RATE = 48_000


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def db(value: float) -> float:
    return round(20 * math.log10(max(float(value), 1e-12)), 4)


def decode(path: Path, rate: int = RATE) -> np.ndarray:
    metadata = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-of", "json", str(path),
    ]))["streams"][0]
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-af",
        f"aresample={rate}:resampler=swr:filter_size=64:phase_shift=10:cutoff=0.97",
        "-f", "f32le", "pipe:1",
    ])
    return np.frombuffer(raw, dtype="<f4").reshape(-1, metadata["channels"]).astype(np.float64)


def write_wav(path: Path, samples: np.ndarray, seed: int) -> None:
    # Deterministic TPDF dither for the final conversion to 16-bit PCM.
    rng = np.random.default_rng(seed)
    dither = (rng.random(samples.size) - rng.random(samples.size)) / 32768
    pcm = np.rint((samples + dither) * 32768).clip(-32768, 32767).astype("<i2")
    pcm[0] = pcm[-1] = 0
    with wave.open(str(path), "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(RATE)
        writer.writeframes(pcm.tobytes())


def prepare_sample(spec: dict, download: bool) -> tuple[dict, np.ndarray]:
    original = ROOT / "originals" / spec["source_filename"]
    cached = ROOT / "provenance" / "candidates" / spec["source_filename"]
    if not original.exists():
        if cached.exists():
            shutil.copyfile(cached, original)
        elif download:
            original.write_bytes(urllib.request.urlopen(spec["source_url"], timeout=60).read())
        else:
            raise FileNotFoundError(f"Missing {original}; use --download")
    if digest(original) != spec["source_sha256"]:
        raise ValueError(f"Source hash mismatch: {original}")
    metadata = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-of", "json", str(original),
    ]))["streams"][0]
    stereo = decode(original)
    mono = stereo.mean(axis=1)
    retention = db(np.sqrt(np.mean(mono ** 2)) / np.sqrt(np.mean(stereo ** 2)))
    if retention < -6:
        raise ValueError(f"Excessive cancellation in mono: {spec['id']}")
    # Remove only the estimated constant bias, measured in the final 50 ms.
    dc = float(np.median(mono[-min(len(mono), RATE // 20):]))
    mono = mono - dc
    peak = float(np.max(np.abs(mono)))
    attack = np.flatnonzero(np.abs(mono) >= peak * 10 ** (-45 / 20))
    start = max(0, int(attack[0]) - round(RATE * 0.001))
    # Preserve the full significant tail, plus 40 ms; never force equal lengths.
    tail = np.flatnonzero(np.abs(mono) >= peak * 10 ** (-50 / 20))
    end = min(len(mono), int(tail[-1]) + round(RATE * 0.040) + 1)
    prepared = mono[start:end].copy()
    fade_in = min(round(RATE * 0.000125), len(prepared))
    fade_out = min(round(RATE * 0.010), len(prepared))
    fade_start_db = db(np.max(np.abs(prepared[-fade_out:])) / peak)
    prepared[:fade_in] *= np.linspace(0, 1, fade_in)
    prepared[-fade_out:] *= np.linspace(1, 0, fade_out)
    target = 10 ** (spec["target_peak_dbfs"] / 20)
    gain = target / float(np.max(np.abs(prepared)))
    prepared *= gain
    destination = ROOT / "audio" / f"{spec['id']}.wav"
    seed = int(hashlib.sha256(spec["id"].encode()).hexdigest()[:8], 16)
    write_wav(destination, prepared, seed)
    decoded = decode(destination).mean(axis=1)
    oversampled = decode(destination, RATE * 4).mean(axis=1)
    measured_onset = float(np.flatnonzero(np.abs(decoded) >= np.max(np.abs(decoded)) * 10 ** (-45 / 20))[0] / RATE)
    retained_energy = float(np.sum(mono[start:end] ** 2) / np.sum(mono ** 2))
    checks = {
        "finite": bool(np.isfinite(decoded).all()),
        "no_clipped_samples": bool(np.max(np.abs(decoded)) < 0.99),
        "true_peak_below_minus_3_dbfs": bool(db(np.max(np.abs(oversampled))) < -3),
        "onset_within_2_ms": measured_onset <= 0.002,
        "tail_energy_retention_above_99_9_percent": retained_energy >= 0.999,
        "quiet_fade_out": fade_start_db <= -40,
    }
    record = {
        **spec, "license": "CC0-1.0", "path": f"audio/{destination.name}",
        "original_path": f"originals/{original.name}",
        "original": {"channels": metadata["channels"], "sample_rate": int(metadata["sample_rate"]),
                     "bits": int(metadata.get("bits_per_raw_sample") or metadata.get("bits_per_sample")),
                     "seconds": float(metadata["duration"]), "bytes": original.stat().st_size},
        "prepared": {"channels": 1, "sample_rate": RATE, "bits": 16,
                     "seconds": round(len(decoded) / RATE, 6), "bytes": destination.stat().st_size,
                     "sha256": digest(destination), "peak_dbfs": db(np.max(np.abs(decoded))),
                     "true_peak_dbfs_4x": db(np.max(np.abs(oversampled))),
                     "onset_ms_at_minus_45_db": round(measured_onset * 1000, 4)},
        "processing": {"mono_energy_change_db": retention, "removed_dc": dc,
                       "trim_start_seconds": round(start / RATE, 6),
                       "trim_end_seconds": round((len(mono) - end) / RATE, 6),
                       "gain_db": db(gain), "source_energy_retained": round(retained_energy, 8),
                       "fade_in_ms": 0.125, "fade_out_ms": 10,
                       "fade_out_start_level_relative_to_peak_db": fade_start_db,
                       "resampling": "FFmpeg swresample, 64-tap filter, phase_shift 10, cutoff 0.97, 48 kHz",
                       "dither": "deterministic TPDF, 1 LSB peak-to-peak per uniform component",
                       "eq_compression_reverb_pitch_shift": "none"},
        "checks": checks,
    }
    if not all(checks.values()):
        raise ValueError(f"Asset check failed: {spec['id']}: {checks}")
    return record, decoded


def render_demo(name: str, bank: dict[str, np.ndarray], bongos_only: bool) -> dict:
    bpm = 100
    step = 60 / bpm / 4
    bars = 4
    output = np.zeros(round((bars * 16 * step + 2) * RATE))
    events = []
    counts: dict[str, int] = {}

    def hit(voice: str, tick: int, level: float) -> None:
        index = counts.get(voice, 0)
        variant = "A" if index % 2 == 0 else "B"
        counts[voice] = index + 1
        data = bank[f"{voice}-{variant}"]
        start = round(tick * step * RATE)
        output[start:start + len(data)] += data * level
        events.append({"sample": f"{voice}-{variant}", "seconds": round(tick * step, 6), "gain": level})

    for bar in range(bars):
        base = bar * 16
        for tick in [0, 7, 10]:
            hit("bongo-low", base + tick, 0.48)
        for tick in [3, 6, 11, 14]:
            hit("bongo-high", base + tick, 0.44 if tick in [3, 11] else 0.32)
        if not bongos_only:
            for tick in [0, 8]:
                hit("kick", base + tick, 0.68)
            for tick in [4, 12]:
                hit("snare", base + tick, 0.68)
            for tick in range(0, 16, 2):
                hit("hat-closed", base + tick, 0.44 if tick % 4 == 0 else 0.32)
    destination = ROOT / "demos" / f"{name}.wav"
    write_wav(destination, output, 20261014)
    if np.max(np.abs(output)) > 10 ** (-6 / 20):
        raise ValueError("Demo mix has insufficient headroom")
    return {"name": name, "path": f"demos/{destination.name}", "bpm": bpm, "bars": bars,
            "seconds": len(output) / RATE, "peak_dbfs": db(np.max(np.abs(output))),
            "sha256": digest(destination), "events": events,
            "scope": "Offline audition render, no game scheduling or integration"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    for folder in ["originals", "audio", "demos"]:
        (ROOT / folder).mkdir(exist_ok=True)
    selection = json.loads((ROOT / "selection.json").read_text())
    records, bank = [], {}
    for spec in selection["samples"]:
        record, data = prepare_sample(spec, args.download)
        records.append(record)
        bank[spec["id"]] = data
    manifest = {
        "name": "Bongo Planet", "prepared_date": "2026-10-14", "version": 1,
        "status": "Asset preparation only; not installed in the game",
        "format": {"container": "WAV", "encoding": "PCM signed 16-bit", "channels": 1,
                   "sample_rate": RATE, "pcm_bitrate_bits_per_second": RATE * 16},
        "sources": [
            {"id": "vcsl", "name": "Versilian Community Sample Library", "license": "CC0-1.0",
             "repository": "https://github.com/sgossner/VCSL",
             "commit": "c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e",
             "license_path": "licenses/VCSL-CC0-1.0.txt"},
            {"id": "virtuosity", "name": "Virtuosity Drums", "license": "CC0-1.0",
             "repository": "https://github.com/sfzinstruments/virtuosity_drums",
             "commit": "9f04cf9a734527edfbb0a4eee1f674e45bbf71bc",
             "license_path": "licenses/Virtuosity-CC0-1.0.txt"},
        ],
        "samples": records,
        "demos": [render_demo("bongos", bank, True), render_demo("whole-kit", bank, False)],
        "checks_passed": all(all(r["checks"].values()) for r in records),
        "audio_quality_note": "Technical checks do not substitute for human listening approval.",
    }
    for source in manifest["sources"]:
        source["license_sha256"] = digest(ROOT / source["license_path"])
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"samples": len(records), "ready_bytes": sum(r["prepared"]["bytes"] for r in records),
                      "all_checks_passed": manifest["checks_passed"],
                      "durations": {r["id"]: r["prepared"]["seconds"] for r in records}}, indent=2))


if __name__ == "__main__":
    main()
