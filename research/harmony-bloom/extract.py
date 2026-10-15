"""Extract the five WAV resources from the user's installed Harmony Bloom.

Read-only source inspection. Uses the shipped JUCE resource-name table and
matching temp_binary_data_N symbols rather than guessing names from WAV order.
"""
import hashlib
import io
import json
import re
import struct
import subprocess
import wave
from pathlib import Path

SOURCE = Path('/Applications/Harmony Bloom.app/Contents/MacOS/Harmony Bloom')
DEST = Path(__file__).resolve().parent


def extract():
    data = SOURCE.read_bytes()
    assert data[:4] == b'\xca\xfe\xba\xbe', 'Expected universal Mach-O'
    arches = [struct.unpack_from('>IIIII', data, 8 + 20 * i)
              for i in range(struct.unpack_from('>I', data, 4)[0])]
    arm = next(a for a in arches if a[0] == 0x0100000c)
    base, size = arm[2:4]
    image = data[base:base + size]
    assert image[:4] == b'\xcf\xfa\xed\xfe'
    segments = []
    pos = 32
    for _ in range(struct.unpack_from('<I', image, 16)[0]):
        command, length = struct.unpack_from('<II', image, pos)
        if command == 0x19:
            _, vm, _, filepos, filesz = struct.unpack_from('<16sQQQQ', image, pos + 8)
            segments.append((vm, filepos, filesz))
        pos += length

    def file_offset(address):
        for vm, filepos, filesz in segments:
            if vm <= address < vm + filesz:
                return base + filepos + address - vm
        raise ValueError(f'Unmapped virtual address {address:x}')

    output = subprocess.check_output(['nm', '-arch', 'arm64', str(SOURCE)], text=True)
    symbols = {}
    for line in output.splitlines():
        fields = line.split()
        if len(fields) == 3 and re.fullmatch('[0-9a-fA-F]+', fields[0]):
            symbols[fields[2]] = int(fields[0], 16)
    table = file_offset(symbols['__ZN10BinaryData17namedResourceListE'])
    labels = {'Acustic_Guitar_C3_wav': 'Acoustic guitar', 'Glass_C3_wav': 'Glass',
              'kalimba_C3_wav': 'Kalimba', 'Piano_C3_wav': 'Piano',
              'Sam_Marimba_Hita_C3_wav': 'Marimba'}
    resources = []
    for index in range(500):
        address = struct.unpack_from('<Q', data, table + 8 * index)[0]
        try:
            offset = file_offset(address)
            name = data[offset:data.index(0, offset)].decode('ascii')
        except (ValueError, UnicodeDecodeError):
            break
        if name not in labels:
            continue
        symbol = next(s for s in symbols if re.search(r'temp_binary_data_' + str(index) + r'E$', s))
        start = file_offset(symbols[symbol])
        assert data[start:start + 4] == b'RIFF' and data[start + 8:start + 12] == b'WAVE'
        length = struct.unpack_from('<I', data, start + 4)[0] + 8
        assert start + length <= base + size
        wav = data[start:start + length]
        with wave.open(io.BytesIO(wav)) as reader:
            params = {'channels': reader.getnchannels(), 'sample_rate': reader.getframerate(),
                      'bits': reader.getsampwidth() * 8, 'frames': reader.getnframes(),
                      'duration_seconds': reader.getnframes() / reader.getframerate()}
            assert len(reader.readframes(reader.getnframes())) == params['frames'] * params['channels'] * (params['bits'] // 8)
        filename = name.removesuffix('_wav') + '.wav'
        (DEST / 'assets' / filename).write_bytes(wav)
        resources.append({'name': labels[name], 'resource_name': name, 'resource_index': index,
                          'path': 'assets/' + filename, 'file_offset': start, 'bytes': length,
                          'sha256': hashlib.sha256(wav).hexdigest(), 'symbol': symbol,
                          'virtual_address': hex(symbols[symbol]), **params})
    assert len(resources) == 5
    # The universal executable contains the same payloads in both architecture slices.
    for resource in resources:
        wav = (DEST / resource['path']).read_bytes()
        resource['identical_payload_copies'] = data.count(wav)
        assert resource['identical_payload_copies'] == 2
    manifest = {'source_path': str(SOURCE), 'source_version': '1.3.92',
                'source_sha256': hashlib.sha256(data).hexdigest(), 'architecture': 'arm64',
                'method': 'JUCE namedResourceList index mapped to temp_binary_data_N symbol and RIFF length',
                'rea_manifest_id': 'agm_29fc91557c0a705349dffd743eeb75de28db81b8646b039d599f0eb013c5eaaf',
                'rea_evidence_id': 'ev_a53e22ad60fd6ad522a4aade31b55e5096deb993f8e257a54ef786c3d1ac742b',
                'license': 'Proprietary extracted reference assets; no open license established',
                'limitations': ['Raw sample extraction, not a reproduction of sampler envelopes, effects or preset sequences',
                                'C3 is the shipped filename; actual sampler root-note mapping is not established here'],
                'resources': resources}
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == manifest['source_sha256']
    (DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps([{k: r[k] for k in ['name', 'bytes', 'duration_seconds', 'identical_payload_copies']} for r in resources]))


if __name__ == '__main__':
    (DEST / 'assets').mkdir(exist_ok=True)
    extract()
