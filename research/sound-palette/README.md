# Bongo Planet sound palette research

Prepared October 12, 2026. Listening page: **http://127.0.0.1:5417/BongoPlanet/research/sound-palette/index.html**.

## Recommendation

Start with a **small sample bank**: mbira/kalimba, marimba, glass, vibraphone, harp and bongos. Harmony Bloom's five built-in sounds turn out to be embedded acoustic guitar, glass, kalimba, piano and marimba recordings. A sampler is therefore a direct fit for the sound reference. Bells, plucks and restrained ambience should suit Bongo Planet's overlapping rhythmic patterns; this is a design recommendation, not an independent listening-quality ranking.

For personal experiments, the extracted Harmony Bloom and existing Mario Paint recordings are technically usable. For a freely licensed bank, the VCSL selection is the strongest immediate candidate. Retain source pitch, natural decay, and separate voice identity. In the venue, each node must remain an independently positioned audio source.

## Freely licensed samples and open-source engines

| Option | Sounds / role | Browser fit and assessment | License evidence |
|---|---|---|---|
| [Versilian Community Sample Library](https://github.com/sgossner/VCSL) | Real mbira, marimba, bowed wine glass, vibraphone, harp, acoustic and FM piano, bongos | Best immediate sample-source fit. Nine representative WAVs are downloaded and auditionable. Full multi-sampled banks are available upstream. | The repository explicitly releases the sounds under CC0; original license retained in `licenses/VCSL-CC0.txt`. |
| [Faust physical models](https://faustlibraries.grame.fr/libs/physmodels/) and [faustwasm](https://github.com/grame-cncm/faustwasm) | Modeled plucked strings, bars, membranes and resonators | Strong next step for controllable mallets, plucks and percussion. Faust supports WebAssembly and AudioWorklet output, including polyphonic instruments. More integration work than buffer playback; not compiled or benchmarked here. | Open-source projects. Select and retain the license declarations of the exact model and all dependencies before importing a particular patch. |
| [Tone.js](https://github.com/Tonejs/Tone.js) | [FMSynth](https://tonejs.github.io/docs/15.0.4/classes/FMSynth.html), [PluckSynth](https://tonejs.github.io/docs/15.0.4/classes/PluckSynth.html), filters, reverbs | Browser-native MIT framework. Useful for an isolated sound experiment or authored bell/pluck patches. Do not replace Bongo Planet's qualified transport or worklet scheduling just to gain timbres. Not integrated here. | MIT engine; this license does not cover unrelated samples loaded into it. |
| [SpessaSynth](https://github.com/spessasus/SpessaSynth) | SoundFont/DLS playback | Alternative if we want large ready-made instrument banks. The engine's TypeScript/worklet support fits the platform, but bank size and per-object routing need evaluation. | Apache-2.0 engine; sound banks have separate licenses. |
| [WebAudio TinySynth](https://github.com/g200kg/webaudio-tinysynth) | Compact synthesized General MIDI palette | Useful for lightweight nostalgic tones; lower priority than the real mallet/pluck recordings for this reference. Not auditioned here. | Apache-2.0 engine. |

The [FluidR3 browser exports](https://github.com/gleitz/midi-js-soundfonts) are an additional acoustic instrument source. The samples are listed as CC BY 3.0, separately from the repository's MIT code. Musyng Kite and FatBoy have different sample licenses. VCSL is simpler for this initial selection.

## Downloaded selection

Nine unmodified original WAVs: **mbira, marimba, wine glass, soft vibraphone, concert harp, grand piano, FM piano, high bongo and low bongo**. Sources are pinned to VCSL commit `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e`. Each WAV's original URL, source path, hash, duration and audio format are recorded in `manifest.json`. `prepare.py` reproduces the download. These are representative notes, not complete multi-sampled instrument banks; download additional roots and velocity layers when implementing a full musical range.

## Mario Paint

The existing `../mario-paint/` extraction contains **15 instruments, 16 composer source samples and 195 rendered mono notes**. The original-source bank is very compact. The Star music box, Mario mallet, Heart bass pluck and Mushroom percussion are useful palette candidates; Yoshi and the animal sounds give the game a playful voice.

For an immediate experiment, play the baked notes. For a compact sampler, reproduce source tuning, loops and the per-instrument envelope from its manifest. Raw sources alone do not preserve the finished timbre. Mario Paint's staff labels are not universal concert pitches. These are Nintendo-derived reference recordings, not open-source assets; the extraction scripts' licenses do not license the game audio.

## Audition behavior and limits

The standalone page has 20 cards: 9 CC0 samples, 5 Harmony Bloom samples and 6 Mario Paint examples. Each offers a raw HTML audio player, one note and an eight-note phrase. Phrase playback peak-matches samples with a conservative master level, short gate/release and optional shared synthetic room reverb. Harmony Bloom root pitch is approximately derived from the raw recording, not confirmed from native playback code. The Mario Paint phrase transposes a finished native note for illustration rather than reproducing every original staff slot.

Everything loads from the local project; no CDN is needed. The page uses Bongo Planet's existing pinned server. These assets have not been installed into the main game or its schema, and this standalone page is not added to the production build by this research task. Browser decoding, controls and the desktop layout check are recorded in `validation.json`; mobile layout and acoustic listening quality are not verified here.
