"""Download a compact CC0 VCSL audition selection at a pinned Git commit."""
import concurrent.futures
import hashlib
import io
import json
import urllib.parse
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COMMIT = 'c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e'
SELECTION = [
    ('Mbira', 48, 'Idiophones/Plucked Idiophones/Mbira Mavembe (Gandanga), Zimbabwe, Low G/Mbira5_Normal_MainSpirit_C3_k9_vl2_rr1.wav'),
    ('Marimba', 60, 'Idiophones/Struck Idiophones/Marimba/Marimba_hit_Outrigger_C4_med_01.wav'),
    ('Wine glass', 63, 'Idiophones/Friction Idiophones/Wine Glasses/Sustains/Fast/glass1_D#4_Fast_1_main.wav'),
    ('Soft vibraphone', 48, 'Idiophones/Struck Idiophones/Vibraphone/Soft Mallets/Vibes_soft_C3_v2_rr1_Main.wav'),
    ('Concert harp', 48, 'Chordophones/Composite Chordophones/Concert Harp/KSHarp_C3_mf3.wav'),
    ('Grand piano', 48, 'Chordophones/Zithers/Grand Piano, Kawai/Sustains/GPiano_sus_C3_v1_rr1_Player.wav'),
    ('FM piano', 48, 'Electrophones/TX81Z/FM Piano/FMPiano_C3_vl2.wav'),
    ('High bongo', None, 'Membranophones/Struck Membranophones/Bongos/BongoH_Hit1_v2_rr1_Mid.wav'),
    ('Low bongo', None, 'Membranophones/Struck Membranophones/Bongos/BongoL_Hit1_v2_rr1_Mid.wav'),
]


def fetch(item):
    name, root_note, source_path = item
    url = 'https://raw.githubusercontent.com/sgossner/VCSL/' + COMMIT + '/' + urllib.parse.quote(source_path, safe='/')
    data = urllib.request.urlopen(url, timeout=60).read()
    with wave.open(io.BytesIO(data)) as reader:
        details = {'channels': reader.getnchannels(), 'sample_rate': reader.getframerate(),
                   'bits': reader.getsampwidth() * 8,
                   'duration_seconds': reader.getnframes() / reader.getframerate()}
        assert len(reader.readframes(reader.getnframes())) == reader.getnframes() * reader.getnchannels() * reader.getsampwidth()
    filename = name.lower().replace(' ', '-') + '.wav'
    (ROOT / 'assets' / filename).write_bytes(data)
    return {'name': name, 'root_midi': root_note, 'path': 'assets/' + filename,
            'source_url': url, 'source_path': source_path, 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest(), 'license': 'CC0-1.0', **details}


if __name__ == '__main__':
    (ROOT / 'assets').mkdir(exist_ok=True)
    (ROOT / 'licenses').mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        samples = list(pool.map(fetch, SELECTION))
    license_url = f'https://raw.githubusercontent.com/sgossner/VCSL/{COMMIT}/LICENSE'
    (ROOT / 'licenses' / 'VCSL-CC0.txt').write_bytes(urllib.request.urlopen(license_url).read())
    manifest = {'source': 'Versilian Community Sample Library', 'repository': 'https://github.com/sgossner/VCSL',
                'commit': COMMIT, 'license': 'CC0-1.0', 'samples': samples,
                'scope': 'Representative audition notes; not full multi-sampled instrument banks'}
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps([{'name': r['name'], 'bytes': r['bytes'], 'seconds': r['duration_seconds']} for r in samples]))
