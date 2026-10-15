#!/usr/bin/env python3
"""Create a new immutable local candidate, streaming every retained artifact."""
import argparse
import datetime
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile


def digest(stream):
    return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--name', required=True)
    parser.add_argument('--dist', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    if args.dist.is_symlink() or not args.dist.is_dir():
        parser.error('Use an existing actual dist directory, not a symlink')
    args.dist = args.dist.resolve()
    if '/' in args.name or not args.name.startswith('BongoPlanet-') or not args.name.endswith('.tar.gz'):
        parser.error('Use a new BongoPlanet-*.tar.gz basename')
    archive = root / 'release' / args.name
    if archive.parent.is_symlink():
        parser.error('Refusing symlinked release directory')
    report_path = archive.with_suffix('').with_suffix('.json')
    checksum_path = archive.with_suffix('').with_suffix('.sha256')
    if any(p.exists() for p in (archive, report_path, checksum_path)):
        parser.error('Refusing to overwrite any existing candidate artifact')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    tracked = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', commit], cwd=root, text=True).splitlines()
    committed_source = {name for name in tracked if not name.startswith(('docs/', 'evidence/', 'release/'))
                        and name != 'Acceptance-Checklist.md'}
    files = {name: root / name for name in tracked}
    # These two working files contain unrelated research changes. Use their
    # committed project versions, preserving the user's working files intact.
    overrides = {name: subprocess.check_output(['git', 'show', f'{commit}:{name}'], cwd=root)
                 for name in ('AGENTS.md', 'vite.config.ts')}
    for directory in ('docs', 'evidence'):
        if (root / directory).is_symlink():
            raise ValueError('Refusing symlinked artifact directory: ' + directory)
        for p in (root / directory).rglob('*'):
            if p.is_symlink():
                raise ValueError('Refusing symlink in retained artifacts: ' + str(p))
            if p.is_file() and not {'research', '__pycache__'}.intersection(p.relative_to(root).parts):
                files[p.relative_to(root).as_posix()] = p
    for p in args.dist.rglob('*'):
        if p.is_symlink():
            raise ValueError('Refusing symlink in build: ' + str(p))
        if p.is_file() and 'research' not in p.relative_to(args.dist).parts:
            files['dist/' + p.relative_to(args.dist).as_posix()] = p
    files = {name: p for name, p in files.items()
             if not {'research', '__pycache__', 'release'}.intersection(Path(name).parts)}
    required = ['src/main.ts', 'src/output/NativeClock.ts', 'src/output/bridge.ts',
                'package-lock.json', 'public/fixtures/F09.json', 'Acceptance-Checklist.md',
                'docs/Build-Handoff.md', 'dist/index.html',
                'evidence/step-10/current-clean-unit-attempt02-results.json',
                'evidence/step-10/current-browser-attempt02-results.json',
                'evidence/step-10/audio-clock-validation/attempt-02-30-minute/root-raw-audit.json',
                'evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md']
    if not all(name in files for name in required):
        raise ValueError('Missing required candidate artifact')
    manifest = {'title': 'Bongo Planet runnable local candidate', 'sourceCommit': commit,
                'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'permanentURL': 'http://127.0.0.1:5417/BongoPlanet/',
                'milestones': 'M0–M4 OPEN; candidate packaging does not imply acceptance.',
                'excluded': 'Dependencies, Git metadata, unrelated research and original reference archive.',
                'files': {}}
    for name, p in sorted(files.items()):
        if p.is_symlink():
            raise ValueError('Refusing symlink in candidate: ' + str(p))
        base = args.dist if name.startswith('dist/') else root
        relative = p.relative_to(base)
        if any((base / parent).is_symlink() for parent in relative.parents):
            raise ValueError('Refusing symlink ancestor in candidate: ' + str(p))
        if name in overrides:
            data = overrides[name]
            size, sha = len(data), hashlib.sha256(data).hexdigest()
        else:
            size = p.stat().st_size
            with p.open('rb') as stream:
                sha = digest(stream)
        if name in committed_source:
            expected = hashlib.sha256(subprocess.check_output(['git', 'show', f'{commit}:{name}'], cwd=root)).hexdigest()
            if sha != expected:
                raise ValueError('Retained source differs from declared commit: ' + name)
        manifest['files'][name] = {'bytes': size, 'sha256': sha,
                                   'provenance': 'exact committed source' if name in committed_source else 'retained local artifact bound by this manifest'}
    binding_name = 'evidence/step-10/current-clean-binding.json'
    binding = json.loads((root / binding_name).read_text())
    if not binding['runtimeMatchesWorkingSource'] or binding['buildExitCode'] != 0:
        raise ValueError('Clean build verification is not successful')
    runtime_inputs = {name for name in files if name.startswith(('src/', 'public/'))} | {
        'index.html', 'tsconfig.json', 'vite.config.ts', 'package.json', 'package-lock.json'}
    dist_files = {name.removeprefix('dist/') for name in files if name.startswith('dist/')}
    if not dist_files or set(binding['builtAssetsSha256']) != dist_files:
        raise ValueError('Build binding does not cover the exact complete dist denominator')
    if set(binding['runtimeSourceSha256']) != runtime_inputs:
        raise ValueError('Build binding does not cover the exact production input denominator')
    for name, sha in binding['runtimeSourceSha256'].items():
        if manifest['files'][name]['sha256'] != sha:
            raise ValueError('Committed runtime differs from verified clean source: ' + name)
    for name, sha in binding['builtAssetsSha256'].items():
        if manifest['files']['dist/' + name]['sha256'] != sha:
            raise ValueError('Packaged dist differs from verified clean build: ' + name)
    manifest['buildProvenance'] = {'verification': binding_name,
                                  'verificationSha256': manifest['files'][binding_name]['sha256'],
                                  'isolatedDirectory': binding['isolatedDirectory'],
                                  'buildCommand': binding['buildCommand']}
    manifest_bytes = (json.dumps(manifest, indent=2) + '\n').encode()
    archive.parent.mkdir(exist_ok=True)
    with archive.open('xb') as destination, tarfile.open(fileobj=destination, mode='w|gz', compresslevel=1) as tar:
        for name, p in sorted(files.items()):
            entry = tarfile.TarInfo('BongoPlanet/' + name)
            entry.size = manifest['files'][name]['bytes']
            entry.mode = 0o644
            if name in overrides:
                tar.addfile(entry, io.BytesIO(overrides[name]))
            else:
                with p.open('rb') as stream:
                    tar.addfile(entry, stream)
        entry = tarfile.TarInfo('BongoPlanet/BUNDLE-MANIFEST.json')
        entry.size, entry.mode = len(manifest_bytes), 0o644
        tar.addfile(entry, io.BytesIO(manifest_bytes))
    verified = set()
    with tarfile.open(archive, 'r|gz') as tar:
        for entry in tar:
            name = entry.name.removeprefix('BongoPlanet/')
            with tar.extractfile(entry) as stream:
                sha = digest(stream)
            if name == 'BUNDLE-MANIFEST.json':
                if sha != hashlib.sha256(manifest_bytes).hexdigest():
                    raise ValueError('Embedded manifest mismatch')
            elif entry.size != manifest['files'][name]['bytes'] or sha != manifest['files'][name]['sha256']:
                raise ValueError('Archive readback mismatch: ' + name)
            verified.add(name)
    if verified != set(files) | {'BUNDLE-MANIFEST.json'}:
        raise ValueError('Archive denominator mismatch')
    with archive.open('rb') as stream:
        sha = digest(stream)
    report = {'archive': archive.name, 'archiveBytes': archive.stat().st_size, 'sha256': sha,
              'sourceCommit': commit, 'allFilesVerified': len(verified), 'milestones': manifest['milestones']}
    with report_path.open('x') as stream:
        stream.write(json.dumps(report, indent=2) + '\n')
    with checksum_path.open('x') as stream:
        stream.write(sha + '  ' + archive.name + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
