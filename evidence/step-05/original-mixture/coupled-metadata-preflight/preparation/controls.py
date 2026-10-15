"""Synthetic controls only: no original metadata, PCM, worker or socket inputs."""
import copy
import importlib.util
import math
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[5] / 'scripts/coupled-onset-metadata-preflight.py'
spec = importlib.util.spec_from_file_location('preflight', SOURCE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def meta(i, frame=None):
    frame = 1000+i*128 if frame is None else frame
    return dict(index=i, currentFrame=frame, currentTime=frame/48000, quantum=128,
                sourceLength=128, inputLength=128, sourceChannels=1, inputChannels=2,
                sourceOffset=i*128, inputOffset=i*128)


def native():
    segments = []
    for segment in range(5):
        phases = {}
        for phase in ('nativeBefore', 'nativeAfter'):
            phases[phase] = dict(productTapSilent=True, nativeLagAgreed=True,
                supportBoundToRetention=True, sampleRoundingAllowanceSamples=1,
                nativeDetections=[dict(samples=48, nativeLagSamples=640,
                    independentExpectedFrame=100000+1000*j,
                    inputRawSampleIndex=100640+1000*j,
                    expectedInputRawIndexWithoutRoute=100000+1000*j) for j in range(12)])
        segments.append(dict(index=segment, **phases))
    return segments


def event_rows():
    return [dict(independentEventIndex=i, perSegmentEventIndex=i, segment=0,
        receiveContextTime=1, receiveBrowserMonotonicMs=2, originalCallbackIndex=0,
        originalCallbackRows=3, originalCallbackRowIndex=i, chunkIndex=0 if i<2 else 1,
        chunkCount=2, chunkOffset=0 if i<2 else 2, eventBatchIndex=0 if i<2 else 1)
        for i in range(3)]


def trigger(seq=1, onset=0):
    return dict(session='s3', sequence=seq, id='s3-'+str(seq), generatorId='g', nodeId='n',
                emission=0, onset=onset, position=[1, 0, 0],
                sound=dict(kind='note', timbre='sine', frequency=440, duration=1, level=.5))


class Controls(unittest.TestCase):
    def test_full_paths_and_original_index(self):
        s=m.Metadata(); s.ingest(meta(0)); s.ingest(meta(1))
        self.assertEqual(s.source_samples,256)
        with self.assertRaises(ValueError): s.ingest(meta(3))

    def test_missing_input_rejected(self):
        r=meta(0); r['inputLength']=0
        with self.assertRaises(ValueError): m.Metadata().ingest(r)

    def test_wrong_offset_rejected(self):
        r=meta(0); r['sourceOffset']=128
        with self.assertRaises(ValueError): m.Metadata().ingest(r)

    def test_nonfinite_clock_rejected(self):
        r=meta(0); r['currentTime']=float('nan')
        with self.assertRaises(ValueError): m.Metadata().ingest(r)

    def test_repeated_clocks_preserved(self):
        s=m.Metadata()
        for i,f in enumerate([1000,1000,1000,1384]): s.ingest(meta(i,f))
        self.assertEqual(list(s.frames),[1000,1000,1000,1384])
        self.assertEqual([r['frameStep'] for r in s.anomalies],[0,0,384])

    def test_all120_native_offsets(self):
        result=m.native_offsets(native())
        self.assertEqual(result['count'],120)
        self.assertEqual(result['globalOrdinalOffsets'],[640])

    def test_one_native_offset_dissent_rejected(self):
        s=native(); d=s[4]['nativeAfter']['nativeDetections'][11]
        d['inputRawSampleIndex']+=1; d['expectedInputRawIndexWithoutRoute']+=1
        r=m.native_offsets(s)
        self.assertEqual(r['count'],120)
        self.assertFalse(r['globalOrdinalOffsetAgreed'])
        self.assertFalse(r['observations'][-1]['beforeAfterOrdinalOffsetAgreed'])

    def test_equal_each_segment_not_equal_global(self):
        s=native()
        for phase in ('nativeBefore','nativeAfter'):
            for d in s[4][phase]['nativeDetections']:
                d['inputRawSampleIndex']+=128; d['expectedInputRawIndexWithoutRoute']+=128
        self.assertFalse(m.native_offsets(s)['globalOrdinalOffsetAgreed'])

    def test_missing_native_click_rejected(self):
        s=native();s[0]['nativeBefore']['nativeDetections'].pop()
        with self.assertRaises(ValueError):m.native_offsets(s)

    def test_callback_two_chunks_complete(self):
        s=m.EventOrder()
        for r in event_rows():s.ingest(r)
        s.finish(3,2)
        self.assertEqual(s.callback_index,1)

    def test_missing_final_chunk_rejected(self):
        s=m.EventOrder()
        for r in event_rows()[:2]:s.ingest(r)
        with self.assertRaises(ValueError):s.finish(2,1)

    def test_reordered_chunk_rejected(self):
        s=m.EventOrder();s.ingest(event_rows()[0])
        with self.assertRaises(ValueError):s.ingest(event_rows()[2])

    def test_mixed_callback_receive_clock_rejected(self):
        s=m.EventOrder();s.ingest(event_rows()[0]);r=event_rows()[1];r['receiveContextTime']=2
        with self.assertRaises(ValueError):s.ingest(r)

    def test_onset_before_trigger_independent_counts(self):
        s=m.Ledger('s3');t=trigger()
        s.ingest(dict(type='onset',trigger=t));s.ingest(dict(type='trigger',trigger=t));s.complete()
        self.assertEqual(s.onset_order,[1])

    def test_missing_and_duplicate_onset_rejected(self):
        for count in (0,2):
            s=m.Ledger('s3');t=trigger();s.ingest(dict(type='trigger',trigger=t))
            for _ in range(count):s.ingest(dict(type='onset',trigger=t))
            with self.assertRaises(ValueError):s.complete()

    def test_wrong_timbre_inventory_rejected(self):
        s=m.Ledger('s3');t=trigger();t['sound']['timbre']='triangle'
        for kind in ('trigger','onset'):s.ingest(dict(type=kind,trigger=t))
        expected={1:(0,'g','n',dict(kind='sine',frequency=440,duration=1,level=.5))}
        with self.assertRaises(ValueError):s.complete(expected)

    def test_future_pending_not_missing_ordinary_onset(self):
        s=m.Ledger('s3');t=trigger(onset=10);s.ingest(dict(type='trigger',trigger=t));s.complete({},1)
        self.assertEqual(s.entries[1]['onsets'],0)

    def test_extra_ordinary_trigger_rejected(self):
        s=m.Ledger('s3');t=trigger();s.ingest(dict(type='trigger',trigger=t))
        s.ingest(dict(type='onset',trigger=t))
        with self.assertRaisesRegex(ValueError,'Extra ordinary'):s.complete({},1)

    def test_unexpected_control_history_rejected(self):
        m.validate_history([dict(type='reset',reason='load'),dict(type='cancel',reason='pause')])
        with self.assertRaisesRegex(ValueError,'Unsupported'):
            m.validate_history([dict(type='reset',reason='interrupted clock')])

    def test_fractional_anchor_and_double_repeat_domain(self):
        self.assertEqual(m.anchors([.99,1,1,1,1.01],1.0001,0,5),[0,1,2,3])
        # A cap check must retain the complete domain, not silently slice128 candidates.
        self.assertEqual(len(m.anchors([1]*129,1,0,129)),129)

    def test_double_repeat_recurrence_advances(self):
        r=m.branch([0,0,0,3*128/48000],0,3,0,[],[],m.Budget())
        self.assertAlmostEqual(r['endEffectiveTime'],4*128/48000)

    def test_end_and_start_late_tests_distinct(self):
        self.assertEqual(m.late_checks(0,.018,.021),
                         dict(engineEndLate=True,synthBlockStartLate=False))
        # Direct predicate control, not a physically valid end-before-start render block.
        self.assertEqual(m.late_checks(0,.021,.018),
                         dict(engineEndLate=False,synthBlockStartLate=True))

    def test_65_simultaneous_voices_steal_oldest_before_render(self):
        voices=[(0,seq,1,0) for seq in range(1,66)]
        r=m.branch([0],0,0,0,voices,list(range(1,66)),m.Budget())
        self.assertEqual(r['stolenVoices'],1)
        self.assertEqual(r['erasedBeforeFirstRenderCount'],1)
        self.assertEqual(r['peakDerivedPending'],65)

    def test_due_grouping_not_telemetry_callback_grouping(self):
        voices=[(.01,1,1,0),(.005,2,1,0)]
        r=m.branch([i*128/48000 for i in range(4)],0,3,0,voices,[2,1],m.Budget())
        self.assertEqual(r['derivedOnsets'],2)
        with self.assertRaises(ValueError):
            m.branch([i*128/48000 for i in range(4)],0,3,0,voices,[1,2],m.Budget())

    def test_late_drop_and_pending_capacity_rejected(self):
        with self.assertRaisesRegex(ValueError,'engine end'):
            m.branch([0],0,0,0,[(-.019,1,1,-.019)],[1],m.Budget())
        with self.assertRaisesRegex(ValueError,'pending overflow'):
            m.branch([0],0,0,0,[(1,i,1,0) for i in range(1,5378)],[],m.Budget())

    def test_resource_guard_retains_no_fake_completion(self):
        with self.assertRaisesRegex(ValueError,'Resource-unfinished'):
            m.branch([0,0],0,1,0,[],[],m.Budget(work=0))

    def test_99ms_start_gap_interrupts_engine_at_end(self):
        # First128-sample block ends at8/3000s. The99ms pause makes the next
        # advance span101+2/3ms, above100ms despite the processor's99ms gap.
        q=128/48000; second=q+.099
        flags=m.interruption_checks(second,second+q,q,q)
        self.assertFalse(flags['processorStartInterrupted'])
        self.assertTrue(flags['engineEndInterrupted'])
        with self.assertRaisesRegex(ValueError,'engine end interrupted'):
            m.branch([0,second],0,1,0,[(second,1,1,second)],[1],m.Budget())

    def test_engine_strict_exact100ms_predicate(self):
        for end,expected in [(math.nextafter(.1,0),False),(.1,False),
                             (math.nextafter(.1,math.inf),True)]:
            self.assertEqual(m.interruption_checks(0,end,None,0)['engineEndInterrupted'],expected)

    def test_processor_strict_exact100ms_predicate(self):
        for start,expected in [(math.nextafter(.1,0),False),(.1,False),
                               (math.nextafter(.1,math.inf),True)]:
            self.assertEqual(m.interruption_checks(start,start+.002,0,0)
                             ['processorStartInterrupted'],expected)
        self.assertFalse(m.interruption_checks(.2,.202,None,.2)['processorStartInterrupted'])

    def test_engine_boundary_two_actual_blocks(self):
        # In IEEE binary64, (0.1+128/48000)-(128/48000) rounds to0.1.
        for second in (math.nextafter(.1,0),.1):
            r=m.branch([0,second],0,1,0,[],[],m.Budget())
            self.assertEqual(r['lastOriginalIndex'],1)
        with self.assertRaisesRegex(ValueError,'engine end interrupted'):
            m.branch([0,math.nextafter(.1,math.inf)],0,1,0,[],[],m.Budget())


if __name__=='__main__':
    unittest.main(verbosity=2)
