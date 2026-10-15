#!/usr/bin/env python3
"""Metadata-only, opt-in Bongo Planet feasibility preflight; never opens PCM."""
import argparse
from array import array
import hashlib
import heapq
import json
import math
from pathlib import Path
import resource
import sys
import time

LIMITS = dict(seconds=120, rssBytes=256*1024*1024, work=50_000_000,
              metadataBytes=32*1024*1024, metadataLines=100_000,
              eventBytes=128*1024*1024, eventLines=150_000, lineBytes=65536,
              smallBytes=2*1024*1024, inventoryBytes=16*1024*1024,
              inputBytes=180*1024*1024, sequences=50_000, anchors=128,
              details=2048, outputBytes=8*1024*1024)
FIXED = {
 'report.json':'b374b5c7d75ff691fcd7d48e948d87277f91fb00a4df82e4ca5e9ea543df5a32',
 'independent-audit.json':'90f15e60165bc9c214c46b00a8ccd1009f69e508b3435ca941b279c422505205',
 'inventory.json':'448590de61a9e4265fb33238b6c2e0ca2582d8f7c32373a4c8fda7be89213998'}
SOURCES = {
 'scripts/mixture-timing-binary-capture.ts':'9c087afe2a69ac1c92a1688b2267c82308cffff71ab4cca8f9d358b975f64edd',
 'src/audio/processor.ts':'429555623b5f55c8df29a00b3ce6d9546a3d85fa2d1ba3e5e6b30d0b142f849b',
 'src/audio/synth.ts':'499f1d4aadfad5ce2c94082f19724eb24e411b4cbe5ccf2515f6d65754619191',
 'src/core/engine.ts':'19e5cba94b0db6c13b642bd28c90bc1def4bb0bc7ac6b5a95faf1e82bfa9aea3'}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def finite(x):
    require(type(x) in (int, float) and math.isfinite(x), 'Nonfinite/non-numeric scalar')
    return x


def integer(x, low=0):
    require(type(x) is int and x >= low, 'Invalid integer')
    return x


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


class Budget:
    def __init__(self, work=LIMITS['work']):
        self.start = time.monotonic()
        self.work = 0
        self.max_work = work
        self.bytes = 0
        self.rss = 0

    def step(self, count=1):
        self.work += count
        self.rss = max(self.rss, resource.getrusage(resource.RUSAGE_SELF).ru_maxrss *
                       (1 if sys.platform == 'darwin' else 1024))
        require(self.work <= self.max_work and time.monotonic()-self.start <= LIMITS['seconds']
                and self.rss <= LIMITS['rssBytes'], 'Resource-unfinished: cooperative guard')

    def read(self, count):
        self.bytes += count
        require(self.bytes <= LIMITS['inputBytes'], 'Total input byte cap')
        self.step()


def small(path, cap, expected, budget):
    require(path.stat().st_size <= cap, 'Small input byte cap')
    data = path.read_bytes()
    budget.read(len(data))
    digest = hashlib.sha256(data).hexdigest()
    require(digest == expected, 'Small input hash mismatch: '+path.name)
    return json.loads(data)


def rows(path, bytes_cap, lines_cap, expected, budget):
    require(path.stat().st_size <= bytes_cap, 'JSONL input byte cap')
    digest = hashlib.sha256()
    count = 0
    with path.open('rb') as f:
        while True:
            line = f.readline(LIMITS['lineBytes']+1)
            if not line:
                break
            count += 1
            require(count <= lines_cap and len(line) <= LIMITS['lineBytes'] and
                    line.endswith(b'\n'), 'JSONL line/count/truncation cap')
            budget.read(len(line))
            digest.update(line)
            yield json.loads(line)
    require(digest.hexdigest() == expected, 'JSONL hash mismatch: '+path.name)


def native_offsets(segments):
    observations = []
    for s in segments:
        before_after = []
        for phase in ('nativeBefore', 'nativeAfter'):
            n = s[phase]
            require(n['productTapSilent'] is True and n['nativeLagAgreed'] is True
                    and n['supportBoundToRetention'] is True, 'Native support failure')
            detections = n['nativeDetections']
            require(len(detections) == 12, 'Native click denominator')
            offsets = []
            for d in detections:
                require(d['samples'] == 48 and d['nativeLagSamples'] == 640,
                        'Native rectangle/lag mismatch')
                i, c = integer(d['inputRawSampleIndex']), integer(d['independentExpectedFrame'])
                require(i-d['expectedInputRawIndexWithoutRoute'] == 640,
                        'Native route/ordinal disagreement')
                offsets.append(i-c)
            observations.append(dict(segment=s['index'], phase=phase, offsets=offsets,
                                     sampleRoundingAllowance=n['sampleRoundingAllowanceSamples']))
            before_after.extend(offsets)
        require(len(set(before_after)) == 1, 'Native before/after ordinal offset differs')
    require(len(observations)*12 == 120, 'Native global denominator')
    all_offsets = [x for o in observations for x in o['offsets']]
    return dict(observations=observations, count=120,
                globalOrdinalOffsetAgreed=len(set(all_offsets)) == 1,
                globalOrdinalOffsets=sorted(set(all_offsets)),
                scope='Native schedule/input ordinal mapping under continuous sample-stream premise; not physical oscillator certification')


class Metadata:
    def __init__(self):
        self.times = array('d')
        self.frames = array('q')
        self.source_samples = 0
        self.input_samples = 0
        self.anomalies = []

    def ingest(self, r):
        index = len(self.times)
        require(r['index'] == index, 'Original metadata index lost/reordered')
        require(r['quantum'] == r['sourceLength'] == r['inputLength'] == 128 and
                integer(r['sourceChannels'], 1) and integer(r['inputChannels'], 1),
                'Incomplete128-sample path')
        require(r['sourceOffset'] == self.source_samples and r['inputOffset'] == self.input_samples,
                'Nonlinear path offset')
        t, frame = finite(r['currentTime']), integer(r['currentFrame'])
        require(abs(t*48000-frame) <= .01, 'Raw shared clock field disagreement')
        if self.frames and frame-self.frames[-1] != 128:
            require(len(self.anomalies) < LIMITS['details'], 'Metadata anomaly detail cap')
            self.anomalies.append(dict(index=index, frameStep=frame-self.frames[-1]))
        self.times.append(t)
        self.frames.append(frame)
        self.source_samples += 128
        self.input_samples += 128


class EventOrder:
    """Validate derived callback/chunk order, not infer private consume boundaries."""
    def __init__(self):
        self.count = 0
        self.segment_counts = {}
        self.callback = None
        self.callback_index = 0
        self.batch = -1

    def ingest(self, r):
        require(r['independentEventIndex'] == self.count, 'Original event index lost/reordered')
        s = r['segment']
        require(s is None or type(s) is int and 0 <= s < 5, 'Unknown event segment')
        require(r['perSegmentEventIndex'] == self.segment_counts.get(s, 0), 'Segment event order')
        finite(r['receiveContextTime']); finite(r['receiveBrowserMonotonicMs'])
        row = integer(r['originalCallbackRowIndex'])
        total = integer(r['originalCallbackRows'], 1)
        chunk, chunks = integer(r['chunkIndex']), integer(r['chunkCount'], 1)
        require(chunk < chunks and row < total, 'Invalid callback chunk')
        identity = (r['originalCallbackIndex'], total, chunks, s,
                    r['receiveContextTime'], r['receiveBrowserMonotonicMs'])
        if self.callback is None:
            require(identity[0] == self.callback_index and row == chunk == r['chunkOffset'] == 0,
                    'Missing/reordered callback first row')
            self.callback = [identity, 0, -1, -1, 0]
        state = self.callback
        require(identity == state[0] and row == state[1], 'Callback identity/row mismatch')
        if r['eventBatchIndex'] != state[3]:
            require(r['eventBatchIndex'] == self.batch+1 and chunk == state[2]+1 and
                    r['chunkOffset'] == row, 'Wire batch/chunk reordered')
            self.batch += 1
            state[2:5] = [chunk, r['eventBatchIndex'], row]
        require(chunk == state[2] and r['chunkOffset'] == state[4], 'Chunk provenance mismatch')
        state[1] += 1
        if row == total-1:
            require(chunk == chunks-1, 'Final callback chunk missing')
            self.callback = None
            self.callback_index += 1
        self.count += 1
        self.segment_counts[s] = self.segment_counts.get(s, 0)+1

    def finish(self, expected_rows, expected_batches):
        require(self.callback is None and self.count == expected_rows and
                self.batch+1 == expected_batches, 'Incomplete event denominator')


class Ledger:
    def __init__(self, session):
        self.session = session
        self.entries = {}
        self.onset_order = []
        self.controls = []
        self.emissions = []

    def ingest(self, event):
        kind = event['type']
        if kind in ('trigger', 'onset'):
            tr = event['trigger']
            require(tr['session'] == self.session, 'Wrong musical session')
            sequence = integer(tr['sequence'], 1)
            require(sequence <= LIMITS['sequences'] and tr['id'] == self.session+'-'+str(sequence),
                    'Sequence/ID cap or identity')
            signature = hashlib.sha256(canonical(tr).encode()).hexdigest()
            entry = self.entries.setdefault(sequence, dict(triggers=0, onsets=0, triggerHash=None,
                                                           onsetHash=None, mismatch=False, voice=None,
                                                           identity=None, sound=None))
            entry[kind+'s'] += 1
            key = kind+'Hash'
            entry['mismatch'] |= entry[key] is not None and entry[key] != signature
            entry[key] = signature if entry[key] is None else entry[key]
            if kind == 'trigger' and entry['voice'] is None:
                onset = finite(tr['onset']); duration = finite(tr['sound']['duration'])
                require(duration > 0 and onset >= finite(tr['emission'])-1e-9, 'Invalid voice time')
                entry['voice'] = (onset, sequence, duration, tr['emission'])
                entry['identity'] = (tr['generatorId'], tr['nodeId'])
                entry['sound'] = tr['sound']
            if kind == 'onset':
                self.onset_order.append(sequence)
        elif kind == 'emission':
            require(len(self.emissions) < LIMITS['details'], 'Emission detail cap')
            self.emissions.append(event)
        elif kind in ('reset', 'cancel'):
            require(len(self.controls) < LIMITS['details'], 'History detail cap')
            self.controls.append(event)
        else:
            raise ValueError('Unknown engine event kind')

    def complete(self, expected=None):
        for seq, e in self.entries.items():
            require(e['triggers'] == 1 and e['onsets'] <= 1 and not e['mismatch'] and
                    (e['onsets'] == 0 or e['triggerHash'] == e['onsetHash']),
                    'Missing/duplicate/different trigger/onset')
            if expected is None or seq in expected:
                require(e['onsets'] == 1, 'Expected onset missing')
        if expected is not None:
            for seq, (onset, generator, node, sound) in expected.items():
                e = self.entries.get(seq)
                require(e is not None and e['onsets'] == 1 and
                        e['identity'] == (generator, node) and abs(e['voice'][0]-onset) <= 1e-9,
                        'Inventory logical identity/onset mismatch')
                actual = e['sound']
                require(actual['duration'] == sound['duration'] and actual['level'] == sound['level'] and
                        ((sound['kind'] == 'sine' and actual['kind'] == 'note' and
                          actual['timbre'] == 'sine' and actual['frequency'] == sound['frequency']) or
                         (sound['kind'] == 'kick' and actual['kind'] == 'beat' and actual['sound'] == 'kick')),
                        'Inventory sound mismatch')


def anchors(times, epoch, low, high):
    # Return the whole necessary domain. No truncation on the configured candidate cap.
    return [i for i in range(low, high) if times[i] <= epoch and
            epoch-times[i] <= .02+.01/48000]


def late_checks(onset, start, end):
    return dict(engineEndLate=end-onset > .02+1e-9,
                synthBlockStartLate=start-onset > .02+1e-9)


def branch(times, anchor, end_index, epoch, voices, onset_order, budget):
    budget.step(len(voices)*max(1, len(voices).bit_length()))
    future = sorted(voices, key=lambda v: (v[3], v[1]))
    pending = []
    emitted = 0
    peak_pending = 0
    active = []
    seen = []
    erased_count = 0
    erased_hash = hashlib.sha256()
    stolen = 0
    prior = None
    for i in range(anchor, end_index+1):
        budget.step()
        raw = times[i]
        start = epoch if prior is None else max(raw, prior)
        require(start >= raw and start-raw <= .02+.01/48000, 'Candidate clock-fatal')
        require(prior is None or start-prior <= .1, 'Candidate interrupted')
        end = start+128/48000
        # Engine emits all crossed boundaries before draining the end-based due set.
        while emitted < len(future) and future[emitted][3] <= end+1e-9:
            budget.step()
            require(len(pending) < 5376, 'Candidate pending overflow')
            heapq.heappush(pending, future[emitted][:3])
            emitted += 1
            peak_pending = max(peak_pending, len(pending))
        # Literal due order is onset then sequence; heaps do not use callback grouping.
        while pending and pending[0][0] <= end+1e-9:
            onset, seq, duration = heapq.heappop(pending)
            # Charge prune, oldest selection and removal scans plus heap ordering bound.
            budget.step(1+3*len(active)+max(1, len(pending).bit_length()))
            flags = late_checks(onset, start, end)
            require(not flags['engineEndLate'], 'Candidate engine end late-drop')
            require(not flags['synthBlockStartLate'], 'Candidate synth block-start late-drop')
            active = [v for v in active if start < v[0]+v[2]]
            if len(active) >= 64:
                oldest = min(active, key=lambda v: (v[0], v[1]))
                active.remove(oldest)
                stolen += 1
                if oldest[3] == i:
                    erased_count += 1
                    erased_hash.update((str(oldest[1])+'\n').encode())
            active.append((onset, seq, duration, i))
            seen.append(seq)
        budget.step(len(active))
        active = [v for v in active if end < v[0]+v[2]]
        prior = end
    # Only the replayed prefix is compared; later post-window/tail records remain explicit.
    require(seen == onset_order[:len(seen)], 'Candidate consume order mismatch')
    return dict(anchorOriginalIndex=anchor, lastOriginalIndex=end_index,
                derivedOnsets=len(seen), laterOnsetsNotReplayed=len(onset_order)-len(seen),
                committedTriggers=emitted, peakDerivedPending=peak_pending,
                stolenVoices=stolen, erasedBeforeFirstRenderCount=erased_count,
                erasedSequenceOrderSha256=erased_hash.hexdigest(),
                endEffectiveTime=prior, scope='Conditional empty-start/no-command structural replay; no waveform entrance')


def run(capture, inventory_path, output):
    require(not output.exists(), 'Refusing existing output directory')
    output.mkdir(parents=True)
    budget = Budget()
    result = dict(status='preparing', qualificationPassed=False, waveformAnalyzed=False,
                  actualIdentifiedGroups=0, limits=LIMITS, groups=[], segments=[], errors=[],
                  unknowns=['Shared graph dispatch is a conformance/provenance premise, not an entry log.',
                            'Pre-anchor previousEnd/engine.now/stableSince not directly observed.',
                            'Full command-entry history is not logged; frozen harness recipe is a premise.',
                            'Structural admission/erasure is not acoustic entrance identification.'],
                  unknownFlags=dict(rawSharedClockPremise=True, initialCursorFloorUnproved=True,
                                    commandEntriesUnlogged=True, initialEmptyVoiceStateConditional=True,
                                    acousticEntranceUnanalyzed=True))
    try:
        report = small(capture/'report.json', LIMITS['smallBytes'], FIXED['report.json'], budget)
        audit = small(capture/'independent-audit.json', LIMITS['smallBytes'], FIXED['independent-audit.json'], budget)
        inv = small(inventory_path, LIMITS['inventoryBytes'], FIXED['inventory.json'], budget)
        require(audit['captureIntegrityAuditPassed'] is True and not audit['errors'] and
                report['captureErrorFree'] is True and not report['errors'] and
                report['setup']['sampleRate'] == 48000 and report['observedQuantumSizes'] == [128]
                and report['orderedIndependentIndices'] is True, 'Failed immutable acquisition')
        for name, expected_hash in SOURCES.items():
            source_path = capture/'application-source'/name
            require(source_path.stat().st_size <= LIMITS['smallBytes'], 'Source binding byte cap')
            data = source_path.read_bytes(); budget.read(len(data))
            require(hashlib.sha256(data).hexdigest() == expected_hash == report['sourceHashes'][name],
                    'Captured program source identity mismatch')
        result['sourceBindings'] = SOURCES
        require(inv['modeledGroups'] == 468 and len(inv['segments']) == 4, 'Inventory denominator')
        group_counts = [32, 36, 160, 240]
        expected_by_segment = []
        for s, count in zip(inv['segments'], group_counts):
            require(len(s['groups']) == count, 'Fixture group denominator')
            expected = {}
            for g in s['groups']:
                result['groups'].append(dict(fixture=s['fixture'], index=g['index'], onset=g['onset'],
                                             logicalVoices=g['logicalVoices'], status='not-analyzed',
                                             qualificationPassed=False))
                for v in g['voices']:
                    require(v[0] not in expected, 'Inventory duplicate sequence')
                    expected[v[0]] = (g['onset']+v[3], v[1], v[2], g['signatures'][v[4]])
            require(len(expected) == s['expected']['voices'], 'Inventory voice denominator')
            expected_by_segment.append(expected)
        del inv
        result['nativeMapping'] = native_offsets(audit['segments'])
        budget.step(120)
        require(result['nativeMapping']['globalOrdinalOffsetAgreed'], 'Native global ordinal mapping differs')
        metadata = Metadata()
        for r in rows(capture/'quantums.jsonl', LIMITS['metadataBytes'], LIMITS['metadataLines'],
                      audit['bindings']['quantumsSha256'], budget):
            metadata.ingest(r)
        require(len(metadata.times) == report['stats']['blocks'] and
                metadata.source_samples == report['stats']['sourceSamples'] and
                metadata.input_samples == report['stats']['inputSamples'], 'Metadata denominator')
        result['metadata'] = dict(blocks=len(metadata.times), clockAnomalies=metadata.anomalies,
                                  completeOriginalOrder=True)
        ledgers = [Ledger(s['actualSessionNamespace']) for s in report['segments']]
        order = EventOrder()
        for r in rows(capture/'events.jsonl', LIMITS['eventBytes'], LIMITS['eventLines'],
                      audit['bindings']['eventsSha256'], budget):
            order.ingest(r)
            if r['segment'] is not None:
                # load callbacks may contain the prior session reset; preserve that history.
                event = r['event']; ledger = ledgers[r['segment']]
                if event['type'] in ('trigger', 'onset') and event['trigger']['session'] != ledger.session:
                    raise ValueError('Cross-session musical event')
                ledger.ingest(event)
        order.finish(report['stats']['events'], report['stats']['eventBatches'])
        result['events'] = dict(rows=order.count, callbacks=order.callback_index, wireBatches=order.batch+1)
        for s, a, ledger in zip(report['segments'], audit['segments'], ledgers):
            # Post-window triggers can be pending when pause cancels them; not missing ordinary onsets.
            expected = expected_by_segment[s['index']] if s['index'] < 4 else None
            if expected is None:
                # Same unchanged F02 recipe, independently rebased to the negative's retained epoch.
                base_epoch = report['segments'][0]['transportEpochContextTime']
                expected = {seq: (s['transportEpochContextTime']+(v[0]-base_epoch), *v[1:])
                            for seq, v in expected_by_segment[0].items()
                            if v[0]-base_epoch < 12-1e-9}
                require(len(expected) == 18 and s['scene'] == report['segments'][0]['scene'],
                        'Negative original F02 denominator/scene')
            ledger.complete(expected)
            budget.step(len(ledger.entries)+len(expected))
            require(ledger.emissions and ledger.emissions[0] == s['firstEmission']['event'], 'First emission binding')
            low = s['calibrationBefore']['retainedBlocksAfter']
            high = s['calibrationAfter']['retainedBlocksBefore']
            require(0 <= low < high <= len(metadata.times), 'Anchor domain boundaries')
            budget.step(high-low)
            domain = anchors(metadata.times, s['transportEpochContextTime'], low, high)
            item = dict(index=s['index'], fixture=s['fixture'], variant=s['variant'],
                        necessaryAnchorIndices=domain, anchorCount=len(domain),
                        anchorPrehistoryProved=False, branches=[], controls=ledger.controls,
                        conditionalCommandRecipe='load/Play, ACKs only inside fixed window, pause after tail',
                        futureOwnershipProof=False, waveformAnalyzed=False)
            result['segments'].append(item)
            require(domain, 'No necessary anchor candidate')
            require(len(domain) <= LIMITS['anchors'], 'Anchor capacity: complete domain retained unresolved')
            # Cancel/reset application times are not logged. Only an unchanged healthy window is replayable.
            require(not any(e.get('reason') not in ('load', 'pause')
                            for e in ledger.controls), 'Unsupported control history')
            end_index = a['coverage']['lastOriginalIndex']
            voices = [e['voice'] for e in ledger.entries.values()]
            for candidate in domain:
                try:
                    replay = branch(metadata.times, candidate, end_index, s['transportEpochContextTime'],
                                    voices, ledger.onset_order, budget)
                    item['branches'].append(dict(status='conditional-structural-replay', **replay))
                except ValueError as error:
                    if 'Resource-unfinished' in str(error):
                        raise
                    item['branches'].append(dict(anchorOriginalIndex=candidate, status='conditional-inconsistent', reason=str(error)))
            item['unexploredAnchorIndices'] = []
            # This does not certify startup feasibility or unlogged command absence.
            item['status'] = 'conditional-metadata-feasibility-only'
        result['status'] = 'completed-metadata-feasibility-observation'
    except Exception as error:
        result['status'] = 'failed-or-resource-unfinished'
        result['errors'].append(str(error))
    try:
        budget.step()
    except ValueError as error:
        result['status'] = 'failed-or-resource-unfinished'
        result['errors'].append(str(error))
    for item in result['segments']:
        done = {b['anchorOriginalIndex'] for b in item['branches']}
        item['unexploredAnchorIndices'] = [i for i in item['necessaryAnchorIndices'] if i not in done]
    result.update(elapsedMonotonicSeconds=time.monotonic()-budget.start,
                  maximumObservedRss=budget.rss, workUnits=budget.work, inputBytes=budget.bytes)
    data = canonical(result).encode()+b'\n'
    require(len(data) <= LIMITS['outputBytes'], 'Output cap; no truncated success allowed')
    (output/'result.json').write_bytes(data)
    print(canonical(dict(status=result['status'], groups=len(result['groups']), workUnits=budget.work,
                         qualificationPassed=False, errors=result['errors'])))
    return 0 if not result['errors'] else 1


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--run', action='store_true', required=True)
    p.add_argument('--output-dir', type=Path, required=True)
    args = p.parse_args()
    require(args.output_dir.is_absolute(), 'Output directory must be absolute')
    root = Path(__file__).resolve().parents[1]
    original = root/'evidence/step-05/original-mixture'
    sys.exit(run(original/'binary-capture-01', original/'group-inventory/attempt-01/inventory.json',
                 args.output_dir))
