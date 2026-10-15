"""Derive a review from retained evidence only; run after the final report exists."""
import hashlib
import json
import math
import pathlib
import statistics
import struct

root = pathlib.Path(__file__).resolve().parent
report = json.loads((root / "soak-report.json").read_text())
chunks = [json.loads(line) for line in (root / "capture-chunks.jsonl").read_text().splitlines()]


def digest(path, skip=0):
    result = hashlib.sha256()
    with path.open("rb") as source:
        source.seek(skip)
        while data := source.read(1024 * 1024):
            result.update(data)
    return result.hexdigest()


def summary(values):
    return {"count": len(values), "minimum": min(values), "median": statistics.median(values), "maximum": max(values)}


raw = root / "continuous-virtual-capture.f32"
wav = root / "continuous-virtual-capture.wav"
anomalies = []
for index, (previous, following) in enumerate(zip(chunks, chunks[1:])):
    gap = round(following["start"] * 48000) - round(previous["start"] * 48000) - previous["samples"]
    if gap:
        anomalies.append({"precedingChunkIndex": index, "followingChunkIndex": index + 1, "sampleGap": gap, "preceding": previous, "following": following})

duplicates = []
constant_duplicates = 0
previous = None
block_index = 0
with raw.open("rb") as source:
    while block := source.read(512):
        if block == previous:
            if block == block[:4] * 128:
                constant_duplicates += 1
            else:
                samples = struct.unpack("<128f", block)
                duplicates.append({"rawStartSample": block_index * 128, "previousRawStartSample": (block_index - 1) * 128, "sha256": hashlib.sha256(block).hexdigest(), "rms": math.sqrt(sum(x * x for x in samples) / 128), "peak": max(abs(x) for x in samples), "uniqueSampleValues": len(set(samples)), "sampleRange": max(samples) - min(samples), "rawCaptureTimeSeconds": block_index * 128 / 48000})
        previous = block
        block_index += 1

warm = [sample for sample in report["samples"] if 120 <= sample["elapsedSeconds"] < 300]
later = [sample for sample in report["samples"] if sample["elapsedSeconds"] >= 1500]
all_snapshots = [sample["audio"] for sample in report["samples"]] + [report["finalSnapshot"]["audio"]]
raw_digest = digest(raw)
review = {
    "title": "Bongo Planet final-revision 30-minute runtime review; seamless capture remains unqualified",
    "commit": report["commit"],
    "startedAt": report["startedAt"],
    "finishedAt": report["finishedAt"],
    "elapsedSeconds": report["elapsedSeconds"],
    "runtimeDurationCompleted": report["complete30Minutes"],
    "browserClosed": report["browserClosed"],
    "samples": len(report["samples"]),
    "validatedEdits": len(report["edits"]),
    "allObservedSnapshotsRunning": all(snapshot["running"] for snapshot in all_snapshots),
    "maximumObservedPending": max(snapshot["pending"] for snapshot in all_snapshots),
    "maximumObservedVoices": max(snapshot["activeVoices"] for snapshot in all_snapshots),
    "maximumObservedLateDrops": max(snapshot["lateDrops"] for snapshot in all_snapshots),
    "maximumObservedAudioLateDrops": max(snapshot["lateDropsAudio"] for snapshot in all_snapshots),
    "maximumObservedTelemetryDrops": max(snapshot["telemetryDrops"] for snapshot in all_snapshots),
    "errors": report["errors"],
    "warmupHeapMB": summary([sample["metrics"]["JSHeapUsedSize"] / 1e6 for sample in warm]),
    "lastFiveMinutesHeapMB": summary([sample["metrics"]["JSHeapUsedSize"] / 1e6 for sample in later]),
    "observedGeometries": summary([sample["render"]["geometries"] for sample in report["samples"]]),
    "observedDocuments": sorted(set(sample["metrics"]["Documents"] for sample in report["samples"])),
    "observedListeners": sorted(set(sample["metrics"]["JSEventListeners"] for sample in report["samples"])),
    "rawSamples": raw.stat().st_size // 4,
    "metadataSamples": sum(chunk["samples"] for chunk in chunks),
    "recordedDurationSeconds": raw.stat().st_size / (4 * 48000),
    "rawSha256": raw_digest,
    "reportedRawSha256Matches": raw_digest == report["captureSha256"],
    "wavSampleBytesMatchRaw": digest(wav, 44) == raw_digest,
    "wavFileBytes": wav.stat().st_size,
    "sampleClockAnomalies": anomalies,
    "nonconstantAdjacentDuplicate128SampleBlocks": duplicates,
    "constantAdjacentDuplicateBlocksExcluded": constant_duplicates,
    "seamlessCaptureQualified": False,
    "humanListeningPassed": False,
    "individualDenseOnsetGatePassed": False,
    "concurrentWork": "Lead source/unit/browser regression overlapped the run; this was a declared stress run, not a quiet benchmark.",
    "limits": ["Status and memory are periodic snapshots, not a proof of every event or unlimited future memory use.", "Duplicated captured samples cannot be localized to product output, virtual driver, or input capture from this recording alone.", "Original dense individual audible onset timing and human listening remain open.", "No timestamp repair, PCM deletion, insertion, resampling, or time scaling was applied."],
}
(root / "soak-review.json").write_text(json.dumps(review, indent=2) + "\n")
print(json.dumps({key: value for key, value in review.items() if key not in {"sampleClockAnomalies", "nonconstantAdjacentDuplicate128SampleBlocks", "limits"}}, indent=2))
print("sample-clock anomalies:", len(anomalies), "nonconstant duplicate128-sample blocks:", len(duplicates))
