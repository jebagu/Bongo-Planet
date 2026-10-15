# Afrobeat Drum Loop

Afrobeat, 100 BPM. Interlocking high and low bongos weave around an asymmetrical kick line and an even eighth-note hat pulse. The snare stays light, with a short second-bar pickup so the hand drums carry the groove.

Choose **Load preset → Drum Loops → Afrobeat Drum Loop**, then **Play**. The two-bar musical phrase uses four finite spark lanes, 88 directed gates and all 92 junctions. Kick and snare lanes are two bars long, hats one bar, and bongos two beats. Empty junctions are rests. Every crossing is one sixteenth note.

Import `Bongo-Planet.json` for music and its complete look. The preset menu preserves your existing look. All sounds use the five recorded percussion instruments at their natural pitch and full length. Each lane begins one sixteenth after Play; all four share that same downbeat.

`Sunwheel.wav` is a four-bar stereo WAV rendered with the actual engine, synth and recordings. It starts on the musical downbeat, contains steady-state tails and both sample takes, and repeats directly. `validation.json` records exact written-hit/rest comparisons over eight phrases, bounded playback, headroom and matching repeated PCM. Recreate with `node_modules/.bin/tsx scripts/compose-drum-loops.ts`.
