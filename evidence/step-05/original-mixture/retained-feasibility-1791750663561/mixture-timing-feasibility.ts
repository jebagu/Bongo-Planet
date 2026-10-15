import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fixtureOracle, renderOracle, onsetGroups, erasedBeforeSound } from './mixture-timing-oracle';
import type { Scene } from '../src/core/contracts';

// Retained old-candidate exploration only. Its calibration was product-derived:
// searching this lag may assess model fidelity, never absolute onset timing.
const root = path.resolve('evidence/step-05/original-mixture/retained-feasibility-' + Date.now());
fs.mkdirSync(root, {recursive: true});
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const original = 'evidence/step-05/live-output/product/';
const reportBytes = fs.readFileSync(original + 'probe-report.json');
const previous = JSON.parse(reportBytes.toString('utf8'));
const pcmBytes = fs.readFileSync(original + previous.capture);
const topologyBytes = fs.readFileSync('evidence/step-02/topology.json');
const vertices = JSON.parse(topologyBytes.toString('utf8')).vertices;
const results = [];
for (const id of ['F06', 'F08']) {
  const segment = previous.segments.find((s: any) => s.id === id && s.variant === 'original-dense-capture');
  if (!segment || !Number.isFinite(segment.anchor)) throw Error('Original unchanged dense segment unavailable');
  const scene = segment.scene as Scene, rate = previous.sampleRate;
  const voices = fixtureOracle(scene, vertices, segment.anchor, 2, rate);
  const frame = Math.round(segment.anchor * rate), samples = rate * 2;
  const predicted = renderOracle(voices, frame, samples, rate, scene.settings.volume);
  const zeroLagOffset = Math.round((segment.anchor - previous.base) * rate);
  const fits = [];
  for (let lag = 600; lag <= 700; lag++) {
    const offset = zeroLagOffset + lag;
    if (offset < 0 || (offset + samples) * 4 > pcmBytes.length) throw Error('Retained comparison window outside PCM');
    let squared = 0, maximum = 0;
    for (let i = 0; i < samples; i++) {
      const difference = predicted[i] - pcmBytes.readFloatLE((offset + i) * 4);
      squared += difference * difference; maximum = Math.max(maximum, Math.abs(difference));
    }
    fits.push({lagSamples: lag, rmse: Math.sqrt(squared / samples), maximumError: maximum});
  }
  fits.sort((a, b) => a.rmse - b.rmse);
  fs.writeFileSync(path.join(root, id + '-oracle.f32'), Buffer.from(predicted.buffer));
  results.push({fixture: id, oldCandidateAnchor: segment.anchor, actualCaptureSource: original + previous.capture,
    samples, zeroLagOffset, expectedGroups: onsetGroups(voices).length, logicalVoices: voices.length,
    erasedBeforeSound: voices.filter(v => erasedBeforeSound(v, rate)).length,
    oracleSha256: sha(Buffer.from(predicted.buffer)), bestFit: fits[0], allLagFits: fits,
    independentlyCalibrated: false, absoluteTimingQualified: false, entranceTimeIdentified: false});
}
const sourceHashes = Object.fromEntries(['scripts/mixture-timing-oracle.ts', 'scripts/mixture-timing-feasibility.ts'].map(name => {
  const bytes = fs.readFileSync(name); fs.writeFileSync(path.join(root, path.basename(name)), bytes); return [name, sha(bytes)];
}));
const report = {scope: 'Old unchanged dense PCM model-fidelity exploration; no timing or current-candidate qualification',
  createdAt: new Date().toISOString(), acceptancePassed: false, sourceHashes,
  inputHashes: {report: sha(reportBytes), pcm: sha(pcmBytes), topology: sha(topologyBytes)},
  limitations: ['Product-derived old calibration and a freely searched intercept cannot establish absolute latency.',
    'No late-insertion, missing/duplicate, entrance ambiguity or physical presentation conclusion is made.',
    'New voices erased by the64-voice rule carry no PCM onset; group/identity limits remain explicit.',
    'Two-second fidelity windows are exploratory and do not qualify the active source or full fixture.'], results};
fs.writeFileSync(path.join(root, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({directory: root, results: results.map(({allLagFits, ...result}) => result)}, null, 2));
