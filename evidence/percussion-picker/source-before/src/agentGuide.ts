import { z } from 'zod';
import { LIMITS, gatedSceneSchema } from './core/contracts';
import { topology } from './core/geometry';
import { HOP_BEATS } from './core/gated';
import { gatedExample } from './core/gatedExamples';
import { INSTRUMENTS } from './core/instruments';
import { compositionFileSchema, makeCompositionFile } from './compositionFile';
import { DEFAULT_APPEARANCE, SPARK_STYLES } from './view/art/appearance';
import { GATE_ICONS } from './view/art/gateIcons';
import { BACKDROPS, PLANET_SWATCHES } from './view/art/swatches';

export function starterComposition() {
  const scene = gatedExample('chain');
  for (const piece of scene.pieces) if (piece.kind === 'generator') piece.period = 4;
  return makeCompositionFile(scene, {...DEFAULT_APPEARANCE});
}

/** These answers also appear in the tray and the copyable agent prompt. */
export const AGENT_FAQ = [
  {question: 'Which instruments can I use?', answer: `${INSTRUMENTS.map(i => `${i.name} (${i.id})`).join(', ')}. Save instruments as kind: "note" with an instrument ID. A Generator sends sparks; it is silent.`},
  {question: 'How do sparks make music?', answer: `Each directed crossing takes ${HOP_BEATS} quarter-note beats (${60 * HOP_BEATS} / BPM seconds). Every arrival at an instrument plays it. Empty junctions and revisits take the same time. Equal-hop branches make chords; add empty junctions for rests. Read the creation guide below for phase, tempo, sustain and Infinite behavior.`},
  {question: 'How do I connect the pieces?', answer: 'Use scene.version: 2, settings.propagation: "gated", and wiring records with a vertex and exits. Each exit must be a neighbor from the map below. Gates are directed: a return needs its own exit. Missing or empty exits stop the spark. Explicit wiring is required in files; placing a Generator in the app opens its neighboring gates automatically.'},
  {question: 'What pitches and settings are supported?', answer: `Key is a chromatic offset: 0=C, 1=C♯, through 11=B. Scale is major, minor or pentatonic; degree 0 is its root. Major/minor degrees 0–6 follow their seven-note scale; pentatonic uses [0,2,4,7,9] semitones and degrees 5–6 wrap into the next octave. Octaves are 2–6. Tempo is ${LIMITS.bpmMin}–${LIMITS.bpmMax} BPM. The schema below lists every range and required field. UI controls expose Volume, Tempo, per-piece settings and looks; key and scale are set in the file.`},
  {question: 'Which visual styles can I save?', answer: `The current planet style is Geometric Toys: style "toys", surface "seams", pulseEffects "struts", with eyes and bounce on. Spark styles: ${SPARK_STYLES.map(s => `${s.name} (${s.id})`).join(', ')}. Gate icons: ${GATE_ICONS.map(g => `${g.name} (${g.id})`).join(', ')}. Backgrounds: ${BACKDROPS.map(b => `${b.name} (${b.id})`).join(', ')}. The appearance object saves these choices, hex colors, size, lighting and switch styling. Looks do not change musical timing.`},
  {question: 'How do I save and load the AI result?', answer: 'Ask the agent for one complete .json file. Save the raw JSON as Bongo-Planet.json, without Markdown fences, comments or trailing commas. Choose Presets → Import, select the file, then press Play. Import starts paused. Save/Load keep one music-and-look save in this browser; Export downloads both for sharing or backup. Look files in Edit look contain appearance only.'},
  {question: 'Why might my composition be silent?', answer: 'Press Play after Import. Enable the generator and give its vertex at least one outgoing gate. Connect adjacent exits all the way to an instrument; each missing exit stops that branch. Check generator travel reaches the note, instrument level and global volume are above zero, and the browser has enabled audio.'},
  {question: 'What are the limits and safety rules?', answer: `Use at most ${LIMITS.vertices} pieces, one per vertex, and ${LIMITS.generators} generators with unique IDs. Files must fit within 128 KiB. Prefer finite travel and restrained levels; repeated emissions into Infinite loops accumulate and can pause at capacity. Do not add camera, transport, output endpoints, credentials, samples or unknown fields. Ask the agent to describe the rhythm and verify routes before returning the file.`},
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

Appearance uses version: 1, style: "toys", surface: "seams", pulseEffects: "struts", eyes: true and bounce: true. Set planet and instrument colors as six-digit #RRGGBB values. backdrop chooses the sky; keep background equal to that sky's base color below. size controls friend size (0.65–1.6), lighting controls sunshine (0.5–2), sparkStyle controls the moving spark, and switches controls gate glyphs. switches.style accepts ink/toy/glow; switches.icon chooses the glyph; size, stroke, onColor, offColor, glow and animation customize it. note/beat colors and global glow are retained look fields; use the named instrument colors and sparkStyle for the current visible controls. Current camera projection is orthographic and is not serialized. Sustain is in seconds and sampled notes end no later than their sample; it does not stretch the hop grid.

Planet palette: ${PLANET_SWATCHES.map(([name, color]) => `${name}=${color}`).join(', ')}. These dark colors keep bright instruments, gates and sparks visible.

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

Generated from the current gated-scene and appearance validators used by Import. The schema does not express graph adjacency, unique occupancy, unique IDs or the generator-count refinement: enforce those using the instructions and map here. With repository access, importCompositionFile in src/compositionFile.ts performs those checks. Validation does not prove that the music is pleasant or audible.

\`\`\`json
${JSON.stringify(z.toJSONSchema(compositionFileSchema.extend({scene: gatedSceneSchema})), null, 2)}
\`\`\`

## Planet neighbor map

Vertex: allowed adjacent exits. Only these directed pairs are valid; repeated vertices in a journey are allowed, but pieces and wiring records must be unique per vertex.

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
