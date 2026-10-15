import { z } from 'zod';
import { GATED_GENERATOR_PERIODS, LIMITS, gatedSceneSchema } from './core/contracts';
import { topology } from './core/geometry';
import { HOP_BEATS } from './core/gated';
import { gatedExample } from './core/gatedExamples';
import { INSTRUMENTS } from './core/instruments';
import { compositionFileSchema, makeCompositionFile } from './compositionFile';
import { DEFAULT_APPEARANCE, SPARK_STYLES } from './view/art/appearance';
import { GATE_ICONS, GATE_OUTLINE } from './view/art/gateIcons';
import { BACKDROPS, PLANET_SWATCHES } from './view/art/swatches';
import { LOOK_THEMES } from './view/art/themes';
import { COMPLETE_THEMES } from './view/art/completeThemes';

export function starterComposition() {
  const scene = gatedExample('chain');
  for (const piece of scene.pieces) if (piece.kind === 'generator') piece.period = 4;
  return makeCompositionFile(scene, {...DEFAULT_APPEARANCE});
}

/** These answers also appear on the AI music page and in the copyable agent prompt. */
export const AGENT_FAQ = [
  {question: 'Can an AI help me write music?', answer: 'Yes. Describe your music and look in the prompt builder, copy the prompt to your assistant, and ask for Bongo-Planet.json. Import the file under Composition, then press Play.'},
  {question: 'Which instruments can I use?', answer: `${INSTRUMENTS.map(i => i.name).join(', ')}. Generators launch sparks silently. Percussion plays recorded hits at their natural pitch.`},
  {question: 'How do sparks make music?', answer: `Each hop takes one sixteenth note. Arriving sparks play every instrument at that junction. Stack up to ${LIMITS.stack} instruments for a chord, or use equally long branches. Empty junctions create rests.`},
  {question: 'How do I connect the pieces?', answer: 'Click arrows to open or close paths between neighboring junctions. Sparks split at forks and stop at dead ends. Enable return arrows separately to make a circuit.'},
  {question: 'What pitches and settings are supported?', answer: `Tempo runs from ${LIMITS.bpmMin} to ${LIMITS.bpmMax} BPM. Select a melodic instrument to edit its note, octave (2–6), length and level. Composition files also support any key with major, minor or pentatonic scales.`},
  {question: 'Which visual styles can I save?', answer: 'Use Theme to choose your look. Music and appearance travel together in composition files. Visual changes leave the musical timing unchanged.'},
  {question: 'How do I save and load the AI result?', answer: 'Import Bongo-Planet.json under Composition, then press Play. Save / Load keep music and look in this browser; Export / Import transfer both as a file. Export your latest version for another AI revision.'},
  {question: 'Why might my composition be silent?', answer: 'Press Play, check Volume and instrument levels, and enable the generator. Follow its arrows to an instrument and check that Spark travel is long enough to reach it.'},
  {question: 'What are the limits and safety rules?', answer: `The planet holds ${LIMITS.vertices} pieces, including up to ${LIMITS.generators} generators, with ${LIMITS.stack} instruments per junction. Generators need their own junctions. Files must fit within 128 KiB. Start with finite Spark travel; repeated Infinite loops can fill capacity and pause playback.`},
] as const;

export function buildAgentGuide(creationGuide: string): string {
  const faq = AGENT_FAQ.map(item => `### ${item.question}\n\n${item.answer}`).join('\n\n');
  const neighbors = topology.neighbors.map((exits, vertex) => `${vertex}: ${exits.join(', ')}`).join('\n');
  return `# Bongo Planet — AI composition guide

This is the current guide for agents writing music and visual settings for Bongo Planet. It is generated from the app's validators, instrument and look catalogs, topology, and Creation-Guide.md. Use this guide as the canonical file reference; Rules.md is the executable behavior contract.

## Your task

Compose the requested music as one complete, valid Bongo-Planet.json file. Include a compatible visual look. Use the current gated scene format (scene.version: 2), finite travel unless requested, and real adjacent vertices from the map below. Provide a downloadable file if you can; otherwise return the entire raw JSON in one block that the user can save. Never omit fields with ellipses. Briefly explain the rhythm, pitches, routing and look separately from the JSON. Do not claim you played or validated the result unless you actually did.

## File format

The outer object has format: "bongo-planet-composition" and version: 1. Its scene contains the music, settings, pieces and directed wiring; its appearance contains the entire look. The scene and appearance have their own versions. All fields in the current schema are required unless explicitly optional. The scene-level travel and quantization fields are saved metadata and do not change gated timing. Generator travel is a positive whole number of hops or "infinite"; period is beats and phase is a fraction of its period. Generator reach is retained metadata in gated scenes; wiring decides where sparks go. Do not add a generator path to a gated scene.

Instruments use kind: "note" and one of these IDs: ${INSTRUMENTS.map(i => `${i.name} (${i.id})`).join(', ')}. Gated generator periods are ${GATED_GENERATOR_PERIODS.join(', ')} beats. Each hop takes ${HOP_BEATS} beats (${60 * HOP_BEATS} / BPM seconds). Key is a chromatic offset (0=C through 11=B); degree 0 is the scale root. Pentatonic uses [0,2,4,7,9] semitones, with degrees 5–6 wrapping into the next octave. The schema defines the remaining ranges.

Appearance uses version: 1, style: "toys", surface: "seams", pulseEffects: "struts", eyes: true and bounce: true. Set planet and instrument colors as six-digit #RRGGBB values. The production Theme picker offers Blue Marble, Nebula and Fireflies; generator and instrument colors are retained in saved and imported looks. planetFinish accepts smooth, clay or workedClay. gridColor is a six-digit hex color or null for automatic contrast; gridOpacity is 0–1 and gridWidth is 0.5–3 CSS pixels. backdrop chooses the sky; keep background equal to that sky's base color below. size controls friend size (0.65–1.6), lighting controls sunshine (0.5–2), sparkStyle controls the moving spark, and switches controls gate glyphs. switches.style accepts ink/toy/glow; switches.icon chooses the glyph; size, stroke, onColor, offColor, glow and animation customize it. note/beat colors and global glow are retained look fields. Current camera projection is orthographic and is not serialized. Melodic sustain is in seconds and sampled notes end no later than their sample; percussion always plays its natural one-shot tail. Neither stretches the hop grid. Earlier appearance files may omit percussion colors and receive their defaults; missing planetFinish/gridColor/gridOpacity/gridWidth use smooth/null/0.85/1.6, preserving the original rendering.

Spark styles: ${SPARK_STYLES.map(s => `${s.name} (${s.id})`).join(', ')}. Gate icons: ${GATE_ICONS.map(g => `${g.name} (${g.id})`).join(', ')}. Do not add camera, transport, output endpoints, credentials, samples or unknown fields to a composition. Verify adjacency, unique IDs, stack capacity and generator exclusivity before returning the file.

Legacy planet/grid recipes remain importable outside the production picker; these partial recipes retain the other appearance fields:
${LOOK_THEMES.map(t => `- Theme ${t.id}, ${t.name}: ${JSON.stringify(t.look)}`).join('\n')}

The production Theme picker at /BongoPlanet/ offers Blue Marble plus ${COMPLETE_THEMES.map(t => t.name).join(', ')}. Blue Marble restores the captured look with Planet blue (#5262e9). Nebula keeps its colors and nighttime lighting with decoration distant-nebula: small 3D ribbon nebulae and stars with eyes far behind the globe. Its saved background focus affects only this scenery; atmosphere.backgroundBlur accepts 0–2 CSS pixels, defaults to 0, and is .6 in the Nebula preset. The musical stage stays sharp. The old clouds and little planets remain hidden. Deep Space, Sunday Picnic and Cloud Pudding are archived outside the picker. Complete themes save an optional appearance.theme object (version 1) containing materials, lights, shadows, atmosphere, sparks, motion and interface values. The serialized values govern the look, so an edited theme catalog cannot silently alter an imported file. The retained private preview at /BongoPlanet/theme-experiment/ uses separate appearance and composition saves from production. planetFinish additionally accepts paintedWood and velvet. The JSON schema below defines every optional presentation field and its bounds. Existing custom and imported looks remain intact. The Theme section contains only its heading and drop-down; composition files transfer music and appearance together. The production Blue Marble snapshot is independent of the active theme.

Complete production theme appearances (use their explicit values when composing a look):
${COMPLETE_THEMES.map(t => `- ${t.name}: ${JSON.stringify(t.look)}`).join('\n')}

Planet palette: ${PLANET_SWATCHES.map(([name, color]) => `${name}=${color}`).join(', ')}. These dark colors keep bright instruments, gates and sparks visible.

Off-state gate outlines use Whisper half pixel: ${GATE_OUTLINE.width} CSS pixels at ${Math.round(GATE_OUTLINE.opacity*100)}% opacity. switches.stroke multiplies that base width; switches.offColor retains the saved outline color. Width compensates for viewport size and orthographic zoom; the flat glyph naturally foreshortens toward the planet's edge. On-state glyphs retain their saved onColor at full opacity. This rendering treatment does not add a file field or change wiring.

Hovering a visible gate adds a soft white edge glow and a hand cursor, preserving its hollow off or filled on state. The highlight follows the click target and uses a 100 ms fade, or appears immediately with reduced motion. It is transient feedback independent of saved glow settings and adds no composition or appearance field.

Sky base colors: ${BACKDROPS.map(b => `${b.id}=${b.color}`).join(', ')}. All backdrop choices are dark.

## FAQ

${faq}

## Musical creation and behavior

${creationGuide.trim()}

## Complete starter file

This is a valid three-note chain. Adapt it to the user's request; the sample alone is not the requested composition.

\`\`\`json
${JSON.stringify(starterComposition(), null, 2)}
\`\`\`

## Exact JSON schema

Generated from the current gated-scene and appearance validators used by Import. The schema does not express graph adjacency, the four-instrument stack limit, exclusive generator vertices, unique IDs or the generator-count refinement: enforce those using the instructions and map here. With repository access, importCompositionFile in src/compositionFile.ts performs those checks. Validation does not prove that the music is pleasant or audible.

\`\`\`json
${JSON.stringify(z.toJSONSchema(compositionFileSchema.extend({scene: gatedSceneSchema})), null, 2)}
\`\`\`

## Planet neighbor map

Vertex: allowed adjacent exits. Only these directed pairs are valid; repeated vertices in a journey are allowed. Up to four instruments can share a vertex, with unique piece IDs. Generators require exclusive vertices, and wiring records must be unique per vertex.

\`\`\`text
${neighbors}
\`\`\`

## Keeping this reference current

For agents changing Bongo Planet: update Creation-Guide.md and Rules.md whenever musical behavior changes; update the instrument/look catalogs and validators whenever options change. Run npm run docs:agents to regenerate Agent-Guide.md. The app's FAQ and copied prompt use the same guide generator; npm run build regenerates the canonical document, and tests verify that the saved guide matches the current sources.
`;
}

export function buildAgentPrompt(creationGuide: string, request: string): string {
  return `Please write music for Bongo Planet.\n\nMy music and visual request:\n${request.trim() || 'Write a short, gentle melody with a complementary visual look.'}\n\nFollow the current reference below and return a complete Bongo-Planet.json file.\n\n${buildAgentGuide(creationGuide)}`;
}
