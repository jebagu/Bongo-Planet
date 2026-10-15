"""Render and validate every native composer note; no ROM is bundled."""
import array
import json
from pathlib import Path
import subprocess
import tempfile
import re
from extract import ROOT, save_wav

def main():
    out=ROOT/'assets';manifest=json.loads((out/'manifest.json').read_text())
    library=ROOT/'tools/spc-dsp'
    with tempfile.TemporaryDirectory(prefix='mario-paint-') as temp:
        temp=Path(temp);exe=temp/'render'
        subprocess.run(['clang++','-std=c++17','-O2','-DNDEBUG','-DBLARGG_LITTLE_ENDIAN=1',str(ROOT/'tools/render.cpp'),*[str(library/f) for f in ['Snes_Spc.cpp','Spc_Cpu.cpp','Spc_Dsp.cpp']],'-o',str(exe)],check=True)
        counts={'notes':0,'nonSilent':0,'clipped':0,'tailsTruncated':0}
        for inst in manifest['instruments']:
            for note in inst['notes']:
                pcmfile=temp/'note.pcm'
                result=subprocess.run([str(exe),str(out/'raw/composer-aram.bin'),str(inst['composerIndex']),str(note['staffPosition']),str(pcmfile)],capture_output=True,text=True,check=True)
                actual={key:int(value) for key,value in re.findall(r'(\w+)=(\d+)',result.stdout)}
                assert actual['mode']==1
                assert actual['sample']==note['sampleIndex'],result.stdout
                assert actual['nspc']==note['nspcNote'],result.stdout
                assert actual['fine']==inst['finePitchByte'],result.stdout
                pcm=array.array('h');pcm.frombytes(pcmfile.read_bytes())
                audible=[i for i in range(len(pcm)//2) if pcm[i*2] or pcm[i*2+1]]
                assert audible, result.stdout
                assert audible[-1]<64000-3200, 'Two-second renderer cuts off a note tail'
                # Remove command latency while preserving 16 samples of leading silence.
                start=max(0,audible[0]-16);end=min(64000,audible[-1]+1+320)
                stereo=list(pcm[start*2:end*2]);mono=[(stereo[i]+stereo[i+1])//2 for i in range(0,len(stereo),2)]
                p=out/note['wav'];p.parent.mkdir(parents=True,exist_ok=True);save_wav(p,mono)
                sp=out/'stereo-notes'/p.relative_to(out/'notes');sp.parent.mkdir(parents=True,exist_ok=True);save_wav(sp,stereo,2)
                peak=max(abs(v) for v in stereo)
                note.update({'stereoWav':str(sp.relative_to(out)),'sampleRate':32000,'frames':len(mono),'durationSeconds':len(mono)/32000,'removedLeadingFrames':start,'peakStereo':peak,'peakMono':max(abs(v) for v in mono),'gainNormalization':False,'renderMethod':'ROM SPC700 composer driver + Game_Music_Emu fast DSP, echo disabled'})
                counts['notes']+=1;counts['nonSilent']+=bool(any(mono));counts['clipped']+=peak>=32767
        manifest['audioRendering']={'library':json.loads((library/'provenance.json').read_text()),'validation':counts,'leadingSilencePolicy':'Trim command latency; retain 16 frames before first nonzero sample','trailingSilencePolicy':'Retain 320 frames after last nonzero sample','noteGate':'Original composer gate ticks, independent of tempo; no amplitude normalization','accuracyLimit':'Fast DSP approximates some interpolation and timing; isolated driver state, not full console / analog capture'}
        (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        (ROOT/'validation.json').write_text(json.dumps(counts,indent=2)+'\n')
        print(json.dumps(counts))

if __name__=='__main__':main()
