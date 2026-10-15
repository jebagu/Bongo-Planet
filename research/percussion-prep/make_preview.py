"""Render a static, portable asset listening sheet from the manifest."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
manifest = json.loads((ROOT / "manifest.json").read_text())
roles = {
    "bongo-high": ("High bongo", "A warm, bright tap for answering phrases."),
    "bongo-low": ("Low bongo", "A rounder hand-drum voice to pair with the high tap."),
    "kick": ("Kick", "Low weight for the main pulse."),
    "snare": ("Snare", "A short crack for the backbeat."),
    "hat-closed": ("Closed hi-hat", "A quiet metallic tick for the spaces between hits."),
    "hat-open": ("Open hi-hat", "Optional: a longer accent, reserved for later."),
}
rows = []
for voice, (label, description) in roles.items():
    samples = [s for s in manifest["samples"] if s["voice"] == voice]
    takes = []
    for sample in samples:
        duration = sample["prepared"]["seconds"]
        takes.append(f'''<div class="take"><div class="take-label"><span>Take {sample['variant']}</span><span>{duration:.2f} s</span></div>
        <audio controls preload="metadata" aria-label="{label}, take {sample['variant']}" src="{sample['path']}"></audio>
        <a class="original" href="{html.escape(sample['original_path'])}" download>Original {Path(sample['original_path']).suffix[1:].upper()}</a></div>''')
    rows.append(f'''<article class="sound {'optional' if voice == 'hat-open' else ''}">
    <div class="sound-title"><h3>{label}</h3><p>{description}</p><span class="source">{'Virtuosity Drums' if samples[0]['library'] == 'virtuosity' else 'VCSL'} · CC0</span></div>
    {''.join(takes)}</article>''')

art = [("bongos", "Bongos", "Two drums, one conversation"), ("kick", "Kick", "The pulse"),
       ("snare", "Snare", "The backbeat"), ("hi-hat", "Hi-hat", "A little motion")]
cards = ''.join(f'''<figure><div class="art"><img src="art/{id}.png" alt="{label}: rounded toy percussion artwork with small navy eyes" width="1254" height="1254"></div>
<figcaption><strong>{label}</strong><span>{subtitle}</span><a href="art/{id}.png" download>PNG ↓</a></figcaption></figure>''' for id, label, subtitle in art)
template = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bongo Planet · Percussion assets</title><link rel="icon" type="image/png" sizes="64x64" href="favicon-kick.png">
<style>
:root{color-scheme:light;--ink:#15234e;--muted:#68718a;--paper:#fff8ed;--line:#e8dfd1;--coral:#ff9685}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:ui-rounded,"Avenir Next",system-ui,sans-serif;line-height:1.5}
main{max-width:1160px;margin:auto;padding:36px 32px 64px}nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:36px;font-size:13px}
nav strong{font-size:18px;letter-spacing:-.5px}.status{background:#efe9ff;padding:7px 12px;border-radius:24px;font-weight:600}
header{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:24px}.eyebrow{text-transform:uppercase;letter-spacing:2px;font-size:11px;font-weight:700;margin:0 0 8px;color:var(--muted)}
h1{font-size:clamp(36px,5.5vw,62px);line-height:1.05;letter-spacing:-2.5px;margin:0 0 16px;max-width:750px}header p{max-width:630px;color:var(--muted);font-size:16px;margin:0}
a{color:var(--ink);text-underline-offset:3px}.download{white-space:nowrap;background:var(--ink);color:#fff;padding:12px 19px;border-radius:12px;text-decoration:none;font-weight:650;font-size:14px}
.art-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:30px 0 32px}figure{margin:0;background:#fffdf8;border:1px solid var(--line);border-radius:22px;overflow:hidden}
.art{aspect-ratio:1.05;display:flex;align-items:center;justify-content:center;padding:8px;background:linear-gradient(145deg,#fffdf8,#f6ecdf)}.art img{display:block;width:100%;height:100%;object-fit:contain}
figcaption{display:grid;grid-template-columns:1fr auto;padding:15px 18px 19px;border-top:1px solid var(--line);gap:3px 6px}figcaption strong{font-size:18px;letter-spacing:-.4px}figcaption span{grid-column:1/-1;color:var(--muted);font-size:11px}figcaption a{grid-row:1;grid-column:2;font-size:11px;align-self:center}
.listen{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0 38px}.demo{border-radius:18px;background:#f4ded4;padding:20px 22px}.demo:nth-child(2){background:#efe9cf}.demo h3{margin:0;font-size:19px}.demo p{margin:4px 0 14px;font-size:13px;color:#525d76}
audio{display:block;width:100%;height:36px}h2{font-size:26px;letter-spacing:-.8px;margin:0 0 3px}.section-note{font-size:13px;color:var(--muted);margin:0 0 18px}
.sound{display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center;padding:19px 0;border-top:1px solid var(--line)}.sound h3{margin:0;font-size:17px}.sound p{font-size:12px;color:var(--muted);max-width:270px;margin:3px 0 7px}.source{font-size:10px;letter-spacing:.4px;color:#69718a}.take-label{display:flex;justify-content:space-between;color:var(--muted);font-size:11px;margin-bottom:7px}.original{display:inline-block;font-size:10px;color:var(--muted);margin-top:5px}
.optional{border-bottom:1px solid var(--line);opacity:.9}.download[hidden]{display:none}.facts{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.facts span{border:1px solid var(--line);border-radius:99px;padding:6px 11px;font-size:11px}
details{padding:18px 0;border-top:1px solid var(--line)}summary{font-size:14px;font-weight:650;cursor:pointer}details p{color:var(--muted);font-size:13px;max-width:850px}.foot{margin-top:20px;font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:12px 22px}
@media(max-width:800px){main{padding:22px 20px 40px}header{display:block}.download{display:inline-block;margin-top:20px}.art-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sound{gap:14px;grid-template-columns:minmax(140px,.9fr) minmax(0,1fr) minmax(0,1fr)}h1{letter-spacing:-1.8px}.status{font-size:10px}}
@media(max-width:560px){nav{padding-bottom:24px;gap:8px}nav strong{font-size:16px}.listen{grid-template-columns:1fr}.sound{grid-template-columns:1fr 1fr;gap:12px}.sound-title{grid-column:1/-1}.sound p{max-width:none}.art-grid{gap:10px}figcaption{padding:12px}figcaption strong{font-size:16px}figcaption span{font-size:10px}.demo{padding:18px}}
</style></head><body><main>
<nav><strong>Bongo Planet</strong><span class="status">Prepared for review · October 14</span></nav>
<header><div><p class="eyebrow">Percussion shelf</p><h1>A little rhythm section.</h1><p>Bongos for character. A kick for weight. A snare for the backbeat. A closed hi-hat to keep things moving.</p></div>
<a class="download" href="Bongo-Planet-Percussion-Assets.zip" download>Download asset pack ↓</a></header>
<div class="art-grid">ART_CARDS</div>
<h2>Hear them together</h2><p class="section-note">Two four-bar sketches at 100 BPM. Play starts when you choose. No effects added.</p>
<div class="listen"><article class="demo"><h3>Just the bongos</h3><p>High and low drums answering each other.</p><audio controls preload="metadata" aria-label="Bongo rhythm demo" src="demos/bongos.wav"></audio></article>
<article class="demo"><h3>The whole little kit</h3><p>Five core voices, with quieter hats and room to breathe.</p><audio controls preload="metadata" aria-label="Whole percussion kit demo" src="demos/whole-kit.wav"></audio></article></div>
<h2>Choose a sound</h2><p class="section-note">Two takes for each voice. Originals are preserved for comparison. The open hat is an optional extra.</p>
SOUND_ROWS
<div class="facts"><span>48 kHz</span><span>16-bit PCM WAV</span><span>Mono</span><span>CC0 samples</span><span>Natural tails</span><span>No added reverb</span></div>
<details><summary>Selection and preparation notes</summary><p>Ten core WAVs and two optional open-hat WAVs. Bongos and hats come from <a href="https://github.com/sgossner/VCSL">VCSL</a>; the close-miked kick and snare come from <a href="https://github.com/sfzinstruments/virtuosity_drums">Virtuosity Drums</a>. Both audio sources are CC0.</p>
<p>Attack silence was aligned, very quiet ends were trimmed, and levels were matched within each voice. Hats sit below drums. Lengths differ naturally. The snare takes are adjacent source velocity layers, rather than two true round robins. Artwork was generated to match the existing Bongo Planet toy style.</p>
<p>The five core percussion voices are now in the Bongo Planet instrument picker, with natural-pitch playback and matching 3D characters. This shelf preserves the original PNG artwork, source recordings, and offline audio sketches. The open hat remains an optional research asset.</p></details>
<div class="foot"><a href="README.md">Selection guide</a><a href="manifest.json">Audio manifest</a><a href="art/prompts.json">Artwork prompts</a><a href="validation.json">Validation record</a></div>
</main><script>
document.querySelectorAll('audio').forEach(player=>player.addEventListener('play',()=>document.querySelectorAll('audio').forEach(other=>{if(other!==player)other.pause()})));
if(location.protocol==='file:')document.querySelector('.download').hidden=true;
</script></body></html>
'''
(ROOT / "index.html").write_text(template.replace("ART_CARDS", cards).replace("SOUND_ROWS", ''.join(rows)))
print("Wrote portable asset listening sheet.")
