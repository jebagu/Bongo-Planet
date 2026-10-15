"""Pure finite controls, never reads original streams/inventory/PCM or runs main."""
import ast
import hashlib
import importlib.util
import itertools
import json
import math
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
SOURCE = ROOT/'scripts/coupled-onset-metadata-optimized.py'
FROZEN = ROOT/'scripts/coupled-onset-metadata-preflight.py'
assert hashlib.sha256(FROZEN.read_bytes()).hexdigest() == '6d417b4a33021aaba47a0b15b6bf4be5cd8b0a2646d339dbf09bd6445b36fd51'
def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
m = load(SOURCE, 'optimized')
frozen = load(FROZEN, 'frozen')
RESULTS = {'sourceOnly': True, 'originalInputRead': False, 'failures': [], 'cases': [],
           'finiteDomain': {'voices': 3, 'onsets': [0, .001],
             'durations': [.001, .005], 'emissions': [0, .001], 'denominator': 512}}


def normalized(trace):
    return [dict(row, pending=tuple(sorted((t[2] for t in row['pending']), key=lambda v:(v[0],v[1]))))
            for row in trace]


# Read only the frozen helper source, then mechanically instrument its branch
# at the exact admission/start-prune/end-prune locations. Frozen production source
# remains unchanged. The extracted reference binds its original SHA above.
branch_source = ast.get_source_segment(FROZEN.read_text(), next(n for n in ast.parse(FROZEN.read_text()).body
                                      if isinstance(n, ast.FunctionDef) and n.name == 'branch'))
branch_source = branch_source.replace('def branch(', 'def reference(').replace('budget):', 'budget, trace):', 1)
branch_source = branch_source.replace('    for i in range(anchor, end_index+1):', '''    def checkpoint(kind, expired=(), admitted=None, oldest=None):
        trace.append(dict(kind=kind,index=i,start=start,end=end,
            live=tuple((*v,v[0]+v[2],('synthetic',v[1])) for v in active),
            pending=tuple((v[0],v[1],v) for v in pending),
            expired=tuple((*v,v[0]+v[2],('synthetic',v[1])) for v in expired),
            admitted=None if admitted is None else (*admitted,admitted[0]+admitted[2],('synthetic',admitted[1])),
            stolen=None if last_stolen is None else (*last_stolen,last_stolen[0]+last_stolen[2],('synthetic',last_stolen[1])),
            stolenCount=stolen,erasedCount=erased_count,erasedHash=erased_hash.hexdigest(),seen=tuple(seen)))
    last_stolen = None
    for i in range(anchor, end_index+1):''')
branch_source = branch_source.replace('            active = [v for v in active if start < v[0]+v[2]]', '''            expired = [v for v in active if not start < v[0]+v[2]]
            active = [v for v in active if start < v[0]+v[2]]
            checkpoint('start-prune', expired)
            last_stolen = None''')
branch_source = branch_source.replace('                active.remove(oldest)', '                active.remove(oldest)\n                last_stolen = oldest')
branch_source = branch_source.replace('            seen.append(seq)', "            seen.append(seq)\n            checkpoint('admission', admitted=active[-1])")
branch_source = branch_source.replace('        active = [v for v in active if end < v[0]+v[2]]', '''        expired = [v for v in active if not end < v[0]+v[2]]
        active = [v for v in active if end < v[0]+v[2]]
        checkpoint('end-prune', expired)''')
namespace = dict(frozen.__dict__)
exec(compile(branch_source, '<frozen-branch-instrumentation>', 'exec'), namespace)
reference = namespace['reference']


def compare(voices, times=None, epoch=0, order=None):
    times = [0, 128/48000, 256/48000] if times is None else times
    order = [v[1] for v in sorted(voices, key=lambda v:(v[0],v[1]))] if order is None else order
    actual, expected = [], []
    b = m.Budget()
    result = m.branch(times, 0, len(times)-1, epoch, voices, order, b, trace=actual)
    ref = reference(times, 0, len(times)-1, epoch, voices, order, frozen.Budget(), expected)
    assert result == ref, (result, ref)
    aa, ee = normalized(actual), normalized(expected)
    if aa != ee:
        mismatch = next((i for i,(a,e) in enumerate(zip(aa,ee)) if a != e), min(len(aa),len(ee)))
        RESULTS['failures'].append({'kind':'transition','mismatch':mismatch,'actual':aa[mismatch:mismatch+1],
                                    'reference':ee[mismatch:mismatch+1], 'voices': voices})
        raise AssertionError('Transition mismatch at '+str(mismatch))
    assert b.work == sum(b.counters.values())
    return result, actual, b


class Controls(unittest.TestCase):
    def test_exhaustive_domain(self):
        options=list(itertools.product([0,.001],[.001,.005],[0,.001]))
        count=0
        for rows in itertools.product(options, repeat=3):
            # Production time premise onset>=emission-1e-9; domain includes only legal rows.
            if any(onset < emission-1e-9 for onset,duration,emission in rows):
                continue
            voices=[(onset,i+1,duration,emission) for i,(onset,duration,emission) in enumerate(rows)]
            compare(voices)
            count+=1
        RESULTS['finiteDomain']['legalDenominator']=count
        self.assertEqual(count,216)

    def test_manual_65_voices(self):
        r,t,b=compare([(0,i,1,0) for i in range(1,66)],times=[0])
        self.assertEqual([v[1] for v in t[-1]['live']],list(range(2,66)))
        self.assertEqual(r['erasedSequenceOrderSha256'],hashlib.sha256(b'1\n').hexdigest())
        self.assertEqual(r['stolenVoices'],1)
        RESULTS['cases'].append({'name':'65 voices','result':r,'work':b.work,'last':t[-1]})

    def test_nonconsecutive_sequence_ties(self):
        seqs=list(range(100,164))+[4]
        r,t,b=compare([(0,i,1,0) for i in seqs],times=[0])
        self.assertEqual([v[1] for v in t[-1]['live']],list(range(100,164)))
        self.assertEqual(r['erasedSequenceOrderSha256'],hashlib.sha256(b'4\n').hexdigest())

    def test_expiry_exact_and_nextafter(self):
        for boundary in [math.nextafter(.5,-math.inf),.5,math.nextafter(.5,math.inf)]:
            s=m.ActiveVoices(m.Budget(),'synthetic');s.admit(0,1,.5,0)
            expired=s.prune(boundary)
            self.assertEqual([v[1] for v in expired], [] if boundary<.5 else [1])
        # Exact render boundary expiry removes current-block voice without stealing.
        r,t,b=compare([(0,1,128/48000,0)],times=[0])
        self.assertEqual(t[-1]['live'],())
        self.assertEqual(r['stolenVoices'],0)
        self.assertEqual([v[1] for v in t[-1]['expired']],[1])

    def test_expiry_before_steal_and_stale_oldest(self):
        s=m.ActiveVoices(m.Budget(),'synthetic')
        for i in range(1,65):s.admit(0,i,.01 if i==1 else 1,0)
        s.prune(.01);s.admit(.01,65,1,1);s.admit(.01,66,1,1)
        self.assertEqual(s.last_stolen[1],2)
        self.assertEqual(s.stolen,1)
        self.assertEqual([v[1] for v in s.live.values()],list(range(3,67)))

    def test_stale_expiry_after_steal(self):
        s=m.ActiveVoices(m.Budget(),'synthetic')
        for i in range(1,66):s.admit(0,i,.01 if i==1 else 1,0)
        self.assertEqual(s.prune(.01),[])
        self.assertEqual(s.stolen,1)
        self.assertEqual(len(s.live),64)
        self.assertGreater(s.budget.counters['stale'],0)

    def test_rebuild_exact192_excludes_incoming(self):
        s=m.ActiveVoices(m.Budget(),'synthetic')
        for i in range(1,193):s.admit(0,i,1,0)
        self.assertEqual(len(s.expiry.data),192)
        before=tuple(s.live)
        s.admit(0,193,1,0)
        self.assertEqual(s.compactions,1)
        self.assertEqual(len(s.expiry.data),64)
        self.assertEqual(tuple(s.live),before[1:]+(('synthetic',193),))
        self.assertEqual(sum(t[1]==193 for t in s.expiry.data),1)
        self.assertEqual(len({t[1] for t in s.expiry.data}),64)
        RESULTS['cases'].append({'name':'compaction192','snapshot':s.snapshot(),
                                'counters':s.budget.counters,'work':s.budget.work})

    def test_multiple_compactions_and_order(self):
        r,t,b=compare([(0,i,1,0) for i in range(1,601)],times=[0])
        self.assertEqual([v[1] for v in t[-1]['live']],list(range(537,601)))
        self.assertEqual(r['stolenVoices'],536)
        RESULTS['cases'].append({'name':'multiple compactions','work':b.work,'counters':b.counters})

    def test_retired_identity_reuse(self):
        for retired in ('expiry','steal'):
            s=m.ActiveVoices(m.Budget(),'synthetic');s.admit(0,1,.01,0)
            if retired=='expiry':s.prune(.01)
            else:
                for i in range(2,66):s.admit(0,i,1,0)
            before=s.snapshot()
            with self.assertRaises(m.HeapInvariantFailure):s.admit(.01,1,1,1)
            self.assertEqual(s.snapshot(),before)

    def test_exact_heap_counts(self):
        b=m.Budget();h=m.CountedHeap(b,'tiny');h.push((1,1,None))
        self.assertEqual(b.work,4)
        h.push((0,2,None));self.assertEqual(b.work,20)
        self.assertEqual(h.pop()[1],2);self.assertEqual(b.work,29)
        self.assertEqual(h.pop()[1],1);self.assertEqual(b.work,33)
        RESULTS['cases'].append({'name':'hand counted tiny heap','work':b.work,'counters':b.counters})

    def test_wrong_onset_order(self):
        with self.assertRaises(m.ConditionalInconsistency):
            m.branch([0],0,0,0,[(0,1,1,0),(0,2,1,0)],[2,1],m.Budget())

    def test_clock_and_late_boundaries(self):
        compare([],times=[0,0,0,3*128/48000],epoch=.0001)
        # Previous end=quantum; second start gap 99ms, end gap 101.666...ms.
        q=128/48000
        with self.assertRaisesRegex(m.ConditionalInconsistency,'engine end interrupted'):
            m.branch([0,q+.099],0,1,0,[],[],m.Budget())
        self.assertEqual(m.interruption_checks(.1,.1,None,0)['engineEndInterrupted'],False)
        self.assertEqual(m.interruption_checks(math.nextafter(.1,math.inf),math.nextafter(.1,math.inf),None,0)['engineEndInterrupted'],True)
        self.assertEqual(m.late_checks(0,.018,.021),{'engineEndLate':True,'synthBlockStartLate':False})
        self.assertEqual(m.late_checks(0,.021,.018),{'engineEndLate':False,'synthBlockStartLate':True})
        with self.assertRaisesRegex(m.ConditionalInconsistency,'clock-fatal'):
            m.branch([0]*9,0,8,0,[],[],m.Budget())

    def test_pending_exact_cap_and_overflow(self):
        r=m.branch([0],0,0,0,[(1,i,1,0) for i in range(1,5377)],[],m.Budget())
        self.assertEqual(r['peakDerivedPending'],5376)
        with self.assertRaisesRegex(m.ConditionalInconsistency,'pending overflow'):
            m.branch([0],0,0,0,[(1,i,1,0) for i in range(1,5378)],[],m.Budget())

    def test_alias_invariant(self):
        s=m.ActiveVoices(m.Budget(),'synthetic');record=s.admit(0,1,1,0)
        alias=tuple([*record])
        with self.assertRaises(m.HeapInvariantFailure):s.token_live((0,1,alias))

    def test_resource_each_heap_and_rebuild_charge(self):
        # Check every charge boundary within incoming-at-192 compaction, including
        # immediately before/after installation. Each injected failure is typed,
        # has no returned completion, and retains the last completed transitions.
        class FaultBudget(m.Budget):
            def __init__(self):super().__init__();self.ordinal=0;self.fail_at=None
            def charge(self,n,category):
                self.ordinal+=1
                super().charge(n,category)
                if self.ordinal==self.fail_at:raise m.TypedResourceFailure('injected '+category)
        b=FaultBudget();s=m.ActiveVoices(b,'synthetic')
        for i in range(1,193):s.admit(0,i,1,0)
        import copy
        baseline=copy.deepcopy(s);start=b.ordinal
        s.admit(0,193,1,0);stop=b.ordinal
        failures=[]
        for position in range(start+1,stop+1):
            trial=copy.deepcopy(baseline);trial.budget.fail_at=position
            with self.assertRaises(m.TypedResourceFailure):trial.admit(0,193,1,0)
            failures.append({'ordinal':position-start,'lastCharge':trial.budget.last_charge,
                             'liveIds':[v[1] for v in trial.live.values()],
                             'oldestTokens':len(trial.oldest.data),'expiryTokens':len(trial.expiry.data),
                             'completed':False,'disposition':'unresolved'})
        RESULTS['resourceChargeFailures']=failures
        self.assertGreater(len(failures),100)
        # Whole branch exhaustion never returns a branch result or inconsistency.
        with self.assertRaises(m.TypedResourceFailure):m.branch([0],0,0,0,[],[],m.Budget(work=0))

    def test_shared_future_is_immutable(self):
        b=m.Budget();future=m.prepare_future([(0,2,1,0),(0,1,1,0)],b)
        self.assertIsInstance(future,tuple)
        for _ in range(2):m.branch([0],0,0,0,future,[1,2],b,prepared=True)
        self.assertEqual(future,((0,1,1,0),(0,2,1,0)))

    def test_sparse_dense_cost(self):
        # Pure legal synthetic dense replacement: constant 64 live membership,
        # monotonically increasing emissions/onsets, one due item per block.
        n=5000;q=128/48000
        voices=[(i*q,i+1,20,i*q) for i in range(n)]
        b=m.Budget();r=m.branch([i*q for i in range(n)],0,n-1,0,voices,list(range(1,n+1)),b)
        RESULTS['denseCost']={'admissions':n,'work':b.work,'workPerAdmission':b.work/n,
                             'counters':b.counters,'result':r,'rss':b.rss,
                             'projection435488Admissions':b.work/n*435488,
                             'warning':'Exceeds 50m; projection is synthetic, not original measurement.'}
        self.assertEqual(b.work,sum(b.counters.values()))
        self.assertGreater(b.work/n*435488,50_000_000)
        r,t,b=compare([],times=[0,q,2*q]);RESULTS['sparseCost']={'work':b.work,'counters':b.counters}


if __name__=='__main__':
    runner=unittest.TextTestRunner(verbosity=2)
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(Controls)
    result=runner.run(suite)
    RESULTS['testsRun']=result.testsRun
    RESULTS['passed']=result.wasSuccessful()
    RESULTS['unittestFailures']=[{'test':str(t),'traceback':message} for t,message in result.errors+result.failures]
    (HERE/'source-controls-01.json').write_text(json.dumps(RESULTS,sort_keys=True,indent=2)+'\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
