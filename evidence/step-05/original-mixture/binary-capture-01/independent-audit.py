#!/usr/bin/env python3
"""Read completed evidence only. Independent parser; no production imports or product fitting.
Run: python3 <this-file>. Creates only independent-audit.json (exclusive).
"""
import collections, hashlib, json, math, mmap, pathlib, struct, sys, time
P = pathlib.Path(__file__).resolve().parent
OUT = P / 'independent-audit.json'
RATE, Q = 48000, 128
PLAN = [('F02',64,0),('F03',24,0),('F06',20,0),('F08',20,0),('F02',12,.1)]
result = {'title':'Bongo Planet independent binary acquisition audit','acceptancePassed':False,'qualificationPassed':False,'errors':[],'segments':[]}
def need(ok, why):
    if not ok: raise ValueError(why)
def finite(x):
    if isinstance(x,float): need(math.isfinite(x),'Nonfinite JSON number')
    elif isinstance(x,dict):
        for v in x.values(): finite(v)
    elif isinstance(x,list):
        for v in x: finite(v)
def read(name):
    return json.loads((P/name).read_text())
def sha(name):
    h=hashlib.sha256()
    with (P/name).open('rb') as f:
        for b in iter(lambda:f.read(1048576),b''): h.update(b)
    return h.hexdigest()
def fnv(b):
    h=2166136261
    for v in b: h=((h^v)*16777619)&0xffffffff
    return h

def run():
    r=read('report.json');finite(r)
    need(r['captureErrorFree'] is True and r['status']=='captured-observation' and r['errors']==[], 'Reported acquisition failed')
    need(r['acceptancePassed'] is False and r['qualificationPassed'] is False,'Overclaimed qualification')
    need(r['setup']['sampleRate']==RATE and r['setup']['inputLabel']=='SPAT 8ch loopback (Virtual)' and '--mute-audio' not in r['browserArguments'],'Route/sample rate mismatch')
    for k in ['browserClosed','browserProcessClosed','socketServerClosed','containerFdClosed','serverClosed','nodeCallbackAdmissionClosed']: need(r[k] is True,'Cleanup '+k)
    need(r['nodeInFlightAtClose']==0 and r['collectorFailure'] is None,'Collector cleanup')
    c=r['cleanup']; need(c['contextState']=='closed' and c['tracksStopped'] and c['socketClosed'],'Audio/socket cleanup')
    for k in ['pending','eventPending','socketPending']: need(c[k]==0,'Pending cleanup '+k)
    for k in ['error','firstError','firstOverflow']: need(c[k] is None,'Cleanup error '+k)
    manifest=read('manifest-final.json'); hashes={}
    for entry in manifest['files']:
        name=entry['path']; actual=sha(name); hashes[name]=actual
        need((P/name).stat().st_size==entry['bytes'] and actual==entry['sha256'],'Manifest binding '+name)
    result['manifest']={'filesVerified':len(hashes),'sha256':sha('manifest-final.json')}
    for phase in ['Before','After']:
        b=r['served'+phase]
        need(b['mainSha256']==r['mainHash'] and b['processorSha256']==r['processorHash'],'Served binding '+phase)
        need(sha('served-'+phase.lower()+'.html')==b['htmlSha256'],'Served HTML '+phase)
    for name,wanted in [(r['mainAsset'],r['mainHash']),(r['processorAsset'],r['processorHash'])]: need(sha('source/'+name)==wanted,'Asset '+name)
    for name,wanted in r['sourceHashes'].items(): need(sha('application-source/'+name)==wanted,'Source '+name)
    need(sha('capture-harness.ts')==r['harnessSha256'] and sha('observer-worklet.js')==r['observerSha256'] and sha('topology.json')==r['topologySha256'],'Harness/observer/topology')
    result['bindings']={'reportSha256':sha('report.json'),'quantumsSha256':sha('quantums.jsonl'),'eventsSha256':sha('events.jsonl'),'mainSha256':r['mainHash'],'processorSha256':r['processorHash'],'captureHarnessSha256':r['harnessSha256'],'auditHarnessSha256':sha('independent-audit.py')}
    blocks=[]; first_emissions={}; event_types=collections.Counter(); per_segment=collections.Counter(); seq={1:0,2:0}; frame_rows=[]
    callback=chunk=chunk_offset=0; identity=None; event_count=0; raw_offset=0; frame_count=0; max_frame=0
    peaks=[0.,0.]; samples=[0,0]; nonfinite=[0,0]
    with (P/'capture.container').open('rb') as container,(P/'product-tap.f32').open('rb') as sf,(P/'virtual-input.f32').open('rb') as inf,(P/'quantums.jsonl').open() as qf,(P/'events.jsonl').open() as ef:
        offset=0
        while True:
            prefix=container.read(4)
            if not prefix: break
            need(len(prefix)==4,'Partial container prefix')
            n=struct.unpack('<I',prefix)[0]; need(28<=n<=262144,'Frame length cap')
            data=container.read(n);need(len(data)==n,'Truncated frame')
            magic,version,kind,s,json_len,ns,ni=struct.unpack('<7I',data[:28])
            need(magic==0x42475031 and version==1 and kind in (1,2),'Wire header')
            need(s==seq[kind] and n==28+json_len+4*(ns+ni),'Sequence/frame denominator')
            meta=json.loads(data[28:28+json_len]);finite(meta);need(meta['sequence']==s,'Payload sequence')
            frame_rows.append((kind,s,n,offset));max_frame=max(max_frame,n)
            if kind==1:
                need(ns==ni==4096 and len(meta['blocks'])==32,'PCM batch denominator')
                raw=data[28+json_len:]; source=raw[:ns*4]; inp=raw[ns*4:]
                need(fnv(source)==meta['sourceChecksum32'] and fnv(inp)==meta['inputChecksum32'],'Original-byte FNV')
                need(sf.read(len(source))==source and inf.read(len(inp))==inp,'Derived raw bytes differ')
                for path,b in enumerate([source,inp]):
                    for (v,) in struct.iter_unpack('<f',b):
                        samples[path]+=1
                        if not math.isfinite(v):nonfinite[path]+=1
                        else:peaks[path]=max(peaks[path],abs(v))
                for block in meta['blocks']:
                    i=len(blocks)
                    need(block['index']==i and block['quantum']==Q and block['sourceLength']==block['inputLength']==Q and block['sourceChannels']>0 and block['inputChannels']>0,'Block shape/index')
                    need(type(block['currentFrame']) is int and abs(block['currentTime']*RATE-block['currentFrame'])<.01,'Clock metadata')
                    expected={**block,'sourceOffset':i*Q,'inputOffset':i*Q,'containerFrame':frame_count,'containerOffset':offset,'pcmSequence':s}
                    line=qf.readline();need(bool(line) and json.loads(line)==expected,'Derived quantum metadata equality')
                    blocks.append(expected)
                raw_offset+=ns
            else:
                need(ns==ni==0 and meta['kind']=='events','Event frame shape')
                rows=meta['events'];need(0<len(rows)<=2048 and 0<meta['callbackRows']<=2048,'Event row cap')
                need(meta['callbackIndex']==callback and meta['chunkIndex']==chunk and meta['chunkOffset']==chunk_offset,'Callback/chunk order')
                current=tuple(meta[k] for k in ['callbackIndex','callbackRows','chunkCount','segment','sessionNamespace','receiveContextTime','receiveBrowserMonotonicMs'])
                if identity is None:identity=current
                need(identity==current and 0<=chunk<meta['chunkCount'] and chunk_offset+len(rows)<=meta['callbackRows'],'Callback metadata identity')
                segment=meta['segment'];need(segment is None or type(segment) is int and 0<=segment<5,'Event segment')
                for i,event in enumerate(rows):
                    session=event.get('trigger',{}).get('session',event.get('session',meta['sessionNamespace']))
                    expected={'independentEventIndex':event_count,'perSegmentEventIndex':per_segment[segment],'sessionNamespace':session,'eventBatchIndex':s,'segment':segment,'receiveContextTime':meta['receiveContextTime'],'receiveBrowserMonotonicMs':meta['receiveBrowserMonotonicMs'],'event':event,'containerFrame':frame_count,'containerOffset':offset,'originalCallbackIndex':callback,'originalCallbackRows':meta['callbackRows'],'originalCallbackRowIndex':chunk_offset+i,'chunkIndex':chunk,'chunkCount':meta['chunkCount'],'chunkOffset':chunk_offset}
                    line=ef.readline();need(bool(line) and json.loads(line)==expected,'Derived full event/provenance equality')
                    if event['type']=='emission' and segment not in first_emissions:first_emissions[segment]=expected
                    event_types[(segment,event['type'])]+=1; per_segment[segment]+=1;event_count+=1
                chunk_offset+=len(rows);chunk+=1
                if chunk==meta['chunkCount']:
                    need(chunk_offset==meta['callbackRows'],'Incomplete callback rows');callback+=1;chunk=chunk_offset=0;identity=None
            seq[kind]+=1;frame_count+=1;offset+=4+n
        need(not sf.read(1) and not inf.read(1) and not qf.read(1) and not ef.read(1),'Unparsed derived tail')
        need(chunk==0 and identity is None,'Incomplete callback at EOF')
    need(nonfinite==[0,0],'Nonfinite raw PCM')
    need(offset==(P/'capture.container').stat().st_size and seq[1]==r['stats']['batches'] and seq[2]==r['stats']['eventBatches'] and len(blocks)==r['stats']['blocks'] and event_count==r['stats']['events'],'Report denominators')
    need(samples==[r['stats']['sourceSamples'],r['stats']['inputSamples']] and callback==r['originalEventCallbacks'],'Sample/callback denominator')
    result['container']={'sha256':sha('capture.container'),'bytes':offset,'frames':frame_count,'pcmFrames':seq[1],'eventFrames':seq[2],'originalEventCallbacks':callback,'eventRows':event_count,'maxFrameBytes':max_frame,'tailBytes':0,'allRawBytesAndDerivedRecordsEqual':True,'allOriginalByteChecksumsMatch':True,'allCallbackAssembliesComplete':True}
    for i,name in enumerate(['product-tap','virtual-input']):
        h=sha(name+'.f32');need(h==r[name+'RawSha256'],'Report raw SHA')
        result[name]={'sha256':h,'samples':samples[i],'bytes':samples[i]*4,'nonfiniteSamples':nonfinite[i],'peak':peaks[i]}
    anomalies=[{'index':b['index'],'gapSamples':b['currentFrame']-a['currentFrame']-Q} for a,b in zip(blocks,blocks[1:]) if b['currentFrame']!=a['currentFrame']+Q]
    result['metadata']={'blocks':len(blocks),'firstContextTime':blocks[0]['currentTime'],'lastContextEnd':blocks[-1]['currentTime']+Q/RATE,'clockAnomalies':anomalies,'maxClockResidualSamples':max(abs(b['currentTime']*RATE-b['currentFrame']) for b in blocks)}
    result['events']={'events':event_count,'batches':seq[2],'segmentCounts':{str(k):v for k,v in per_segment.items()},'typesBySegment':{str(i):{t:n for (seg,t),n in event_types.items() if seg==i} for i in range(5)}}
    # Append completion precedes ACK enqueue, in one Node clock domain.
    trace=read('node-retention-trace.json');need(len(trace)==frame_count,'Node trace denominator')
    for row,(kind,s,n,off) in zip(trace,frame_rows):
        need(row['kind']==kind and row['sequence']==s and row['expectedRecordBytes']==row['writtenBytes']==n+4,'Node/container admission join')
        times=[row[k] for k in ['arrivalObservedAtCallbackEntryMs','decodeStartMs','decodeEndMs','validateStartMs','validateEndMs','writeStartMs','writeEndMs','ackEnqueueStartMs','ackEnqueueEndMs','exitMs']]
        need(all(math.isfinite(t) for t in times) and times==sorted(times),'Node append/ACK ordering')
    bt=read('browser-retention-trace.json');dispatches={};settlements={}
    for row in bt:
        kind,action=row['kind'].split('-');key=(kind,row['sequence'])
        dest=dispatches if action=='dispatch' else settlements
        need(action in ['dispatch','settlement'] and key not in dest,'Browser duplicate/unknown trace')
        dest[key]=row
    need(len(dispatches)==len(settlements)==frame_count and dispatches.keys()==settlements.keys(),'Browser ACK denominator')
    for kind,s,_,_ in frame_rows:
        key=('pcm' if kind==1 else 'event',s);d=dispatches[key];a=settlements[key]
        need(a['success'] is True and a['settledBrowserMonotonicMs']>=d['dispatchStartMs'],'Browser acknowledgement')
    result['retention']={'nodeCompleteWritesBeforeAck':len(trace),'browserDispatches':len(dispatches),'successfulSettlements':len(settlements),'unresolved':0,'recordedCleanupComplete':True,'clockDomainsNeverSubtracted':True}
    def interval(start,end):
        need(math.isfinite(start) and math.isfinite(end) and end>start,'Invalid analysis interval')
        first=next(i for i,b in enumerate(blocks) if b['currentTime']+Q/RATE>start)
        last=next(i for i in range(len(blocks)-1,-1,-1) if blocks[i]['currentTime']<end)
        selected=blocks[first:last+1]
        need(bool(selected) and selected[0]['currentTime']<=start+.01/RATE and selected[-1]['currentTime']+Q/RATE>=end-.01/RATE and len(selected)*Q>=(end-start)*RATE-.01,'Full original-order interval coverage')
        return {'startContextTime':start,'endContextTime':end,'firstOriginalIndex':first,'lastOriginalIndex':last,'blocks':len(selected),'orderedSamples':len(selected)*Q,'fullPaths':True,'contextCovered':True,'clockStepAnomalies':[a for a in anomalies if first<a['index']<=last]}
    with (P/'product-tap.f32').open('rb') as sf,(P/'virtual-input.f32').open('rb') as inf:
        with mmap.mmap(sf.fileno(),0,access=mmap.ACCESS_READ) as source,mmap.mmap(inf.fileno(),0,access=mmap.ACCESS_READ) as inp:
            def calibration(cal):
                clicks=cal['clicks'];lo=cal['retainedBlocksBefore'];hi=cal['retainedBlocksAfter']
                need(type(lo) is int and type(hi) is int and 0<=lo<hi<=len(blocks),'Native retention bounds')
                need(len(clicks)==12 and cal['noProductPCMFit'] and cal['bypassesProductDelayAndTap'],'Native plan')
                support=interval(clicks[0]['expectedContextTime']-.05,clicks[-1]['expectedContextTime']+.25)
                need(lo<=support['firstOriginalIndex']<=support['lastOriginalIndex']<hi,'Native support outside own retention')
                need(all(v==0 for (v,) in struct.iter_unpack('<f',source[lo*Q*4:hi*Q*4])),'Nonzero product during native calibration')
                runs=[];cursor=lo*Q;end=hi*Q;pulse=struct.pack('<f',.3)
                while cursor<end:
                    b=inp[cursor*4:cursor*4+4]
                    if struct.unpack('<f',b)[0]==0:cursor+=1;continue
                    begin=cursor
                    while cursor<end and inp[cursor*4:cursor*4+4]==pulse:cursor+=1
                    need(cursor>begin and cursor-begin==48,'Non-native sample or changed rectangle')
                    runs.append({'inputRawSampleIndex':begin,'samples':cursor-begin})
                need(len(runs)==12,'Native detection denominator')
                for j,(click,hit) in enumerate(zip(clicks,runs)):
                    need(click['samples']==48 and click['amplitude']==.3 and abs(click['expectedContextTime']-(cal['scheduledAtContextTime']+.5+.3*j))<1e-9,'Native schedule changed')
                    expected=round(click['expectedContextTime']*RATE)
                    matching=[b for b in blocks[lo:hi] if b['currentFrame']<=expected<b['currentFrame']+Q]
                    need(len(matching)==1,'Ambiguous native expected frame')
                    b=matching[0];base=b['inputOffset']+expected-b['currentFrame'];lag=hit['inputRawSampleIndex']-base
                    actualblock=blocks[hit['inputRawSampleIndex']//Q];actual=actualblock['currentTime']+(hit['inputRawSampleIndex']%Q)/RATE
                    hit.update({'expectedContextTime':click['expectedContextTime'],'independentExpectedFrame':expected,'expectedInputRawIndexWithoutRoute':base,'mappingOriginalIndex':b['index'],'nativeLagSamples':lag,'contextLagSamples':(actual-click['expectedContextTime'])*RATE})
                lags={d['nativeLagSamples'] for d in runs};need(len(lags)==1 and 0<=next(iter(lags))<=RATE*.2,'Native lags differ')
                return {'coverage':support,'retainedBlocksBefore':lo,'retainedBlocksAfter':hi,'productTapSilent':True,'supportBoundToRetention':True,'nativeDetections':runs,'nonNativeInputSamples':0,'lagSamples':next(iter(lags)),'nativeLagAgreed':True,'sampleRoundingAllowanceSamples':1,'scope':'Exact raw integer offset; one-sample allowance for native schedule/render quantization, not hardware presentation uncertainty.'}
            def compare(cov,lag):
                mismatch_blocks=mismatch_samples=0;first=[]
                for i in range(cov['firstOriginalIndex'],cov['lastOriginalIndex']+1):
                    start=i*Q;need(start+lag>=0 and (start+lag+Q)*4<=len(inp),'Comparison outside retained path')
                    a=source[start*4:(start+Q)*4];b=inp[(start+lag)*4:(start+lag+Q)*4]
                    if a!=b:
                        mismatch_blocks+=1;n=sum(a[j:j+4]!=b[j:j+4] for j in range(0,Q*4,4));mismatch_samples+=n
                        if len(first)<12:first.append({'originalObserverIndex':i,'mismatchSamples':n})
                return {'lagSamples':lag,'requiredBlocks':cov['blocks'],'comparedBlocks':cov['blocks'],'comparedSamples':cov['blocks']*Q,'uncoveredBlocks':0,'mismatchBlocks':mismatch_blocks,'mismatchSamples':mismatch_samples,'firstMismatches':first,'fullExactEquality':mismatch_blocks==0}
            need(len(r['segments'])==5,'Segment denominator');previous=None
            for i,(seg,(fixture,seconds,delay)) in enumerate(zip(r['segments'],PLAN)):
                need((seg['index'],seg['fixture'],seg['seconds'],seg['delaySeconds'])==(i,fixture,seconds,delay),'Original fixed plan')
                need(sha(f'segment-{i}-fixture.json')==seg['fixtureSha256'] and read(f'segment-{i}-fixture.json')==seg['scene'],'Original fixture binding')
                first=first_emissions[i];actual={k:first[k] for k in ['event','receiveContextTime','receiveBrowserMonotonicMs']}
                need(actual==seg['firstEmission'],'First retained emission mismatch')
                epoch=actual['event']['time'];need(seg['transportEpochContextTime']==seg['fixedAnalysisWindowContextStart']==epoch and seg['fixedAnalysisWindowContextEnd']==epoch+seconds,'Epoch/window normalization')
                need(first['sessionNamespace']==seg['actualSessionNamespace'],'Epoch session mismatch')
                cov=interval(epoch,epoch+seconds);tail=interval(epoch,epoch+seconds+.2);timer=interval(seg['timerContextStart'],seg['timerContextEnd'])
                need((cov['firstOriginalIndex'],cov['lastOriginalIndex'],cov['blocks'])==(seg['firstAnalysisObserverIndex'],seg['lastAnalysisObserverIndex'],seg['analysisBlocks']),'Report analysis denominator')
                need((timer['firstOriginalIndex'],timer['lastOriginalIndex'],timer['blocks'])==(seg['firstOriginalObserverIndex'],seg['lastOriginalObserverIndex'],seg['observedTimedBlocks']),'Report timer denominator')
                elapsed=(seg['nodeMonotonicTimerEndMs']-seg['nodeMonotonicTimerStartMs'])/1000
                need(elapsed>=seg['elapsedMonotonicSeconds']>=seconds and seg['status']=='captured-observation','Unfinished actual timer')
                states=[s for s in seg['snapshots']]+[seg['finalState']]
                for state in states:
                    a=state['audio'];o=state['observer'];need(a['running'] and a['session']==seg['actualSessionNamespace'] and all(a[k]==0 for k in ['lateDrops','lateDropsAudio','telemetryDrops']) and o['error'] is None,'Session/audio/observer status error')
                stalls=seg['stalls'];need([s['durationMs'] for s in stalls]==([100,250] if fixture in ['F06','F08'] else []),'Actual stall denominator')
                for stall in stalls:need(stall['startContextTime']<=stall['independentlyExpectedGroupOnset']<=stall['endContextTime'] and stall['endBrowserMonotonicMs']-stall['startBrowserMonotonicMs']>=stall['durationMs'],'Missed actual stall target/duration')
                before=calibration(seg['calibrationBefore']);after=calibration(seg['calibrationAfter'])
                need(before['coverage']['lastOriginalIndex']<cov['firstOriginalIndex'] and before['retainedBlocksAfter']<=after['retainedBlocksBefore'] and max(tail['lastOriginalIndex'],timer['lastOriginalIndex'])<after['coverage']['firstOriginalIndex'],'Calibration ordering')
                if previous:need(previous['retainedBlocksAfter']<=before['retainedBlocksBefore'],'Reused calibration interval')
                previous=after;need(before['lagSamples']==after['lagSamples'],'Native route changed')
                native=compare(cov,before['lagSamples'])
                row={'index':i,'fixture':fixture,'variant':seg['variant'],'coverage':cov,'lagTail':tail,'timerCoverage':timer,'elapsedMonotonicSeconds':elapsed,'epochBoundToFirstActualRetainedEmission':True,'firstActualEmissionOriginalEventIndex':first['independentEventIndex'],'nativeBefore':before,'nativeAfter':after,'nativeBeforeAfterAgreed':True,'comparisonAtNativeLag':native,'stalls':stalls,'qualificationPassed':False}
                if delay==0:need(native['fullExactEquality'],'Positive path mismatch at fixed native calibration')
                else:
                    delayed=compare(cov,before['lagSamples']+round(delay*RATE));row['comparisonAtNativeLagPlusActualDelay']=delayed
                    need(not native['fullExactEquality'] and delayed['fullExactEquality'],'Actual100ms negative discrimination failed')
                result['segments'].append(row)
    result['captureIntegrityAuditPassed']=True
    result['limitations']=['Raw path equality checks transport identity, not independently identifiable product onsets.','Native lag is calibrated at 120 explicit clicks; no product-derived epoch or offset fit.','Identical or erased voices, saturation and finite-family alias alternatives remain onset-identifiability limits.','No physical-device, human listening, visual or acceptance gate passes follow.','Recorded closure and append-before-ACK do not establish fsync durability.']

if __name__=='__main__':
    need(not OUT.exists(),'Refusing to overwrite independent result')
    started=time.monotonic()
    try:run()
    except Exception as error:
        result['errors'].append(type(error).__name__+': '+str(error));result['captureIntegrityAuditPassed']=False
    result['auditElapsedMonotonicSeconds']=time.monotonic()-started
    with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({'auditPassed':result.get('captureIntegrityAuditPassed',False),'segments':len(result['segments']),'errors':result['errors'],'output':str(OUT),'qualificationPassed':False}))
    sys.exit(0 if result.get('captureIntegrityAuditPassed') else 1)
