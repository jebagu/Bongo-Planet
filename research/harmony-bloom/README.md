# Harmony Bloom sound extraction for Bongo Planet

Extracted on October 12, 2026 from the user's installed `/Applications/Harmony Bloom.app`, version **1.3.92**, at the user's request for personal use. The source executable is unchanged; its SHA-256 was checked before and after extraction.

The five internal sounds are **acoustic guitar, glass, kalimba, piano, and marimba**. Each is an embedded stereo, 44.1 kHz, 16-bit PCM WAV. They are sampled instruments, rather than five distinct oscillator synth engines. The shipped symbols also contain an `MNSampler` class; the exact native envelope, loop and effect settings were not recovered in this inspection.

| Sound | Shipped resource name | Duration | Bytes |
|---|---|---:|---:|
| Acoustic guitar | `Acustic_Guitar_C3_wav` | 2.053 s | 362,196 |
| Glass | `Glass_C3_wav` | 3.500 s | 617,444 |
| Kalimba | `kalimba_C3_wav` | 4.000 s | 705,644 |
| Piano | `Piano_C3_wav` | 3.000 s | 529,244 |
| Marimba | `Sam_Marimba_Hita_C3_wav` | 2.383 s | 420,488 |

## Files and verification

- `assets/` contains the five original WAV payloads, unmodified and without normalization.
- `manifest.json` records source identity, file offsets, resource-table indices, symbol addresses, output hashes and format information.
- `extract.py` reproduces extraction with Python's standard library and the macOS `nm` command. It reads the ARM64 Mach-O segments, maps JUCE's `namedResourceList` indices to the matching `temp_binary_data_N` symbols, and copies exactly the RIFF-declared bytes.
- Both slices of the universal executable contain byte-identical copies of each WAV. Extraction checks that each full WAV payload occurs twice, checks complete PCM frame decoding, and verifies the source hash again.
- `pitch-measurement.json` records a separate FFT observation: the strongest partial in the 200–300 Hz band is near middle C for all five files. The listening page uses MIDI note 60 as its approximate audition root. The shipped `C3` filename therefore should not automatically be interpreted as MIDI note 48. The native sampler mapping remains unverified.

REA artifact inspection evidence: `ev_a53e22ad60fd6ad522a4aade31b55e5096deb993f8e257a54ef786c3d1ac742b`; inventory manifest `agm_29fc91557c0a705349dffd743eeb75de28db81b8646b039d599f0eb013c5eaaf`. Focused native procedure analysis could not start because the Hopper bridge did not become ready; no decompilation result is claimed. Resource extraction used the shipped symbols and binary bytes independently.

## Using them

Audition the sounds at **http://127.0.0.1:5417/BongoPlanet/research/sound-palette/index.html**. A Web Audio sampler can load these five buffers, change playback rate to transpose notes, and apply per-voice envelopes. These originals total about **2.51 MiB**, so they are small enough for an internal browser sound bank. One recorded pitch per instrument will change timbre when transposed far from its root.

The listening page is a research artifact. It does not modify Bongo Planet's live sound engine and does not reproduce Harmony Bloom's complete preset sound. These are proprietary extracted reference assets; no open-source or freely redistributable license has been established for them.
