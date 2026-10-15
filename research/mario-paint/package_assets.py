"""Regenerate the standalone preview, checksums and transferable asset archive."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT=Path(__file__).resolve().parent
archive=ROOT/'Mario-Paint-Composer-Assets.zip'
manifest=(ROOT/'assets/manifest.json').read_text()
(ROOT/'index.html').write_text((ROOT/'preview-template.html').read_text().replace('/*MANIFEST*/',manifest.strip().replace('<',r'\u003c')))
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name not in {archive.name,'SHA256SUMS','package-validation.json'})
(ROOT/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(ROOT))+'\n' for p in files))
files.append(ROOT/'SHA256SUMS')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in files:z.write(p,Path('Mario-Paint-Composer-Assets')/p.relative_to(ROOT))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    names=z.namelist()
    assert not any(n.endswith(('.sfc','.smc')) for n in names)
    assert len([n for n in names if '/assets/notes/' in n and n.endswith('.wav')])==195
    assert len([n for n in names if '/assets/stereo-notes/' in n and n.endswith('.wav')])==195
    assert len([n for n in names if n.endswith('.brr')])==23
result={'file':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'archiveEntries':len(names),'crcValidation':'pass','romIncluded':False}
(ROOT/'package-validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
