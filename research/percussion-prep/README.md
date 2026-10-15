# Bongo Planet percussion assets

Prepared October 14, 2026. **The five core percussion voices are now integrated into the instrument picker**, using the ten recordings copied into `public/audio/percussion/` and matching editable 3D characters. The optional open hat remains research-only. The kick artwork also supplies the web favicon. This folder preserves the original asset preparation and offline listening sketches.

Listen and inspect the artwork at **http://127.0.0.1:5417/BongoPlanet/research/percussion-prep/index.html** using the existing development server. `index.html` also works as a local file after extracting the pack. The page is a static listening sheet, not a game feature or sampler implementation.

## Recommended starting set

Use **bongos, kick, snare, and a closed hi-hat**. The bongo pair has two acoustic voices, giving five core sounds across four instrument characters.

| Instrument | Role | Why include it |
|---|---|---|
| High and low bongos | Warm, conversational accents | They fit the name and distinguish the instrument from a generic drum machine. Separate recordings preserve the two drums' different character. |
| Kick / bass drum | Low-frequency weight | Establishes a pulse without requiring a melodic bass line. |
| Snare | Backbeat and punctuation | Gives the pulse a recognizable groove and contrasts with the rounder bongos. |
| Closed hi-hat | Light subdivision | Adds motion between the heavier hits. Keep it quieter so dense patterns remain comfortable. |
| Open hi-hat, optional | Occasional airy accent | Prepared as a reserve articulation. It is not needed for the initial palette. |

A bongo + snare + hat set works for light percussion, but lacks deep weight. A bongo + snare + kick set works for a sparse groove, but lacks the light ticking subdivision. Preparing all four gives us both options without committing to a larger kit.

## What is prepared

- Four **1254 × 1254 RGBA PNGs**: bongo pair, kick, snare, and closed hi-hat. They match the existing coral toy character's rounded plastic finish, cream details, small navy eyes, and floating shapes without feet. The hat uses the existing butter-gold family. Full prompts and art hashes are in `art/`.
- **Ten core WAVs**, two takes each for high bongo, low bongo, kick, snare, and closed hat.
- **Two optional open-hat WAVs**. These share the hi-hat character for asset review; an open pose has not been drawn.
- Unmodified source **WAV/FLAC recordings**, pinned source URLs and hashes, both complete CC0 licenses, original source README snapshots, processing records, and numerical checks.
- Two short **offline audition renders at 100 BPM**: bongos alone and the five core voices together. These illustrate a possible balance, not implemented gameplay.
- A portable ZIP containing the assets and listening sheet.
- A **64 × 64 transparent kick favicon**, exported from the existing artwork for the subsequent web favicon request. The original image remains intact.

The PNGs preserve the original artwork. The current game renders matching interactive 3D meshes and portraits, exported separately in `public/art/geometric-toys/`. Every core hit uses its natural pitch and full recorded tail; two takes alternate. Scene files and the selected-piece Instrument menu support all five percussion choices.

## Sources and rights

**[Versilian Community Sample Library](https://github.com/sgossner/VCSL)** supplies the bongos and hats. Its repository and [publisher page](https://versilian-studios.com/vcsl/) identify the samples as CC0/public-domain material, available for commercial software and redistribution. The source commit is `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e`.

**[Virtuosity Drums](https://github.com/sfzinstruments/virtuosity_drums)** supplies the actual drum-kit kick and snare. The [publisher page](https://versilian-studios.com/virtuosity-drums/) and repository license identify it as CC0. The source commit is `9f04cf9a734527edfbb0a4eee1f674e45bbf71bc`. The kick uses the close kick microphone with snares off; the snare uses the close snare microphone with snares on. The source is an acoustic jazz kit, so this is a starting acoustic palette, not a heavily processed electronic kit.

Credits retained voluntarily: **Versilian Studios LLC; Karoryfer Samples; Virtuosity Drums performer Austin McMahon**. Attribution is not a condition of these CC0 recordings. Exact recordings, licenses, and original URLs are in `selection.json` and `manifest.json`.

Artwork was created for this project using built-in Image Gen with the existing `public/art/geometric-toys/beat.png` as a style reference. The CC0 designation above describes the imported audio, not an upstream license for generated artwork. No proprietary reference recordings were imported into this pack.

## Qualities that should match

| Quality | Preparation and selection decision |
|---|---|
| Timbre | Acoustic hand/drum/cymbal recordings, without added EQ, compression, pitch shift, or reverb. Close drum microphones reduce room character; bongo and hat mid microphones retain their original acoustic character. Two libraries do not imply identical microphones or rooms. Human listening remains the acceptance step. |
| Attack timing | Remove avoidable leading silence, retaining 1 ms before the measured attack and applying a 0.125 ms edge fade. All derived samples have a measured onset within 2 ms at the documented threshold. This measures file onset, not end-to-end game latency. |
| Duration | Preserve natural decay. Only trim the very quiet tail, retaining at least 99.9% of source energy and using a quiet 10 ms end fade. Do not force all instruments to the same length. |
| Level | Match take peaks within each voice. Kick peaks at −6 dBFS; bongos/snare at −9 dBFS; hats at −15 dBFS. Peak matching is not equal perceived loudness, and future dense mixtures still need master headroom. The audition render uses lower per-hit gains. |
| Channels | Mono prepared files suit a separately positioned source per node. Original stereo recordings are preserved. A cancellation check rejects a downmix losing more than 6 dB of RMS relative to the original channels. |
| Sample rate | All prepared WAVs are 48 kHz; the 44.1 kHz sources are band-limited resampled. The eventual playback engine must still honor its actual audio context/device rate. |
| Bit depth / bit rate | Signed 16-bit PCM with deterministic TPDF dither. This is **768 kb/s per mono WAV** (96,000 bytes per second), not an MP3 quality setting. More bits would not restore detail absent from 16-bit originals. Original 24-bit FLACs remain intact. |
| Pitch and tempo | High/low bongos retain their source tuning; no common musical key is imposed. Percussion one-shots have no required BPM and are not stretched. 100 BPM belongs only to the demo rhythm. |
| Repetition | Two source round robins for bongos, kick, and hats. The snare alternates are neighboring velocity layers 12 and 13, level-matched for comparison; they are **not** true same-layer round robins or a complete velocity bank. |
| Noise and tails | DC bias, onset, retained energy, mono cancellation, sample peaks, and estimated true peaks are recorded. Natural room/noise content is not erased with a gate. Source and prepared versions remain available for judgment. |

Future playback should let the drum tails ring. A closed hat should choke an open hat belonging to the same instrument/node if that optional articulation is enabled. Keep different nodes' voices independent for spatial routing. These are handoff notes, not code changes.

## Reproduce and inspect

`prepare.py` requires NumPy plus `ffmpeg` and `ffprobe`. It reads `selection.json`, preserves source files, verifies their SHA-256 hashes, makes the mono PCM WAVs, performs numerical checks, and renders the demo WAVs. It writes only inside this folder.

```sh
python3 prepare.py --download
python3 make_preview.py
```

This computer's bundled Python with NumPy is `/Users/jeremyguillory/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`. FFmpeg's built-in swresample engine was used with a 64-tap filter, phase shift 10, and cutoff 0.97; no new dependencies were installed.

`validation.json` records the completed technical and browser checks and their scope. Numerical checks and successful decoding do not establish that the samples are artistically approved. This asset-preparation task does not establish main-game, venue, device, or scheduling acceptance.
