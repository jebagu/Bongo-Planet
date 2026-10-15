from pathlib import Path
import json,numpy as np
ROOT=Path(__file__).resolve().parent
def compare(a,b):
 size=1<<((len(a)+len(b)-1).bit_length())
 cross=np.fft.irfft(np.fft.rfft(a,size)*np.conj(np.fft.rfft(b,size)),size)
 lag=int(np.argmax(cross));lag=lag if lag<size//2 else lag-size
 start_a=max(0,lag);start_b=max(0,-lag);length=min(len(a)-start_a,len(b)-start_b)
 x=a[start_a:start_a+length];y=b[start_b:start_b+length]
 active=(np.abs(x)+np.abs(y))>1e-6
 return {'lagSamples':lag,'overlapFrames':length,'rmsError':float(np.sqrt(np.mean((x-y)**2))),'peakError':float(np.max(np.abs(x-y))),'correlation':float(np.corrcoef(x,y)[0,1]),'relativeError':float(np.sqrt(np.sum((x-y)**2)/np.sum(x*x))),'activeFrames':int(np.sum(active))}
report={'node':{},'device':{}}
for fixture in ['F01','F08','F09']:
 paths=[sorted(ROOT.glob(f'{browser}-{fixture}-*.json'))[0] for browser in ['chrome','iab']]
 ds=[json.loads(p.read_text()) for p in paths]
 a,b=[np.fromfile(p.with_suffix('.f32'),dtype='<f4') for p in paths]
 report['node'][fixture]={'files':[p.name for p in paths],'equalScene':ds[0]['scene']==ds[1]['scene'],'sampleRates':[d['sampleRate'] for d in ds],'onsets':[sum(e['type']=='onset' for e in d['events']) for d in ds],'comparison':compare(a,b),'level':[{'peak':float(np.max(np.abs(x))),'rms':float(np.sqrt(np.mean(x*x))),'fractionAbovePoint9':float(np.mean(np.abs(x)>.9))}for x in [a,b]]}
for fixture in ['F01','F08']:
 paths=[ROOT/f'{browser}-device-{fixture}{"-02" if browser=="chrome" else ""}.json' for browser in ['chrome','iab']]
 if not all(p.exists() for p in paths):continue
 ds=[json.loads(p.read_text()) for p in paths];signals=[np.fromfile(p.with_suffix('.f32'),dtype='<f4').reshape(-1,d['channels']) for p,d in zip(paths,ds)]
 a,b=[x.mean(axis=1) for x in signals]
 report['device'][fixture]={'files':[p.name for p in paths],'rates':[d['rate'] for d in ds],'comparison':compare(a,b),'stereoDifferences':[float(np.max(np.abs(x[:,0]-x[:,1])))for x in signals]}
(ROOT/'analysis.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
