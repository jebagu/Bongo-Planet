#!/usr/bin/env python3
"""Metadata-only, opt-in Bongo Planet feasibility preflight; never opens PCM."""
import argparse
from array import array
import hashlib
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


class TypedResourceFailure(RuntimeError):
    """Work/time/RSS/input exhaustion; never a rejected candidate."""


class HeapInvariantFailure(RuntimeError):
    """Broken identity/algorithm invariant; leaves the anchor unresolved."""


class ConditionalInconsistency(ValueError):
    """Only a documented conditional clock/admission/order predicate."""


def conditional(ok, message):
    if not ok:
        raise ConditionalInconsistency(message)


class Budget:
    def __init__(self, work=LIMITS['work']):
        self.start = time.monotonic()
        self.work = 0
        self.max_work = work
        self.bytes = 0
        self.rss = 0

    def step(self, count=1, category='retained'):
        self.charge(count, category)

    def charge(self, count, category):
        if not hasattr(self, 'counters'):
            self.counters = {}
        self.counters[category] = self.counters.get(category, 0) + count
        self.work += count
        self.last_charge = dict(category=category, count=count, cumulativeWork=self.work)
        self.rss = max(self.rss, resource.getrusage(resource.RUSAGE_SELF).ru_maxrss *
                       (1 if sys.platform == 'darwin' else 1024))
        if (self.work > self.max_work or time.monotonic()-self.start > LIMITS['seconds']
                or self.rss > LIMITS['rssBytes']):
            raise TypedResourceFailure('Resource-unfinished: cooperative guard: '+category)

    def read(self, count):
        self.bytes += count
        if self.bytes > LIMITS['inputBytes']:
            raise TypedResourceFailure('Total input byte cap')
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
        for o in observations[-2:]:
            o['beforeAfterOrdinalOffsetAgreed'] = len(set(before_after)) == 1
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

    def complete(self, expected=None, window_end=None):
        max_delta = 0
        for seq, e in self.entries.items():
            require(e['triggers'] == 1 and e['onsets'] <= 1 and not e['mismatch'] and
                    (e['onsets'] == 0 or e['triggerHash'] == e['onsetHash']),
                    'Missing/duplicate/different trigger/onset')
            if expected is None or seq in expected:
                require(e['onsets'] == 1, 'Expected onset missing')
            elif window_end is not None:
                require(e['voice'][0] >= window_end-1e-9, 'Extra ordinary in-window trigger')
        if expected is not None:
            for seq, (onset, generator, node, sound) in expected.items():
                e = self.entries.get(seq)
                require(e is not None and e['onsets'] == 1 and
                        e['identity'] == (generator, node) and abs(e['voice'][0]-onset) <= 1e-9,
                        'Inventory logical identity/onset mismatch')
                max_delta = max(max_delta, abs(e['voice'][0]-onset))
                actual = e['sound']
                require(actual['duration'] == sound['duration'] and actual['level'] == sound['level'] and
                        ((sound['kind'] == 'sine' and actual['kind'] == 'note' and
                          actual['timbre'] == 'sine' and actual['frequency'] == sound['frequency']) or
                         (sound['kind'] == 'kick' and actual['kind'] == 'beat' and actual['sound'] == 'kick')),
                        'Inventory sound mismatch')
        return dict(expectedSequences=None if expected is None else len(expected),
                    observedTriggerRows=sum(e['triggers'] for e in self.entries.values()),
                    observedOnsetRows=sum(e['onsets'] for e in self.entries.values()),
                    maxAbsInventoryOnsetDeltaSeconds=max_delta,
                    scope='Logical scalar comparison; represented timestamp differences remain nonzero')


def anchors(times, epoch, low, high):
    # Return the whole necessary domain. No truncation on the configured candidate cap.
    return [i for i in range(low, high) if times[i] <= epoch and
            epoch-times[i] <= .02+.01/48000]


def late_checks(onset, start, end):
    return dict(engineEndLate=end-onset > .02+1e-9,
                synthBlockStartLate=start-onset > .02+1e-9)


def validate_history(controls):
    require(all(e['type'] in ('reset', 'cancel') and e.get('reason') in ('load', 'pause')
                for e in controls), 'Unsupported control history')


def interruption_checks(start, end, previous_end, engine_time):
    return dict(processorStartInterrupted=previous_end is not None and start-previous_end > .1,
                engineEndInterrupted=end-engine_time > .1)


class CountedHeap:
    """Explicit binary min heap of (priority, sequence, payload) tokens.

    Fixed batches charge an upper bound on the listed source operations before
    execution. They include branch/loop comparisons, index arithmetic and field
    reads; counter bookkeeping and local variable binding are excluded.
    """
    def __init__(self, budget, category):
        self.data = []
        self.budget = budget
        self.category = category

    def charge(self, n):
        self.budget.charge(n, self.category)

    def less(self, a, b):
        self.charge(3)  # two key reads, comparison
        if a[0] < b[0]:
            return True
        self.charge(3)
        if a[0] > b[0]:
            return False
        self.charge(3)  # two sequence reads, comparison
        return a[1] < b[1]

    def root(self):
        self.charge(2)  # empty check and array read
        if not self.data:
            raise HeapInvariantFailure('Empty heap root')
        return self.data[0]

    def push(self, token):
        self.charge(3)  # append, length, subtraction
        self.data.append(token)
        i = len(self.data)-1
        while True:
            self.charge(1)
            if i <= 0:
                break
            self.charge(4)  # subtract/divide, parent array read, incoming array read
            p = (i-1)//2
            if not self.less(self.data[i], self.data[p]):
                break
            self.charge(4)  # two array reads, two writes
            self.data[i], self.data[p] = self.data[p], self.data[i]
            i = p

    def pop(self):
        self.charge(2)  # empty check, root array read
        if not self.data:
            raise HeapInvariantFailure('Empty heap pop')
        token = self.data[0]
        self.charge(2)  # pop and nonempty test
        last = self.data.pop()
        if self.data:
            self.charge(1)
            self.data[0] = last
            i = 0
            while True:
                self.charge(4)  # multiply/add, length, comparison
                left = 2*i+1
                if left >= len(self.data):
                    break
                self.charge(3)  # add, length, comparison
                right = left+1
                child = left
                if right < len(self.data):
                    self.charge(2)  # two array reads
                    if self.less(self.data[right], self.data[left]):
                        child = right
                self.charge(2)
                if not self.less(self.data[child], self.data[i]):
                    break
                self.charge(4)
                self.data[i], self.data[child] = self.data[child], self.data[i]
                i = child
        return token


def prepare_future(voices, budget):
    """Stable immutable emission/sequence order, computed once per segment."""
    budget.step(len(voices)*max(1, len(voices).bit_length()), 'future-reserve')
    source = []
    for voice in voices:
        budget.charge(2, 'future-sort')  # visited entry and append
        source.append(voice)
    width = 1
    while True:
        budget.charge(2, 'future-sort')  # len and comparison
        if width >= len(source):
            break
        target = []
        low = 0
        while True:
            budget.charge(2, 'future-sort')
            if low >= len(source):
                break
            budget.charge(8, 'future-sort')  # boundary sums/min comparisons/length
            mid = min(low+width, len(source))
            high = min(low+2*width, len(source))
            left, right = low, mid
            while True:
                budget.charge(2, 'future-sort')
                if not (left < mid and right < high):
                    break
                budget.charge(6, 'future-sort')  # array reads + emission key reads/comparison
                a, b = source[left], source[right]
                take_left = a[3] < b[3]
                if not take_left:
                    budget.charge(3, 'future-sort')
                    if a[3] == b[3]:
                        budget.charge(3, 'future-sort')
                        take_left = a[1] <= b[1]
                budget.charge(2, 'future-sort')  # append and cursor addition
                if take_left:
                    target.append(a); left += 1
                else:
                    target.append(b); right += 1
            for index, limit in ((left, mid), (right, high)):
                while True:
                    budget.charge(1, 'future-sort')
                    if index >= limit:
                        break
                    budget.charge(3, 'future-sort')  # read/append/advance
                    target.append(source[index]); index += 1
            low = high
        source = target  # reference assignment, no hidden copy
        budget.charge(1, 'future-sort')
        width *= 2
    budget.charge(2*len(source), 'future-sort')  # tuple conversion reads and writes
    return tuple(source)


class ActiveVoices:
    def __init__(self, budget, session):
        self.budget = budget
        self.session = session
        self.live = {}  # exact lifetime identity -> immutable scalar record
        self.lifetime = set()
        self.oldest = CountedHeap(budget, 'oldest-heap')
        self.expiry = CountedHeap(budget, 'expiry-heap')
        self.stolen = 0
        self.erased_count = 0
        self.erased_hash = hashlib.sha256()
        self.peak_oldest = 0
        self.peak_expiry = 0
        self.compactions = 0
        self.last_stolen = None

    def charge(self, n, category='active-map'):
        self.budget.charge(n, category)

    def token_live(self, token):
        self.charge(3, 'identity')  # payload field, identity field, map lookup
        record = token[2]
        current = self.live.get(record[5])
        self.charge(1, 'identity')  # exact immutable record object identity
        self.charge(2, 'identity')
        if current is not None and current is not record:
            raise HeapInvariantFailure('Token identity aliases a different live record')
        return current is record

    def prune(self, now):
        expired = []
        while True:
            self.charge(2, 'expiry-boundary')  # length and nonempty comparison
            if not self.expiry.data:
                break
            token = self.expiry.root()
            self.charge(2, 'expiry-boundary')
            if token[0] > now:
                break
            token = self.expiry.pop()
            if self.token_live(token):
                self.charge(4)  # payload/identity reads, map delete, expired append
                record = token[2]
                del self.live[record[5]]
                expired.append(record)
            else:
                self.charge(1, 'stale')  # stale removal disposition
        return expired

    def compact(self, heap, expiry):
        self.charge(2, 'compaction')
        if len(heap.data) < 192:
            return
        replacement = CountedHeap(self.budget, heap.category)
        for record in self.live.values():
            self.charge(5, 'compaction')  # visit/key/sequence/payload and token write
            replacement.push((record[4] if expiry else record[0], record[1], record))
        self.charge(1, 'compaction')  # final index reference replacement (no copy)
        heap.data = replacement.data
        self.compactions += 1

    def admit(self, onset, seq, duration, block):
        self.last_stolen = None
        self.charge(5, 'identity')  # identity construction, seq low/high comparisons, membership
        identity = (self.session, seq)
        if not (type(seq) is int and 1 <= seq <= LIMITS['sequences']) or identity in self.lifetime:
            raise HeapInvariantFailure('Duplicate/invalid lifetime identity')
        self.charge(2)  # length/capacity check
        if len(self.live) >= 64:
            while True:
                token = self.oldest.pop()
                if self.token_live(token):
                    self.charge(3)  # payload/identity reads/map delete
                    old = token[2]
                    del self.live[old[5]]
                    self.last_stolen = old
                    self.charge(3, 'erasure')  # stolen advance, admission block read/compare
                    self.stolen += 1
                    if old[3] == block:
                        self.charge(3, 'erasure')  # erased advance, sequence read/string bookkeeping
                        self.erased_count += 1
                        self.erased_hash.update((str(old[1])+'\n').encode())
                    break
                self.charge(1, 'stale')
        # Rebuild BEFORE the incoming identity exists; no duplicate incoming token.
        self.compact(self.oldest, False)
        self.compact(self.expiry, True)
        self.charge(8, 'admission')  # expiry addition + six scalar record writes + map insert
        expiry = onset+duration
        record = (onset, seq, duration, block, expiry, identity)
        self.live[identity] = record
        self.charge(1, 'identity')
        self.lifetime.add(identity)
        self.charge(6, 'admission')  # three token fields in each heap
        self.oldest.push((onset, seq, record))
        self.expiry.push((expiry, seq, record))
        self.charge(8, 'storage')  # two lengths/comparisons and two peak updates
        if len(self.oldest.data) > 192 or len(self.expiry.data) > 192 or len(self.live) > 64:
            raise HeapInvariantFailure('Storage invariant violated')
        self.peak_oldest = max(self.peak_oldest, len(self.oldest.data))
        self.peak_expiry = max(self.peak_expiry, len(self.expiry.data))
        return record

    def snapshot(self):
        # Optional finite controls only; never enabled for original replay.
        self.charge(2*len(self.live), 'control-snapshot')
        return tuple(self.live.values())


def branch(times, anchor, end_index, epoch, voices, onset_order, budget,
           session='synthetic', prepared=False, trace=None):
    future = voices if prepared else prepare_future(voices, budget)
    pending = CountedHeap(budget, 'pending-heap')
    state = ActiveVoices(budget, session)
    emitted = peak_pending = 0
    seen = []
    prior = None

    def checkpoint(kind, i, expired=(), admitted=None):
        if trace is not None:
            require(len(trace) < LIMITS['details'], 'Control trace detail cap')
            trace.append(dict(kind=kind, index=i, start=start, end=end,
                live=state.snapshot(), pending=tuple(pending.data),
                expired=tuple(expired), admitted=admitted, stolen=state.last_stolen,
                stolenCount=state.stolen, erasedCount=state.erased_count,
                erasedHash=state.erased_hash.hexdigest(), seen=tuple(seen)))

    for i in range(anchor, end_index+1):
        budget.step()
        budget.charge(9, 'clock')  # time read, recurrence/max, boundaries and additions
        raw = times[i]
        start = epoch if prior is None else max(raw, prior)
        conditional(start >= raw and start-raw <= .02+.01/48000, 'Candidate clock-fatal')
        end = start+128/48000
        budget.charge(6, 'clock')
        flags = interruption_checks(start, end, prior, epoch if prior is None else prior)
        conditional(not flags['processorStartInterrupted'], 'Candidate processor start interrupted')
        conditional(not flags['engineEndInterrupted'], 'Candidate engine end interrupted')
        while True:
            budget.charge(6, 'future-cursor')  # length/test, array/key, boundary addition/comparison
            if not (emitted < len(future) and future[emitted][3] <= end+1e-9):
                break
            budget.step()
            budget.charge(2, 'pending-capacity')
            conditional(len(pending.data) < 5376, 'Candidate pending overflow')
            budget.charge(5, 'future-cursor')  # array read + three slice fields + token creation
            voice = future[emitted][:3]
            pending.push((voice[0], voice[1], voice))
            budget.charge(4, 'future-cursor')  # cursor advance, pending length and max peak
            emitted += 1
            peak_pending = max(peak_pending, len(pending.data))
        while True:
            budget.charge(2, 'due-boundary')
            if not pending.data:
                break
            token = pending.root()
            budget.charge(3, 'due-boundary')
            if token[0] > end+1e-9:
                break
            onset, seq, duration = pending.pop()[2]
            budget.step(1+max(1, len(pending.data).bit_length()), 'pending-reserve')
            budget.charge(6, 'late')
            flags = late_checks(onset, start, end)
            conditional(not flags['engineEndLate'], 'Candidate engine end late-drop')
            conditional(not flags['synthBlockStartLate'], 'Candidate synth block-start late-drop')
            expired = state.prune(start)
            checkpoint('start-prune', i, expired)
            admitted = state.admit(onset, seq, duration, i)
            budget.charge(1, 'seen-order')
            seen.append(seq)
            checkpoint('admission', i, admitted=admitted)
        expired = state.prune(end)
        checkpoint('end-prune', i, expired)
        prior = end
    budget.charge(2*len(seen)+1, 'seen-order')  # retained prefix copy and literal comparison
    conditional(seen == onset_order[:len(seen)], 'Candidate consume order mismatch')
    return dict(anchorOriginalIndex=anchor, lastOriginalIndex=end_index,
                derivedOnsets=len(seen), laterOnsetsNotReplayed=len(onset_order)-len(seen),
                committedTriggers=emitted, peakDerivedPending=peak_pending,
                stolenVoices=state.stolen, erasedBeforeFirstRenderCount=state.erased_count,
                erasedSequenceOrderSha256=state.erased_hash.hexdigest(),
                endEffectiveTime=prior, scope='Conditional empty-start/no-command structural replay; no waveform entrance')


def run(capture, inventory_path, output):
    require(not output.exists(), 'Refusing existing output directory')
    output.mkdir(parents=True)
    budget = Budget()
    ledgers = []
    expected_by_segment = []
    result = dict(status='preparing', qualificationPassed=False, waveformAnalyzed=False,
                  actualIdentifiedGroups=0, limits=LIMITS, groups=[], segments=[], errors=[],
                  progress=dict(metadataBlocks=0,eventRows=0),
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
        base_epoch = report['segments'][0]['transportEpochContextTime']
        negative = report['segments'][4]
        negative_expected = {seq: (negative['transportEpochContextTime']+(v[0]-base_epoch), *v[1:])
                             for seq, v in expected_by_segment[0].items()
                             if v[0]-base_epoch < 12-1e-9}
        require(len(negative_expected) == 18 and negative['scene'] == report['segments'][0]['scene'],
                'Negative original F02 denominator/scene')
        expected_by_segment.append(negative_expected)
        del inv, s, g, v
        result['nativeMapping'] = native_offsets(audit['segments'])
        budget.step(120)
        require(result['nativeMapping']['globalOrdinalOffsetAgreed'], 'Native global ordinal mapping differs')
        metadata = Metadata()
        for r in rows(capture/'quantums.jsonl', LIMITS['metadataBytes'], LIMITS['metadataLines'],
                      audit['bindings']['quantumsSha256'], budget):
            metadata.ingest(r)
            result['progress']['metadataBlocks'] = len(metadata.times)
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
            result['progress']['eventRows'] = order.count
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
            expected = expected_by_segment[s['index']]
            logical = ledger.complete(expected, s['fixedAnalysisWindowContextEnd'])
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
                        logicalComparison=logical,
                        conditionalCommandRecipe='load/Play, ACKs only inside fixed window, pause after tail',
                        futureOwnershipProof=False, waveformAnalyzed=False)
            result['segments'].append(item)
            require(domain, 'No necessary anchor candidate')
            require(len(domain) <= LIMITS['anchors'], 'Anchor capacity: complete domain retained unresolved')
            # Cancel/reset application times are not logged. Only an unchanged healthy window is replayable.
            validate_history(ledger.controls)
            end_index = a['coverage']['lastOriginalIndex']
            voices = [e['voice'] for e in ledger.entries.values()]
            future = prepare_future(voices, budget)
            for candidate in domain:
                item['activeAnchorIndex'] = candidate
                try:
                    replay = branch(metadata.times, candidate, end_index, s['transportEpochContextTime'],
                                    future, ledger.onset_order, budget, session=ledger.session, prepared=True)
                    item['branches'].append(dict(status='conditional-structural-replay', **replay))
                except ConditionalInconsistency as error:
                    item['branches'].append(dict(anchorOriginalIndex=candidate, status='conditional-inconsistent', reason=str(error)))
            item.pop('activeAnchorIndex', None)
            item['unexploredAnchorIndices'] = []
            # This does not certify startup feasibility or unlogged command absence.
            item['status'] = 'conditional-metadata-feasibility-only'
            ledger.entries.clear(); ledger.onset_order.clear(); expected.clear()
            voices = []
        result['status'] = 'completed-metadata-feasibility-observation'
    except Exception as error:
        result['status'] = 'failed-or-resource-unfinished'
        result['errors'].append(str(error))
        result['failureType'] = type(error).__name__
        result['lastCharge'] = getattr(budget, 'last_charge', None)
    # Save failure/frontier without retaining all event projections during serialization.
    for ledger in ledgers:
        ledger.entries.clear(); ledger.onset_order.clear(); ledger.emissions.clear()
    for expected in expected_by_segment:
        expected.clear()
    voices = []
    try:
        budget.step()
    except TypedResourceFailure as error:
        result['status'] = 'failed-or-resource-unfinished'
        result['errors'].append(str(error))
    for item in result['segments']:
        done = {b['anchorOriginalIndex'] for b in item['branches']}
        item['unexploredAnchorIndices'] = [i for i in item['necessaryAnchorIndices'] if i not in done]
    result.update(elapsedMonotonicSeconds=time.monotonic()-budget.start,
                  maximumObservedRss=budget.rss, workUnits=budget.work, inputBytes=budget.bytes, workCounters=getattr(budget, 'counters', {}),
                  unattemptedSegmentIndices=[i for i in range(5) if i not in {s['index'] for s in result['segments']}])
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
