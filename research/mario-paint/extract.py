"""Extract Mario Paint composer assets from a caller-supplied, headerless LoROM.

Reference offsets are pinned in source-reference/provenance.json.
Run with the bundled Python runtime (Pillow required).
"""
from pathlib import Path
import argparse
import hashlib
import json
import struct
import re
import wave
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NAMES = ['mario','mushroom','yoshi','star','flower','game-boy','dog','cat','pig','swan','baby','airplane','boat','car','heart']
TIMBRES = ['Mallet / xylophone','Tom / drum','Yoshi voice','Music box','Trumpet','Pulse wave','Dog bark','Cat meow','Pig oink','Orchestra hit','Baby voice','Bowed strings','Drum / cymbal split','Organ','Bass pluck']
STAFF = ['B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5']

def save_wav(path, pcm, channels=1):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(channels);w.setsampwidth(2);w.setframerate(32000)
        w.writeframes(struct.pack('<%dh'%len(pcm),*pcm))

def decode_brr(brr):
    """SNES integer BRR decode, before interpolation, pitch and envelope."""
    pcm=[];p1=p2=0
    for pos in range(0,len(brr),9):
        h=brr[pos];shift=h>>4;f=h&12
        for b in brr[pos+1:pos+9]:
            for n in (b>>4,b&15):
                n=n-16 if n>=8 else n
                s=(n<<shift)>>1 if shift<=12 else (-2048 if n<0 else 0)
                prev2=p2>>1
                if f>=8:
                    s+=p1-prev2
                    if f==8:s+=(prev2>>4)+((p1*-3)>>6)
                    else:s+=((p1*-13)>>7)+((prev2*3)>>4)
                elif f:s+=(p1>>1)+((-p1)>>5)
                s=max(-32768,min(32767,s));s=((s*2+32768)%65536)-32768
                pcm.append(s);p2,p1=p1,s
    return pcm

def offset(addr):
    return ((addr >> 16) & 0x7f) * 0x8000 + (addr & 0x7fff)

def upload(rom, addr, ram):
    pos = offset(addr)
    blocks = []
    while True:
        length, dest = struct.unpack_from('<HH', rom, pos)
        if not length:
            return blocks, dest
        assert dest + length <= 65536
        ram[dest:dest+length] = rom[pos+4:pos+4+length]
        blocks.append({'fileOffset':pos+4,'aramAddress':dest,'length':length})
        pos += 4+length

def tiles(data, palette, width=16):
    count = len(data)//32
    im = Image.new('RGBA', (width*8, ((count+width-1)//width)*8))
    for i in range(count):
        t = data[i*32:i*32+32]
        for y in range(8):
            for x in range(8):
                bit=7-x
                c=sum(((t[y*2+p%2+(p//2)*16]>>bit)&1)<<p for p in range(4))
                im.putpixel(((i%width)*8+x,(i//width)*8+y),palette[c])
    return im

def main():
    ap=argparse.ArgumentParser();ap.add_argument('rom',type=Path);args=ap.parse_args()
    rom=args.rom.read_bytes()
    assert len(rom)==1048576 and rom[0x7fc0:0x7fca]==b'MARIOPAINT'
    out=ROOT/'assets';out.mkdir(exist_ok=True)
    raw=out/'raw';raw.mkdir(exist_ok=True)
    ram=bytearray(65536)
    engine,pc=upload(rom,0x188000,ram)
    bank,pc=upload(rom,0x1c8000,ram)
    (raw/'composer-aram.bin').write_bytes(ram)
    manifest={'rom':{'filename':args.rom.name,'bytes':len(rom),'sha256':hashlib.sha256(rom).hexdigest(),'headerless':True,'mapping':'LoROM'},'engineUpload':engine,'composerUpload':bank,'samples':[],'instruments':[],'staffLabels':STAFF,'staffLabelsAreNotUniversalSoundingPitches':True}
    decoded=out/'decoded-samples';decoded.mkdir(exist_ok=True)
    for i in range(23):
        start,loop=struct.unpack_from('<HH',ram,0x6c00+4*i)
        end=start
        while True:
            h=ram[end];end+=9
            if h&1:break
            assert end<65536
        brr=bytes(ram[start:end]);path=raw/f'sample-{i:02x}.brr';path.write_bytes(brr)
        m={'index':i,'brr':str(path.relative_to(out)),'aramStart':start,'aramLoop':loop,'brrBytes':len(brr),'pcmFrames':len(brr)//9*16,'endLoopFlag':bool(h&2),'loopStartFrame':(loop-start)//9*16,'sha256':hashlib.sha256(brr).hexdigest()}
        m['fileOffset']=offset(0x1c8112)+start-0x7000
        assert rom[m['fileOffset']:m['fileOffset']+len(brr)]==brr
        assert len(brr)%9==0 and (loop-start)%9==0 and start<=loop<=end
        manifest['samples'].append(m)
        pcm=decode_brr(brr);save_wav(decoded/f'sample-{i:02x}.wav',pcm)
        m['decodedWav']=f'decoded-samples/sample-{i:02x}.wav'
        m['decodedSampleRate']=32000
        m['decodedRateMeaning']='Nominal 1:1 reference rate, not the instrument tuning'
    (raw/'canvas-palette.bgr555').write_bytes(rom[offset(0x02fe00):offset(0x02fe00)+512])
    palette=[]
    for c in struct.unpack_from('<256H',rom,offset(0x02fe00)):
        palette.append(tuple(((c>>shift)&31)*255//31 for shift in (0,5,10))+(255,))
    gfx=out/'graphics';gfx.mkdir(exist_ok=True)
    for addr,size in [(0x038000,0x6c00),(0x078000,0x8000),(0x04a000,0x1000),(0x04b000,0x1000),(0x0ac000,0x800)]:
        data=rom[offset(addr):offset(addr)+size];(raw/f'gfx-{addr:06x}.4bpp').write_bytes(data)
        # Diagnostic indexed tile sheets; final icons are assembled separately.
        for p in [0,7,8,9]:
            pal=palette[p*16:p*16+16].copy();pal[0]=(0,0,0,0)
            im=tiles(data,pal).resize((512,((len(data)//32+15)//16)*32),Image.Resampling.NEAREST)
            im.save(gfx/f'tiles-{addr:06x}-palette-{p}.png')
    pal=palette[128:144].copy();pal[0]=(0,0,0,0)
    data=rom[offset(0x0ac000):offset(0x0ac000)+0x800]
    sheet=tiles(data,pal)
    icons=out/'icons';icons.mkdir(exist_ok=True)
    ref=(ROOT/'source-reference/MPAINT/SPC700/Engine.asm').read_text()
    # Check all native composer tables against the pinned disassembly.
    for address,length in [(0x254c,30),(0x256a,30),(0x2588,30),(0x25a6,30),(0x25c4,195),(0x2687,30),(0x26a5,30)]:
        block=ref.split(f'DATA_{address:04X}:')[1].split(';---')[0].split('DATA_')[0]
        values=bytes(int(v,16) for line in block.splitlines() if 'db ' in line for v in re.findall(r'\$([0-9A-F]{2})',line))
        assert bytes(ram[address:address+length])==values[:length],hex(address)
    contact=Image.new('RGB',(750,270),'#171e28');draw=ImageDraw.Draw(contact)
    for i,name in enumerate(NAMES):
        x,y=(i%8)*16,(i//8)*16
        icon=sheet.crop((x,y,x+16,y+16));icon.save(icons/f'{i:02d}-{name}.png')
        icon.resize((128,128),Image.Resampling.NEAREST).save(icons/f'{i:02d}-{name}@8x.png')
        cx,cy=(i%5)*150,(i//5)*90
        contact.paste(icon.resize((48,48),Image.Resampling.NEAREST),(cx+50,cy+8),icon.resize((48,48),Image.Resampling.NEAREST))
        draw.text((cx+15,cy+64),f'{i:02d} {name}',fill='white')
        sample=ram[0x254c+i];noteoffset=ram[0x25a6+i]
        settings=list(ram[0x6e00+sample*6:0x6e00+(sample+1)*6])
        native_notes=[]
        for n in range(1,14):
            src=16 if i==12 and n>=7 else sample
            native_notes.append({'staffPosition':n,'staffLabel':STAFF[n-1],'nspcNote':ram[0x25c4+noteoffset+n-1],'sampleIndex':src,'apuCommand':((i+1)<<4)|n,'wav':f'notes/{i:02d}-{name}/{n:02d}-{STAFF[n-1]}.wav'})
        manifest['instruments'].append({'id':name,'composerIndex':i,'name':name.replace('-',' ').title(),'timbreDescription':TIMBRES[i],'icon':f'icons/{i:02d}-{name}.png','iconSource':{'snesAddress':0x0ac000,'fileOffset':offset(0x0ac000),'tileIndex':2*(i+(i&~7)),'paletteIndex':8,'size':[16,16]},'primarySampleIndex':sample,'volumeByte':ram[0x256a+i],'panByte':ram[0x2588+i],'finePitchByte':ram[0x2687+i],'maxDurationTicks':ram[0x26a5+i],'sampleSettings':{'srcn':settings[0],'adsr1':settings[1],'adsr2':settings[2],'gain':settings[3],'tuningBigEndian':settings[4]*256+settings[5]},'notes':native_notes})
    contact.save(out/'instrument-contact-sheet.png')
    (raw/'music-tool-layer1.tilemap').write_bytes(rom[offset(0x02bc00):offset(0x02c100)])
    (raw/'music-tool-layer2.tilemap').write_bytes(rom[offset(0x02c100):offset(0x02c480)])
    for i,a in enumerate([0x02f310,0x02f560,0x02f7b0]):
        (raw/f'preset-song-{i+1}.bin').write_bytes(rom[offset(a):offset(a)+0x250])
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Extracted',len(manifest['samples']),'BRR samples, 15 icons; verified native tables and reconstructed 64 KiB composer ARAM')

if __name__=='__main__':main()
