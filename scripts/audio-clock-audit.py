"""Independent read-only streaming audit of a completed dual-path capture."""
import hashlib
import json
import math
import mmap
import pathlib
import struct
import sys

root = pathlib.Path(sys.argv[1]).resolve()
report = json.loads((root / 'report.json').read_text())
if report.get('status') != 'captured-investigation' or not report.get('serverClosed') or not report.get('browserClosed'):
    raise RuntimeError('Capture must be completed and cleaned up before audit')
cleanup = report.get('cleanup') or {}
if report.get('errors') or report.get('cleanupError') or cleanup.get('error') or cleanup.get('pending') != 0 or cleanup.get('contextState') != 'closed' or not cleanup.get('tracksStopped'):
    raise RuntimeError('Capture or cleanup errors remain')
start, end = report['timerContextStart'], report['timerContextEnd']
if not all(map(math.isfinite, [start, end, report['elapsedSeconds'], report['requestedSeconds']])) or start >= end or report['elapsedSeconds'] < report['requestedSeconds'] or report['requestedSeconds'] <= 0:
    raise RuntimeError('Incomplete or nonfinite actual timer')
lag = 640  # Independently measured native route; never fitted to product PCM.
clicks = report['nativeCalibration']['clicks']
expected_clicks = report['setup']['clickTimes']
if len(clicks) != 12 or len(expected_clicks) != 12 or not all(map(math.isfinite, expected_clicks)) or expected_clicks != sorted(set(expected_clicks)) or any(not math.isfinite(row['offsetSamples']) or abs(row['offsetSamples'] - lag) > .01 for row in clicks):
    raise RuntimeError('Independent native calibration does not bind640 samples')

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

source_path = root / 'product-tap.f32'
input_path = root / 'virtual-input.f32'
first_timed = last_timed = None
first_context = last_context_end = None
# Retain a contiguous independent-index interval even if a clock repeats at
# either boundary. Do not silently discard an interior out-of-range timestamp.
with (root / 'quantums.jsonl').open() as metadata:
    for line in metadata:
        row = json.loads(line)
        if not math.isfinite(row['currentTime']) or not math.isfinite(row['currentFrame']):
            raise RuntimeError('Nonfinite recorded clock')
        if first_context is None:
            first_context = row['currentTime']
        last_context_end = row['currentTime'] + 128 / 48000
        if first_timed is None and row['currentTime'] >= report['timerContextStart']:
            first_timed = row['index']
        if row['currentTime'] < report['timerContextEnd']:
            last_timed = row['index']
if first_timed is None or last_timed is None or last_timed < first_timed:
    raise RuntimeError('No complete nonempty timed range')
if first_context > start or last_context_end < end:
    raise RuntimeError('Untouched metadata does not cover the entire actual timer')
source_samples = input_samples = blocks = compared = matched_samples = 0
source_repeats = input_repeats = 0
previous_source = previous_input = None
failures = []
detected_clicks = []
quiet_samples = 2401
with source_path.open('rb') as source_file, input_path.open('rb') as input_file:
    with mmap.mmap(source_file.fileno(), 0, access=mmap.ACCESS_READ) as source, mmap.mmap(input_file.fileno(), 0, access=mmap.ACCESS_READ) as actual_input:
        with (root / 'quantums.jsonl').open() as metadata:
            for line in metadata:
                row = json.loads(line)
                if row['index'] != blocks or row['sourceOffset'] != source_samples or row['inputOffset'] != input_samples:
                    raise RuntimeError('Original indices or metadata offsets do not match untouched files')
                if row['quantum'] != 128 or row['sourceLength'] != 128 or row['inputLength'] != 128:
                    raise RuntimeError('Unexpected actual quantum or channel sample length')
                sb = source[source_samples * 4:(source_samples + 128) * 4]
                ib = actual_input[input_samples * 4:(input_samples + 128) * 4]
                source_values, input_values = struct.unpack('<128f', sb), struct.unpack('<128f', ib)
                if not all(map(math.isfinite, source_values)) or not all(map(math.isfinite, input_values)):
                    raise RuntimeError('Nonfinite raw samples on an actual path')
                if row['currentTime'] <= expected_clicks[-1] + .15:
                    if any(value != 0 for value in source_values):
                        raise RuntimeError('Product tap was not silent during native calibration')
                    for offset, value in enumerate(input_values):
                        if abs(value) > .001:
                            if quiet_samples > 2400:
                                measured = (row['currentFrame'] + offset) / 48000
                                detected_clicks.append({'rawOffset': input_samples + offset, 'measured': measured, 'amplitude': value})
                            quiet_samples = 0
                        else:
                            quiet_samples += 1
                # Numeric constants include signed-zero variants; neither is
                # evidence of a repeated varying waveform.
                if sb == previous_source and len(set(source_values)) > 1:
                    source_repeats += 1
                if ib == previous_input and len(set(input_values)) > 1:
                    input_repeats += 1
                if first_timed <= blocks <= last_timed:
                    shifted = actual_input[(input_samples + lag) * 4:(input_samples + lag + 128) * 4]
                    compared += 1
                    if len(sb) == 512 and sb == shifted:
                        matched_samples += 128
                    elif len(failures) < 100:
                        failures.append({'observerIndex': blocks, 'sourceOffset': source_samples, 'inputOffsetAtLag': input_samples + lag})
                source_samples += 128
                input_samples += 128
                blocks += 1
                previous_source, previous_input = sb, ib
        if source_samples * 4 != len(source) or input_samples * 4 != len(actual_input):
            raise RuntimeError('Raw file length and every-quantum metadata disagree')
if len(detected_clicks) != 12:
    raise RuntimeError('Raw independent calibration does not contain12 native transitions')
for expected, detected in zip(expected_clicks, detected_clicks):
    if abs((detected['measured'] - expected) * 48000 - lag) > .01 or abs(detected['amplitude'] - .3) > 1e-6:
        raise RuntimeError('Raw native click fails fixed640-sample lag or declared amplitude')
scope = report['clockValidation']['timedScope']
if (first_timed, last_timed, compared) != (scope['firstObserverIndex'], scope['lastObserverIndex'], scope['blocks']):
    raise RuntimeError('Re-derived timed denominator disagrees with retained report')
result = {'scope': 'Independent complete raw/index/calibration readback; not human or full timing acceptance',
          'acceptancePassed': False, 'blocks': blocks, 'samplesPerPath': source_samples,
          'nativeClickCount': len(detected_clicks), 'rawNativeClicks': detected_clicks, 'fixedLagSamples': lag,
          'retainedCoverage': {'firstContextTime': first_context, 'lastContextEnd': last_context_end, 'timerStart': start, 'timerEnd': end},
          'timedBlocks': compared, 'exactlyMatchingTimedSamples': matched_samples,
          'mismatchesRetained': failures, 'allTimedBlocksMatch': compared > 0 and matched_samples == compared * 128,
          'sourceNonconstantAdjacentDuplicates': source_repeats,
          'inputNonconstantAdjacentDuplicates': input_repeats,
          'sourceSha256': digest(source_path), 'inputSha256': digest(input_path),
          'reportSha256': digest(root / 'report.json'),
          'auditorSha256': digest(pathlib.Path(__file__)),
          'limitations': ['Before-playback native clicks intentionally differ from the product tap.',
                          'No waveform identity, global timing uniqueness, physical output or listening claim.']}
print(json.dumps(result, indent=2))
if failures or not result['allTimedBlocksMatch']:
    sys.exit(1)
