#!/usr/bin/env python3
"""Read-only audit of real Bongo Planet mixture capture, without a product PCM oracle.

Only the new audit report is written. Original recordings, metadata and manifests
are never sorted, trimmed, repaired or overwritten. No timing qualification is
inferred from equality across two taps of the same product signal.
"""
from __future__ import annotations

import argparse
from bisect import bisect_left, bisect_right
from dataclasses import dataclass
import hashlib
import json
import math
import mmap
from pathlib import Path
import struct
import sys


RATE = 48000
QUANTUM = 128
PULSE = struct.pack('<f', .3)
EXPECTED_PLAN = [('F02', 64, 0), ('F03', 24, 0), ('F06', 20, 0),
                 ('F08', 20, 0), ('F02', 12, .1)]


def digest(file: Path) -> str:
    result = hashlib.sha256()
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


@dataclass(slots=True)
class Block:
    index: int
    frame: int
    time: float
    quantum: int
    source_offset: int
    input_offset: int
    source_length: int
    input_length: int
    source_channels: int
    input_channels: int


class Audit:
    def __init__(self, directory: Path):
        self.directory = directory
        self.errors: list[str] = []
        self.blocks: list[Block] = []
        self.first_emissions: dict[int, dict] = {}
        self.report = json.loads((directory / 'report.json').read_text())
        self.result: dict = {'title': 'Bongo Planet independent mixture capture audit',
                             'qualificationPassed': False, 'acceptancePassed': False,
                             'errors': self.errors, 'segments': [],
                             'method': 'Native direct rectangular clicks only establish route lag; product PCM is never fit or regenerated.'}

    def require(self, condition: bool, message: str) -> None:
        if not condition:
            self.errors.append(message)

    def read_events(self) -> None:
        count = 0
        batch_index = -1
        batch_identity = None
        segment_counts: dict[int | None, int] = {}
        with (self.directory / 'events.jsonl').open() as stream:
            for line in stream:
                row = json.loads(line)
                segment = row.get('segment')
                if segment is not None and (type(segment) is not int or not 0 <= segment < len(EXPECTED_PLAN)):
                    raise ValueError('Invalid retained event segment at original row ' + str(count))
                if row.get('independentEventIndex') != count or row.get('perSegmentEventIndex') != segment_counts.get(segment, 0):
                    raise ValueError('Retained event original/per-segment index changed at row ' + str(count))
                if type(row.get('eventBatchIndex')) is not int:
                    raise ValueError('Invalid event batch index')
                identity = (segment, row.get('receiveContextTime'), row.get('receiveBrowserMonotonicMs'))
                if row['eventBatchIndex'] != batch_index:
                    if row['eventBatchIndex'] != batch_index + 1:
                        raise ValueError('Retained event batch missing or out of order')
                    batch_index = row['eventBatchIndex']
                    batch_identity = identity
                elif identity != batch_identity:
                    raise ValueError('Retained event batch metadata changed within a batch')
                if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in identity[1:]):
                    raise ValueError('Nonfinite retained event receive clocks')
                event = row.get('event')
                if not isinstance(event, dict) or not isinstance(event.get('type'), str):
                    raise ValueError('Invalid retained full event')
                if segment is not None and event['type'] == 'emission' and segment not in self.first_emissions:
                    self.first_emissions[segment] = row
                count += 1
                segment_counts[segment] = segment_counts.get(segment, 0) + 1
        self.require(count > 0 and count == self.report.get('stats', {}).get('events'),
                     'Retained full event count disagrees with capture statistics')
        self.require(batch_index + 1 == self.report.get('stats', {}).get('eventBatches'),
                     'Retained full event batch count disagrees with capture statistics')
        self.result['events'] = {'events': count, 'batches': batch_index + 1,
                                 'segmentCounts': {str(key): value for key, value in segment_counts.items()},
                                 'sha256': digest(self.directory / 'events.jsonl'),
                                 'preservedOriginalOrder': True}

    def read_blocks(self) -> None:
        source_offset = input_offset = 0
        anomalies = []
        max_residual = 0.0
        with (self.directory / 'quantums.jsonl').open() as stream:
            for line in stream:
                data = json.loads(line)
                integer_names = ['index', 'currentFrame', 'quantum', 'sourceOffset', 'inputOffset',
                                 'sourceLength', 'inputLength', 'sourceChannels', 'inputChannels']
                if not all(type(data.get(name)) is int and data[name] >= 0 for name in integer_names):
                    raise ValueError('Invalid integer metadata at original line ' + str(len(self.blocks)))
                block = Block(data['index'], data['currentFrame'], data['currentTime'], data['quantum'],
                              data['sourceOffset'], data['inputOffset'], data['sourceLength'],
                              data['inputLength'], data['sourceChannels'], data['inputChannels'])
                if not isinstance(block.time, (int, float)) or not math.isfinite(block.time):
                    raise ValueError('Nonfinite metadata clock at original index ' + str(block.index))
                if block.index != len(self.blocks) or block.source_offset != source_offset or block.input_offset != input_offset:
                    raise ValueError('Original index/offset discontinuity at line ' + str(len(self.blocks)))
                if block.quantum != QUANTUM:
                    self.errors.append('Unexpected actual quantum at original index ' + str(block.index))
                if self.blocks:
                    step = block.frame - self.blocks[-1].frame
                    if step != self.blocks[-1].quantum:
                        anomalies.append({'index': block.index, 'frameStep': step})
                max_residual = max(max_residual, abs(block.time * RATE - block.frame))
                source_offset += block.source_length
                input_offset += block.input_length
                self.blocks.append(block)
        self.require(bool(self.blocks), 'Empty observer metadata')
        self.result['metadata'] = {'blocks': len(self.blocks), 'sourceSamples': source_offset,
                                   'inputSamples': input_offset, 'clockAnomalies': anomalies,
                                   'maxClockResidualSamples': max_residual,
                                   'preservedOriginalOrder': True}
        self.require(max_residual < .01, 'Clock metadata residual exceeds fractional-sample tolerance')
        for name, samples in [('product-tap', source_offset), ('virtual-input', input_offset)]:
            file = self.directory / (name + '.f32')
            self.require(file.stat().st_size == samples * 4, name + ' raw length disagrees with metadata')
            finite = nonfinite = 0
            peak = 0.0
            with file.open('rb') as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    if len(chunk) % 4:
                        raise ValueError('Partial float in ' + name)
                    for (value,) in struct.iter_unpack('<f', chunk):
                        if math.isfinite(value):
                            finite += 1
                            peak = max(peak, abs(value))
                        else:
                            nonfinite += 1
            actual_hash = digest(file)
            self.result[name] = {'bytes': file.stat().st_size, 'samples': samples,
                                 'finiteSamples': finite, 'nonfiniteSamples': nonfinite,
                                 'peak': peak, 'sha256': actual_hash}
            self.require(nonfinite == 0, name + ' contains nonfinite PCM')
            self.require(actual_hash == self.report.get(name + 'RawSha256'), name + ' raw hash mismatch')

    def interval(self, start: float, end: float, label: str) -> tuple[list[Block], dict]:
        if not (math.isfinite(start) and math.isfinite(end) and end > start):
            raise ValueError('Invalid interval ' + label)
        # Bounds include intersecting edge blocks. The slice retains EVERY
        # original interior index, even when its clock repeats or reverses.
        first = next((i for i, b in enumerate(self.blocks) if b.time + b.quantum / RATE > start), -1)
        last = next((i for i in range(len(self.blocks) - 1, -1, -1)
                     if self.blocks[i].time < end), -1)
        selected = self.blocks[first:last + 1] if first >= 0 and last >= first else []
        complete = bool(selected) and all(b.quantum == QUANTUM and b.source_length == QUANTUM
                                         and b.input_length == QUANTUM and b.source_channels > 0
                                         and b.input_channels > 0 for b in selected)
        covered = (bool(selected) and selected[0].time <= start + .01 / RATE
                   and selected[-1].time + selected[-1].quantum / RATE >= end - .01 / RATE)
        # The capture preserves actual block order rather than pretending the
        # shared clock is monotonic. Repeated fields and their recovery jumps
        # must not remove raw interior blocks. Require enough actual samples
        # for the full declared interval; report clock gaps independently.
        ordered_samples = sum(block.quantum for block in selected)
        covered = covered and ordered_samples >= (end - start) * RATE - .01
        clock_gaps = [{'index': b.index, 'gapSamples': b.frame - previous.frame - previous.quantum}
                      for previous, b in zip(selected, selected[1:])
                      if b.frame != previous.frame + previous.quantum]
        details = {'startContextTime': start, 'endContextTime': end,
                   'firstOriginalIndex': selected[0].index if selected else None,
                   'lastOriginalIndex': selected[-1].index if selected else None,
                   'blocks': len(selected), 'orderedSamples': ordered_samples,
                   'clockStepAnomalies': clock_gaps, 'fullPaths': complete, 'contextCovered': covered}
        self.require(complete and covered, label + ' lacks full contiguous original path coverage')
        return selected, details

    def native_calibration(self, calibration: dict, source: mmap.mmap, input_pcm: mmap.mmap,
                           label: str) -> dict:
        clicks = calibration.get('clicks', [])
        self.require(len(clicks) == 12 and calibration.get('bypassesProductDelayAndTap') is True
                     and calibration.get('noProductPCMFit') is True, label + ' native schedule invalid')
        if not clicks:
            raise ValueError(label + ' missing calibration')
        support, coverage = self.interval(clicks[0]['expectedContextTime'] - .05,
                                          clicks[-1]['expectedContextTime'] + .25, label)
        if not support:
            raise ValueError(label + ' empty support')
        retained_before = calibration.get('retainedBlocksBefore')
        retained_after = calibration.get('retainedBlocksAfter')
        retained_bound = (type(retained_before) is int and type(retained_after) is int
                          and 0 <= retained_before < retained_after <= len(self.blocks)
                          and retained_before <= support[0].index
                          and support[-1].index < retained_after)
        self.require(retained_bound, label + ' native support is not bound to its own retained index interval')
        source_silent = all(all(value == 0 for (value,) in struct.iter_unpack(
            '<f', source[b.source_offset * 4:(b.source_offset + b.source_length) * 4])) for b in support)
        self.require(source_silent, label + ' product tap is not silent during independent native calibration')
        lo = support[0].input_offset
        hi = support[-1].input_offset + support[-1].input_length
        # A pulse must be exactly the retained native 48-sample float32 box,
        # with zero elsewhere. No threshold chosen from product attacks.
        detections = []
        non_native_samples = 0
        cursor = lo
        while cursor < hi:
            value = input_pcm[cursor * 4:cursor * 4 + 4]
            if value == PULSE:
                run_start = cursor
                while cursor < hi and input_pcm[cursor * 4:cursor * 4 + 4] == PULSE:
                    cursor += 1
                detections.append({'inputRawSampleIndex': run_start, 'samples': cursor - run_start})
            else:
                if struct.unpack('<f', value)[0] != 0:
                    non_native_samples += 1
                cursor += 1
        self.require(len(detections) == len(clicks) and all(d['samples'] == 48 for d in detections)
                     and non_native_samples == 0, label + ' actual rectangular click detections invalid')
        lags = []
        for expected, detected in zip(clicks, detections):
            frame = round(expected['expectedContextTime'] * RATE)
            # Reject an ambiguous native schedule lying inside duplicated
            # metadata frame coverage rather than picking a convenient clock.
            matches = [b for b in support if b.frame <= frame < b.frame + b.quantum]
            self.require(len(matches) == 1, label + ' scheduled native frame coverage is ambiguous')
            self.require(expected.get('samples') == 48 and expected.get('amplitude') == .3,
                         label + ' native click definition changed')
            if len(matches) == 1:
                baseline = matches[0].input_offset + frame - matches[0].frame
                lag = detected['inputRawSampleIndex'] - baseline
                lags.append(lag)
                detected.update({'independentExpectedFrame': frame, 'expectedInputRawIndexWithoutRoute': baseline,
                                 'nativeLagSamples': lag, 'mappingOriginalIndex': matches[0].index})
        agreed = len(lags) == 12 and len(set(lags)) == 1 and 0 <= lags[0] <= int(.2 * RATE)
        self.require(agreed, label + ' native click lags do not independently agree')
        return {'coverage': coverage, 'productTapSilent': source_silent,
                'retainedBlocksBefore': retained_before, 'retainedBlocksAfter': retained_after,
                'supportBoundToRetention': retained_bound,
                'nativeDetections': detections, 'nonNativeInputSamples': non_native_samples,
                'lagSamples': lags[0] if agreed else None, 'nativeLagAgreed': agreed}

    def compare(self, selected: list[Block], lag: int, source: mmap.mmap, input_pcm: mmap.mmap) -> dict:
        compared = mismatch_blocks = mismatch_samples = uncovered = 0
        first_mismatches = []
        input_offsets = [b.input_offset for b in self.blocks]
        for block in selected:
            source_start = block.source_offset * 4
            input_start = (block.input_offset + lag) * 4
            length = block.source_length * 4
            end_sample = block.input_offset + lag + block.source_length
            first_cover = bisect_right(input_offsets, block.input_offset + lag) - 1
            last_cover = bisect_left(input_offsets, end_sample) - 1
            supports = self.blocks[max(0, first_cover):last_cover + 1]
            full = (input_start >= 0 and input_start + length <= len(input_pcm) and bool(supports)
                    and all(b.input_length == QUANTUM and b.input_channels > 0 for b in supports))
            if not full:
                uncovered += 1
                continue
            expected = source[source_start:source_start + length]
            actual = input_pcm[input_start:input_start + length]
            compared += 1
            if actual != expected:
                mismatch_blocks += 1
                count = sum(expected[i:i + 4] != actual[i:i + 4] for i in range(0, length, 4))
                mismatch_samples += count
                if len(first_mismatches) < 12:
                    first_mismatches.append({'originalObserverIndex': block.index,
                                             'sourceRawSampleIndex': block.source_offset,
                                             'inputRawSampleIndex': block.input_offset + lag,
                                             'mismatchedSamples': count})
        return {'lagSamples': lag, 'requiredBlocks': len(selected), 'comparedBlocks': compared,
                'comparedSamples': compared * QUANTUM, 'uncoveredBlocks': uncovered,
                'mismatchBlocks': mismatch_blocks, 'mismatchSamples': mismatch_samples,
                'firstMismatches': first_mismatches,
                'fullExactEquality': bool(selected) and compared == len(selected) and mismatch_blocks == 0}

    def run(self) -> dict:
        r = self.report
        cleanup = r.get('cleanup') or {}
        self.require(r.get('status') == 'captured-observation' and r.get('captureErrorFree') is True
                     and not r.get('errors'), 'Capture did not complete without reported errors')
        self.require(r.get('browserClosed') is True and r.get('serverClosed') is True
                     and cleanup.get('contextState') == 'closed' and cleanup.get('tracksStopped') is True
                     and cleanup.get('pending') == 0 and cleanup.get('eventPending') == 0
                     and not cleanup.get('error'), 'Capture cleanup/drain not complete')
        self.require(r.get('setup', {}).get('sampleRate') == RATE
                     and r.get('setup', {}).get('inputLabel') == 'SPAT 8ch loopback (Virtual)',
                     'Capture sample rate or exact named input mismatch')
        self.require('--mute-audio' not in r.get('browserArguments', []), 'Captured Chrome output was muted')
        self.require(r.get('acceptancePassed') is False and r.get('qualificationPassed') is False,
                     'Capture incorrectly asserts acceptance or qualification')
        # Bind the actual retrieved assets and copied harness, not local dist.
        for phase in ['Before', 'After']:
            binding = r.get('served' + phase, {})
            self.require(binding.get('mainSha256') == r.get('mainHash')
                         and binding.get('processorSha256') == r.get('processorHash'),
                         'Retrieved asset binding missing/mismatched ' + phase)
            self.require(digest(self.directory / ('served-' + phase.lower() + '.html')) == binding.get('htmlSha256'),
                         'Retrieved HTML hash mismatch ' + phase)
        for name, expected in [(r['mainAsset'], r['mainHash']), (r['processorAsset'], r['processorHash'])]:
            self.require(digest(self.directory / 'source' / name) == expected, 'Retained production asset changed: ' + name)
        self.require(digest(self.directory / 'capture-harness.ts') == r.get('harnessSha256'), 'Captured harness hash mismatch')
        self.require(digest(self.directory / 'observer-worklet.js') == r.get('observerSha256'), 'Observer hash mismatch')
        self.require(digest(self.directory / 'topology.json') == r.get('topologySha256'), 'Topology hash mismatch')
        for name, expected in r.get('sourceHashes', {}).items():
            self.require(digest(self.directory / 'application-source' / name) == expected, 'Application source hash mismatch: ' + name)
        self.result['bindings'] = {'mainSha256': r.get('mainHash'), 'processorSha256': r.get('processorHash'),
                                   'captureHarnessSha256': r.get('harnessSha256'),
                                   'auditHarnessSha256': digest(Path(__file__)),
                                   'reportSha256': digest(self.directory / 'report.json'),
                                   'quantumsSha256': digest(self.directory / 'quantums.jsonl')}
        self.read_blocks()
        self.read_events()
        segments = r.get('segments', [])
        self.require(len(segments) == len(EXPECTED_PLAN), 'Original segment denominator changed')
        with (self.directory / 'product-tap.f32').open('rb') as source_stream, (self.directory / 'virtual-input.f32').open('rb') as input_stream:
            with mmap.mmap(source_stream.fileno(), 0, access=mmap.ACCESS_READ) as source, mmap.mmap(input_stream.fileno(), 0, access=mmap.ACCESS_READ) as input_pcm:
                previous_after = None
                for index, segment in enumerate(segments):
                    label = 'segment ' + str(index)
                    fixture, seconds, delay = EXPECTED_PLAN[index]
                    self.require(segment.get('index') == index and segment.get('fixture') == fixture
                                 and segment.get('seconds') == seconds and segment.get('delaySeconds') == delay,
                                 label + ' original plan mismatch')
                    fixture_path = self.directory / ('segment-' + str(index) + '-fixture.json')
                    self.require(digest(fixture_path) == segment.get('fixtureSha256')
                                 and json.loads(fixture_path.read_text()) == segment.get('scene'), label + ' full fixture binding mismatch')
                    elapsed = (segment['nodeMonotonicTimerEndMs'] - segment['nodeMonotonicTimerStartMs']) / 1000
                    self.require(elapsed >= seconds and segment.get('elapsedMonotonicSeconds', 0) >= seconds
                                 and segment.get('status') == 'captured-observation', label + ' real monotonic window incomplete')
                    epoch = segment['firstEmission']['event']['time']
                    actual_emission = self.first_emissions.get(index)
                    actual_first = ({key: actual_emission[key] for key in
                                     ['event', 'receiveContextTime', 'receiveBrowserMonotonicMs']}
                                    if actual_emission is not None else None)
                    emission_bound = actual_first == segment.get('firstEmission')
                    self.require(emission_bound, label + ' logical epoch does not equal its first retained actual emission')
                    start, end = segment['fixedAnalysisWindowContextStart'], segment['fixedAnalysisWindowContextEnd']
                    self.require(segment['firstEmission']['event'].get('type') == 'emission'
                                 and start == epoch and abs(end - start - seconds) < 1e-9,
                                 label + ' fixed logical epoch/window changed')
                    analysis, coverage = self.interval(start, end, label + ' analysis')
                    _, tail = self.interval(start, end + .2, label + ' actual lag tail')
                    _, timer = self.interval(segment['timerContextStart'], segment['timerContextEnd'], label + ' monotonic timer support')
                    expected_stalls = [100, 250] if fixture in ('F06', 'F08') else []
                    stalls = segment.get('stalls', [])
                    self.require([s.get('durationMs') for s in stalls] == expected_stalls, label + ' actual stall denominator mismatch')
                    for stall in stalls:
                        self.require(stall['startContextTime'] <= stall['independentlyExpectedGroupOnset'] <= stall['endContextTime']
                                     and stall['endBrowserMonotonicMs'] - stall['startBrowserMonotonicMs'] >= stall['durationMs'],
                                     label + ' fixed expected onset was not inside requested actual stall')
                    before = self.native_calibration(segment['calibrationBefore'], source, input_pcm, label + ' before')
                    after = self.native_calibration(segment['calibrationAfter'], source, input_pcm, label + ' after')
                    ordered_chain = (before['supportBoundToRetention'] and after['supportBoundToRetention']
                                     and before['coverage']['lastOriginalIndex'] < coverage['firstOriginalIndex']
                                     and before['retainedBlocksAfter'] <= after['retainedBlocksBefore']
                                     and max(tail['lastOriginalIndex'], timer['lastOriginalIndex'])
                                     < after['coverage']['firstOriginalIndex'])
                    self.require(ordered_chain, label + ' before/analysis/tail/after calibration chain is not ordered')
                    if previous_after is not None:
                        self.require(previous_after['coverage']['lastOriginalIndex']
                                     < before['coverage']['firstOriginalIndex']
                                     and previous_after['retainedBlocksAfter'] <= before['retainedBlocksBefore'],
                                     label + ' calibration chain overlaps or reuses preceding segment calibration')
                    previous_after = after
                    agreed = before['lagSamples'] is not None and before['lagSamples'] == after['lagSamples']
                    self.require(agreed, label + ' before/after independent native route lag changed')
                    result = {'index': index, 'fixture': fixture, 'variant': segment.get('variant'),
                              'elapsedMonotonicSeconds': elapsed, 'coverage': coverage, 'lagTail': tail,
                              'epochBoundToFirstActualRetainedEmission': emission_bound,
                              'firstActualEmissionOriginalEventIndex': actual_emission['independentEventIndex'] if actual_emission else None,
                              'timerCoverage': timer, 'nativeBefore': before, 'nativeAfter': after,
                              'nativeBeforeAfterAgreed': agreed, 'originalIndexCalibrationChainOrdered': ordered_chain,
                              'qualificationPassed': False}
                    if agreed:
                        native = self.compare(analysis, before['lagSamples'], source, input_pcm)
                        result['comparisonAtNativeLag'] = native
                        self.require(native['comparedBlocks'] == len(analysis), label + ' native comparison lacks full sample support')
                        if delay == 0:
                            self.require(native['fullExactEquality'], label + ' positive raw paths mismatch at independent native lag')
                        else:
                            delayed = self.compare(analysis, before['lagSamples'] + round(delay * RATE), source, input_pcm)
                            result['comparisonAtNativeLagPlusActualDelay'] = delayed
                            self.require(native['mismatchBlocks'] > 0 and not native['fullExactEquality'],
                                         label + ' negative control did not reject native-lag equality')
                            self.require(delayed['fullExactEquality'], label + ' negative delay raw paths mismatch at independently declared extra 4800 samples')
                    self.result['segments'].append(result)
        self.result['captureIntegrityAuditPassed'] = not self.errors
        self.result['limitations'] = ['Same-signal path equality does not establish independent product onset timing.',
                                     'No absolute onset, visual, physical-device, venue or human gate is qualified.',
                                     'Input faults and genuine path mismatches fail this audit; raw data are never repaired.']
        return self.result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = args.output or args.capture / 'capture-audit.json'
    if output.exists():
        parser.error('Refusing to overwrite an existing audit or original artifact')
    audit = Audit(args.capture)
    try:
        result = audit.run()
    except Exception as error:
        audit.errors.append(type(error).__name__ + ': ' + str(error))
        result = audit.result
        result['captureIntegrityAuditPassed'] = False
    # Exclusive create prevents a race from replacing any prior evidence.
    with output.open('x') as stream:
        json.dump(result, stream, indent=2, allow_nan=False)
        stream.write('\n')
    print(json.dumps({'captureIntegrityAuditPassed': result.get('captureIntegrityAuditPassed', False),
                      'qualificationPassed': False, 'segments': len(result['segments']),
                      'errors': result['errors'], 'report': str(output)}))
    return 0 if result.get('captureIntegrityAuditPassed') else 1


if __name__ == '__main__':
    sys.exit(main())
