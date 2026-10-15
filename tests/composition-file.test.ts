import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMPOSITION_STORAGE_KEY, exportCompositionFile, importCompositionFile, loadCompositionFile, saveCompositionFile } from '../src/compositionFile';
import { AGENT_FAQ, buildAgentGuide, buildAgentPrompt, starterComposition } from '../src/agentGuide';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { Engine } from '../src/core/engine';
import { PERCUSSION_INSTRUMENTS } from '../src/core/instruments';
import { newPiece } from '../src/core/contracts';
import { labelPieces } from '../src/core/pieceLabels';
import { LOOK_THEMES, applyLookTheme, matchesLookTheme } from '../src/view/art/themes';
import { readAppearance } from '../src/view/art/appearance';

describe('portable music and look files', () => {
  it.each(LOOK_THEMES)('keeps theme $id intact through look and composition saves without recoloring instruments', theme => {
    const file = starterComposition();
    const original = { ...file.appearance, guitar: '#abcdef', kick: '#123456', lighting: 1.3, sparkStyle: 'lightning' as const };
    const appearance = applyLookTheme(original, theme);
    expect(appearance).toMatchObject({ guitar: '#abcdef', kick: '#123456', lighting: 1.3, sparkStyle: 'lightning' });
    expect(matchesLookTheme(appearance, theme)).toBe(true);
    expect(matchesLookTheme({ ...appearance, gridOpacity: .6 }, theme)).toBe(false);
    expect(readAppearance({ getItem: () => JSON.stringify(appearance) })).toEqual(appearance);
    const text = exportCompositionFile(file.scene, appearance);
    expect(importCompositionFile(text)).toEqual({ scene: file.scene, appearance });
    const values = new Map<string, string>();
    saveCompositionFile(file.scene, appearance, { setItem: (key, value) => values.set(key, value) });
    expect(loadCompositionFile({ getItem: key => values.get(key) ?? null })).toEqual({ scene: file.scene, appearance });
  });
  it('loads complete compositions saved before clay finishes and grid styling existed', () => {
    const file = starterComposition();
    const { planetFinish: _, gridColor: __, gridOpacity: ___, gridWidth: ____, ...oldAppearance } = file.appearance;
    expect(importCompositionFile(JSON.stringify({ ...file, appearance: oldAppearance }))).toEqual({ scene: file.scene, appearance: file.appearance });
  });
  it('round-trips percussion choices, labels and colors while accepting older complete looks', () => {
    const file = starterComposition();
    file.scene.pieces = PERCUSSION_INSTRUMENTS.map((instrument, index) => ({...newPiece('note', index, `drum-${index}`), instrument: instrument.id}));
    const scene = labelPieces(file.scene), appearance = {...DEFAULT_APPEARANCE, kick: '#abcdef'};
    const text = exportCompositionFile(scene, appearance);
    expect(importCompositionFile(text)).toEqual({scene, appearance});
    const older = JSON.parse(text);
    for (const instrument of PERCUSSION_INSTRUMENTS) delete older.appearance[instrument.id];
    const loaded = importCompositionFile(JSON.stringify(older));
    expect(loaded.scene).toEqual(scene);
    expect(loaded.appearance).toEqual(DEFAULT_APPEARANCE);
    expect(scene.pieces.map(piece => piece.label)).toEqual(['High bongo 1', 'Low bongo 1', 'Kick 1', 'Snare 1', 'Hi-hat 1']);
  });
  it('round-trips music, routing and every visual setting through export and browser storage', () => {
    const file = starterComposition();
    const appearance = {...file.appearance, sparkStyle: 'lightning' as const, backdrop: 'stars' as const, planet: '#aabbcc'};
    const text = exportCompositionFile(file.scene, appearance);
    expect(importCompositionFile(text)).toEqual({scene: file.scene, appearance});
    const values = new Map<string, string>();
    saveCompositionFile(file.scene, appearance, {setItem: (key, value) => values.set(key, value)});
    expect(values.get(COMPOSITION_STORAGE_KEY)).toBe(text);
    expect(loadCompositionFile({getItem: key => values.get(key) ?? null})).toEqual({scene: file.scene, appearance});
    expect(text).not.toMatch(/camera|credentials|endpoint/);
  });
  it('explains an empty browser save', () => {
    expect(() => loadCompositionFile({getItem: () => null})).toThrow('No local save');
  });
  it('rejects invalid visual settings, routes, versions and unknown fields before applying either half', () => {
    const file = starterComposition();
    const unchanged = structuredClone(file);
    const bad = [
      {...file, format: 'other'}, {...file, version: 2}, {...file, camera: {}},
      {...file, appearance: {...file.appearance, sparkStyle: 'invalid'}},
      {...file, appearance: {...file.appearance, size: 9}},
      {...file, appearance: {...file.appearance, backdrop: 'unknown'}},
      {...file, appearance: {...file.appearance, planetFinish: 'unknown'}},
      {...file, appearance: {...file.appearance, gridOpacity: 2}},
      {...file, appearance: {...file.appearance, camera: 'perspective'}},
      {...file, appearance: {...file.appearance, switches: {...file.appearance.switches, icon: 'invalid'}}},
      {...file, scene: {...file.scene, wiring: [{vertex: 44, exits: [44]}]}},
      {...file, scene: {...file.scene, pieces: [...file.scene.pieces, {...file.scene.pieces[1]}]}},
    ];
    for (const value of bad) expect(() => importCompositionFile(JSON.stringify(value))).toThrow();
    expect(file).toEqual(unchanged);
    expect(() => importCompositionFile('{bad')).toThrow();
    expect(() => importCompositionFile(' '.repeat(128 * 1024) + '{}')).toThrow('128 KiB');
    expect(() => saveCompositionFile(file.scene, DEFAULT_APPEARANCE, {setItem: () => {throw Error('Quota');}})).toThrow('Quota');
  });
  it('gives agents a starter that actually produces the documented three-note chain', () => {
    const file = starterComposition(), engine = new Engine(file.scene);
    engine.play(0);
    const events = engine.drain();
    for (let step = 0; step <= 20; step++) {
      engine.advance(step * 0.025);
      events.push(...engine.drain());
    }
    const onsets = events.filter(event => event.type === 'onset').map(event => event.trigger);
    expect(onsets.map(event => event.nodeId)).toEqual(['gate-note-0', 'gate-note-1', 'gate-note-2']);
    expect(onsets.map(event => event.onset)).toEqual([0.125, 0.25, 0.375]);
  });
});

describe('canonical agent reference', () => {
  const creationGuide = readFileSync('Creation-Guide.md', 'utf8');
  it('keeps the saved guide identical to the live prompt and FAQ source', () => {
    const guide = buildAgentGuide(creationGuide);
    expect(readFileSync('Agent-Guide.md', 'utf8')).toBe(guide);
    for (const item of AGENT_FAQ) expect(guide).toContain(item.answer);
    const jsonBlocks = [...guide.matchAll(/```json\n([\s\S]*?)\n```/g)];
    expect(jsonBlocks).toHaveLength(2);
    expect(importCompositionFile(jsonBlocks[0][1]).scene).toEqual(starterComposition().scene);
    expect(JSON.parse(jsonBlocks[1][1]).properties.appearance.properties.sparkStyle.enum).toEqual(['ember', 'white', 'lightning']);
    expect(guide).toContain(creationGuide.trim());
    expect(guide).toContain('44:');
  });
  it('includes the requested music and look without turning user text into markup or executable content', () => {
    const request = 'Glass chords, a lavender sky, and <script>do nothing</script>';
    expect(buildAgentPrompt(creationGuide, request)).toContain(request);
    expect(buildAgentPrompt(creationGuide, '')).toContain('short, gentle melody');
  });
});
