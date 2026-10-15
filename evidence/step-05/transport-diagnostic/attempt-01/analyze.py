"""Read-only same-domain analysis of the retained failed diagnostic, not a timing oracle."""
import json, math, hashlib
from pathlib import Path
p=Path(__file__).parent
r=json.loads((p/'report.json').read_text())
def summary(values):
    a=sorted(values)
    return {'count':len(a),'median':a[max(0,math.ceil(len(a)*.5)-1)] if a else None,'p95':a[max(0,math.ceil(len(a)*.95)-1)] if a else None,'max':a[-1] if a else None,'total':sum(a)}
out={'diagnosticOnly':True,'qualificationPassed':False,'status':r['status'],'stages':[],'limitations':['All Node callback/phase values are Node-domain elapsed durations; browser values use browser-domain clocks.','Promise/ACK lifetime includes all intervening work, not network/IPC transit.','The only attempted arm failed before24s; the requested matched24s dispatch subset is incomplete.','Original handler timings cover synchronous callbacks only; deferred UI/render/GPU/GC remain unallocated.','No socket arm, no two-arm comparison or original-failure cause assignment.']}
for s in r['stages']:
    d=p/s['name'];b=json.loads((d/'browser-trace.json').read_text());n=json.loads((d/'node-trace.json').read_text())
    start=s['exposureStart']['browserMonotonicMs'];stop=s['browserObservation']['firstError']['browserMonotonicMs']
    active=[x for x in b if start<=x.get('receiveBrowserMonotonicMs',x.get('browserMonotonicMs',-1))<=stop]
    row={'name':s['name'],'actualPreErrorBrowserExposureSeconds':(stop-start)/1000,'firstError':s['browserObservation']['firstError'],'nodeCallbacks':len(n),'phaseMs':{},'callbackByKind':{},'originalHandlerMs':summary([x['handlerEndMs']-x['handlerStartMs'] for x in active if x['kind']=='original-handler']),'browserHeartbeatMs':summary([x['elapsedMs'] for x in active if x['kind']=='heartbeat']),'frameGapsMs':summary([x['gapMs'] for x in active if x['kind']=='frame' and x['gapMs'] is not None]),'longTaskMs':summary([x['durationMs'] for x in b if x['kind']=='longtask' and start<=x['startTimeMs']<=stop]),'latencySubsets':s['latencySubsets'],'traceRecords':len(b),'collectorFailure':s.get('collectorFirstFailure'),'derived':s['derived']}
    for label,a,z in [('reconstruction','reconstructionStartMs','reconstructionEndMs'),('wireDecode','wireDecodeStartMs','wireDecodeEndMs'),('decode','decodeStartMs','decodeEndMs'),('validate','validateStartMs','validateEndMs'),('write','writeStartMs','writeEndMs'),('ackEnqueue','ackStartMs','ackEndMs')]:row['phaseMs'][label]=summary([x[z]-x[a] for x in n if a in x and z in x])
    for kind in ['pcm','events']:row['callbackByKind'][kind]=summary([x['exitMs']-x['arrivalObservedAtCallbackEntryMs'] for x in n if x['kind']==kind])
    for kind in ['pcm','event']:
        rows=[x for x in b if x['kind']==kind+'-dispatch']
        row[kind+'BrowserPayloadMs']=summary([x['payloadEndMs']-x['payloadStartMs'] for x in rows]);row[kind+'BrowserDispatchMs']=summary([x['dispatchEndMs']-x['dispatchStartMs'] for x in rows])
    out['stages'].append(row)
(p/'analysis.json').write_text(json.dumps(out,indent=2)+'\n')
for s in out['stages']:
    print(json.dumps({k:v for k,v in s.items() if k not in ['latencySubsets','firstError','derived']},indent=2))
