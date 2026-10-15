# Mario Paint composer assets for Bongo Planet

Extracted on October 11, 2026 from the user-supplied **Mario Paint – Joystick modification (1.0)** ROM. The original file was read without modification. This is a research and import package; Bongo Planet's application code and current synthesized voices were not changed.

Preview: **http://127.0.0.1:5417/BongoPlanet/research/mario-paint/index.html**. This uses the existing pinned project server. The permanent project URL remains http://127.0.0.1:5417/BongoPlanet/.

## Sound Lab webpage

The page includes all 15 icons, clickable original notes, a 13-note playback sequence, waveform previews, downloads, volume and Stop. The sample-synth section plays the raw source at `2^(semitones/12)` times its reference speed, with optional native loop boundaries and a simple browser envelope. Doubling speed raises pitch one octave; halving speed lowers it one octave. This demonstration illustrates sampling, while the original-note WAVs preserve the game's actual pitch tables and envelopes.

The 13 WAVs per instrument are exports of the 13 native staff positions, **not 13 different source recordings**. A compact Bongo Planet sampler could reuse the 16 composer source samples and recreate pitch, envelope and loop settings instead. Raw sources require instrument tuning; their nominal 32 kHz rate does not identify a concert-pitch root note.

`npm run build` now includes the page and its assets in `dist/research/mario-paint/`; `npm run preview` serves them at the same URL as development. The previous page was absent from the built output, so this URL returned the main app through Vite's SPA fallback. Audio is resumed from a user click before file loading, with visible errors and an optional check that decodes all 195 notes.

Run `node research/mario-paint/tools/validate-preview.mjs` against the built preview for the HTTP route and asset checks. `preview-validation.json` records the separate in-app browser playback and responsive checks; `http-validation.json` records the serving checks.

## What is included

| Folder / file | Contents | Intended use |
|---|---|---|
| `assets/icons/` | All 15 native 16 × 16 transparent RGBA PNG icons, plus nearest-neighbor 128 × 128 copies | Instrument picker / sound-node artwork |
| `assets/notes/` | 195 mono, signed 16-bit, 32 kHz WAVs: every instrument at every native staff position | Easiest route to the current mono audio system |
| `assets/stereo-notes/` | The same 195 notes with native channel balance and phase | Preserve the original stereo settings for later use |
| `assets/raw/sample-*.brr` | All 23 compressed samples in the music-tool bank, copied byte-for-byte from the ROM | Preserve original source data / build a reusable sampler |
| `assets/decoded-samples/` | All 23 samples decoded to mono PCM without voice envelopes, pitch shifts or interpolation | Sample editing; use the manifest's loops and tuning |
| `assets/manifest.json` | Icon mapping, sample IDs, note tables, envelope bytes, tuning, volume, pan, loop positions, ROM offsets, hashes and rendering metadata | Import contract and provenance |
| `assets/instrument-contact-sheet.png` | Labeled visual inventory | Quick reference |
| `assets/raw/` | Composer ARAM image, graphics in native 4bpp, palette, tilemaps and three preset song data files | Further reverse engineering / regeneration |
| `source-reference/` | Pinned disassembly reference text and its license | Evidence for offsets and behavior |
| `tools/`, `extract.py`, `render_notes.py` | Reproducible extraction and isolated SPC700 renderer with its source and library license | Rebuild from a supplied ROM |

The raw decoder's 32 kHz rate is a **reference rate**, not a declaration that every sample's natural root pitch occurs at 32 kHz. Raw decoded samples do not sound like finished composer notes until their pitch, envelope and loop behavior are applied.

## Instrument mapping

Timbre names are descriptive; the ROM stores IDs and settings rather than human instrument names. Different descriptions such as “piano” versus “xylophone” occur in fan references, so the stable identifier is the icon.

| Composer ID | Icon | Primary BRR sample | Timbre description |
|---|---|---|---|
| 0 | Mario | `0D` | Mallet / xylophone |
| 1 | Mushroom | `01` | Tom / drum |
| 2 | Yoshi | `0F` | Yoshi voice |
| 3 | Star | `04` | Music box |
| 4 | Flower | `0C` | Trumpet |
| 5 | Game Boy | `08` | Pulse wave |
| 6 | Dog | `03` | Bark |
| 7 | Cat | `02` | Meow |
| 8 | Pig | `07` | Oink |
| 9 | Swan | `09` | Orchestra hit |
| 10 | Baby | `0E` | Baby voice |
| 11 | Airplane | `06` | Bowed strings |
| 12 | Boat | `00`, then `10` | Drum / cymbal split |
| 13 | Car | `05` | Organ |
| 14 | Heart | `0A` | Bass pluck |

There are **16 distinct samples used by these 15 instruments**. Boat slots 1–6 use sample `00`; slots 7–13 use sample `10`. The remaining seven bank entries are auxiliary / unused sound sources. The research reference identifies `12` as the click, `13` as the undo-dog sound and `16` as the erase squeak; these auxiliary names have not been confirmed through full-console interaction. All seven are retained, including short or silent entries. Do not expose all 23 as composer instruments.

## How the composer works

These observations are supported by the supplied ROM's tables and the pinned disassembly. They describe the native composer, rather than extended features of later PC remakes.

**It is a sampler, not a General MIDI synthesizer.** The SPC700 audio processor reads BRR compressed PCM. Each instrument adds tuning, an ADSR envelope, volume, pan / phase, a duration limit, and a 13-entry note lookup. A single sample therefore yields several notes without storing a separate waveform for each pitch.

**The icon is the instrument; vertical placement chooses a staff slot.** There are 13 selectable staff positions, represented as values 1–13. Files use the visual labels `B3, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5, G5`. These labels identify positions on the treble staff. They are **not universal sounding pitches**: instruments use different note tables and sample tuning, and some tables are irregular or percussive. The native editor's 13-position interface does not provide a chromatic keyboard.

**A score has 96 time columns, with up to three entries per column.** Working song data occupies 576 bytes: three little-endian 16-bit entries for each of 96 columns. The low byte carries the note position, while the high byte carries instrument / display information. Empty entries use `FFFF`; display flags must not be confused with an instrument ID. This is the source of its three-note chord limit. A column is one beat; 4/4 grouping gives 24 measures and 3/4 gives 32. The song's meter and loop settings are stored separately from note content.

**The main CPU sends compact note commands.** The composer packs `((instrumentId + 1) << 4) | staffPosition` into an APU command byte. Its three score entries go through separate queues / ports. The SPC700 maps that command to sample, volume, pan, pitch-table entry and fine detune. The sample IDs are a different numbering system from the icon IDs; use the manifest, not `iconId == sampleId`.

**Note envelopes are instrument-specific.** A note is not necessarily held for the full beat. The driver applies its duration limit and envelope; tempos affect when notes are triggered. The engine's music-tool gate table ranges from 9 to 47 ticks for the main instrument entries. Looping BRR samples sustain through a region until the gate releases them. Copying just a raw waveform or giving every instrument the same duration loses that character.

**Pan includes phase inversion.** The lower pan bits encode position and the upper bits encode phase inversion. Most instrument entries are `CA`, mushroom is `CD`, and boat is `C7`. A byte such as `CA` is not a normalized pan value of 202. Preserve signed left / right gains when reproducing it; stereo renders retain this behavior, while mono files contain their arithmetic average.

**The sound bank is not a song.** BRR assets and settings are distinct from score data. The three included preset `.bin` files are native composer score / metadata examples, not MIDI files or recordings. This extraction does not contain any user-created saved composition; that would require the corresponding cartridge SRAM / save file.

## Importing into Bongo Planet

For a first sampled-voice implementation, use the **195 baked mono WAVs** and native icons. Preload and decode the bank once, select a note by instrument ID and native staff slot, and play a new buffer voice at the trigger's committed onset. These exports already contain pitch, envelope and natural tail. Avoid applying the current synthesized note envelope on top unless deliberately changing the sound.

Keep Bongo Planet's angular travel delays, emission boundaries, trigger IDs, cancellation, 64-voice cap and mono master mix. Mario Paint's 96-column grid and three-entry limit are reference mechanics, not requirements to impose on the sphere. Its instruments provide an additional sound palette; they do not replace Bongo Planet's timing model.

The current sound contracts and `src/audio/synth.ts` support generated sine / triangle notes and synthesized percussion, rather than a sample bank. An import needs an explicit sampled voice or instrument ID, a defined pitch-selection policy, decoded buffers available to the audio render thread, and cancellation / voice stealing consistent with the current engine. Commit those choices with the other sound parameters at emission so subsequent edits do not retune an already emitted pulse.

Decide how the sphere's key / scale pitches map to this palette. A **native staff-slot mode** reproduces Mario Paint's choices, including its unusual tunings and boat split. A **freely transposable sampler mode** can follow arbitrary MIDI pitches, but first establish a root pitch per source sample and preserve the non-melodic / split behavior. Do not treat the filenames' staff labels as calibrated MIDI root notes. For an exact native palette, loading the baked files is safer than applying a universal semitone rate to one representative WAV.

For a smaller bank, use the 16 composer BRR sources or their decoded PCM. Implement loop start / end, per-instrument ADSR, native tuning and per-slot note lookup. The manifest retains all of those settings. PCM loop positions are in **frames**: BRR encodes 16 frames per nine-byte block. One-shot entries may have a pointer at their end; only enable looping when `endLoopFlag` is true. Repeated decoding through a loop has predictor-history subtleties, so a standalone decoded loop is not guaranteed to be bit-identical to the SNES DSP.

The current planning documents specify original synthesized sounds and original interface assets. This package records the requested reference assets; incorporating them into a shipped product would change that asset policy. The graphics and sounds are Nintendo-derived. Neither the disassembly's code license nor the renderer's library license grants a license to the game's artwork or sound recordings.

## Extraction evidence and limits

- Source: headerless 1 MiB LoROM; header title `MARIOPAINT`.
- SHA-256: `ef1b5c47d7c76de43492d9745def235fa24e01b9b6f5c636584b7ae639563ff2`.
- Composer upload begins at SNES address `$1C8000` / file offset `0E0000`. The BRR payload begins at `$1C8112` / file offset `0E0112` and spans `$8F60` bytes.
- All 23 extracted BRR ranges were checked against their exact bytes in the supplied ROM. The manifest records a hash for each source sample.
- The icon tiles come from `$0AC000` / file offset `054000`. Their sprite sheet uses four SNES bitplanes and the sprite palette at CGRAM colors 128–143, extracted from `$02FE00`. A native icon uses four 8 × 8 tiles. The sprite tile formula is `2 * (id + (id & ~7))` within this sheet.
- The composer sample, volume, pan, pitch-offset, pitch, fine-detune and duration tables were checked byte-for-byte against the pinned reference. Offsets therefore match this modified ROM in the extracted areas; that does not establish that the entire hack matches an unmodified cartridge.
- Every rendered note was checked against the **running original driver** for its selected sample ID, note-table value and fine pitch. There were 195 audible mono notes, zero saturated stereo renders and zero tails reaching the renderer's two-second limit. WAVs retain 16 frames before the first nonzero sample and 320 after the final nonzero sample; command latency is removed. Levels are not normalized.
- Rendering uses the ROM's unmodified SPC700 code, including its voice pitch / gate / envelope handling, inside Game_Music_Emu. The harness selects an isolated composer state, bypasses background song startup and disables echo. The library's fast DSP approximates some interpolation and timing. These are practical isolated instrument renders, **not claimed bit-perfect hardware recordings or full-console runtime captures**.
- The generic REA binary reader rejected the `.sfc` as an unsupported format. Extraction proceeded through the format-aware scripts included here.
- The rebuilt Sound Lab was tested against the production preview in the user's Codex in-app browser. All 195 WAVs decoded, all 15 icons loaded, one original note per instrument played, the complete 13-note sequence finished, and Stop cancelled scheduled voices. The sampler ran at 2× and 0.5× speed with its loop enabled and disabled, and the boat selected both source samples. Responsive tests used 390 × 844 and 1360 × 1100 viewport overrides; the in-app browser reported effective CSS widths of 312 and 1121 respectively, with no horizontal overflow. The graph produced a nonzero audio signal and no browser errors or warnings. Evidence: `preview-validation.json`, `http-validation.json` and desktop / mobile screenshots. These checks verify browser audio behavior, not a physical speaker listening test.

## Reproduce

Pillow is required for PNG extraction, and `clang++` is required for the bundled C++ renderer. No emulator application or ROM download is required. On this machine the bundled Python runtime provides Pillow:

```sh
/Users/jeremyguillory/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 research/mario-paint/extract.py \
  '/Users/jeremyguillory/Desktop/Mario Paint - Joystick (Mario Paint modification) (1.0).sfc'
/Users/jeremyguillory/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 research/mario-paint/render_notes.py
python3 research/mario-paint/package_assets.py
```

`extract.py` regenerates source assets and resets the manifest. Run `render_notes.py` afterward to regenerate the rendered note bank and add validation metadata, then `package_assets.py` to update the preview, file checksums and ZIP. The archive is checked for CRC integrity and the expected audio / raw sample counts. The supplied ROM is intentionally not included in the archive. Baked assets do not need the ROM or extraction tools for playback.

## Primary references

- [Yoshifanatic's Mario Paint disassembly](https://github.com/Yoshifanatic1/Mario-Paint-Disassembly/tree/730df333bd4110da7965e0ad063c1c5dcf894a73): bank layout, graphics upload paths, sprite formula, working score layout, SPC700 voice code and instrument tables. Snapshot: `source-reference/provenance.json`.
- [SPC700 composer sample bank](https://github.com/Yoshifanatic1/Mario-Paint-Disassembly/blob/730df333bd4110da7965e0ad063c1c5dcf894a73/MPAINT/SPC700/MusicToolSampleBank.asm): sample start / loop pointers and instrument envelope / tuning bytes.
- [SPC700 engine](https://github.com/Yoshifanatic1/Mario-Paint-Disassembly/blob/730df333bd4110da7965e0ad063c1c5dcf894a73/MPAINT/SPC700/Engine.asm): `CODE_24B1` and `DATA_254C` through `DATA_26A5` are the composer mapping and note tables.
- [Original investigator's composer research](https://forums.nesdev.org/viewtopic.php?t=16154): supplementary names and auxiliary sample identification; ROM verification takes precedence over descriptions there.
- [Game_Music_Emu](https://github.com/libgme/game-music-emu/tree/f68963b1de0633149b05732113d3c3113c6f63a1): isolated SPC700 / DSP renderer, with source hashes and license retained in `tools/spc-dsp/`.
