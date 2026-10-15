import { z } from 'zod';
import { sceneSchema, validateScene, type Scene } from './core/contracts';
import { appearanceSchema, validateAppearance, type Appearance } from './view/art/appearance';

export const COMPOSITION_FORMAT = 'bongo-planet-composition';
export const COMPOSITION_FILE_LIMIT = 128 * 1024;
// Retain the old storage key so earlier browser saves remain loadable.
export const COMPOSITION_STORAGE_KEY = 'bongo-planet-scene-v1';
export const compositionFileSchema = z.object({
  format: z.literal(COMPOSITION_FORMAT), version: z.literal(1),
  scene: sceneSchema, appearance: appearanceSchema,
}).strict();
export type LoadedComposition = {scene: Scene; appearance?: Appearance};

export function makeCompositionFile(scene: Scene, appearance: Appearance) {
  return compositionFileSchema.parse({format: COMPOSITION_FORMAT, version: 1, scene, appearance: validateAppearance(appearance)});
}

export function exportCompositionFile(scene: Scene, appearance: Appearance): string {
  const text = JSON.stringify(makeCompositionFile(scene, appearance), null, 2);
  if (new TextEncoder().encode(text).length > COMPOSITION_FILE_LIMIT) throw Error('Composition file exceeds 128 KiB.');
  return text;
}

/** Validate the entire file before the UI applies either music or appearance. */
export function importCompositionFile(text: string): LoadedComposition {
  if (new TextEncoder().encode(text).length > COMPOSITION_FILE_LIMIT) throw Error('Composition file exceeds 128 KiB.');
  const value: unknown = JSON.parse(text);
  if (value && typeof value === 'object' && 'format' in value) {
    const file = compositionFileSchema.parse(value);
    return {scene: file.scene, appearance: file.appearance};
  }
  return {scene: validateScene(value)};
}

export function saveCompositionFile(scene: Scene, appearance: Appearance, storage: Pick<Storage, 'setItem'>) {
  storage.setItem(COMPOSITION_STORAGE_KEY, exportCompositionFile(scene, appearance));
}

export function loadCompositionFile(storage: Pick<Storage, 'getItem'>): LoadedComposition {
  const raw = storage.getItem(COMPOSITION_STORAGE_KEY);
  if (!raw) throw Error('No local save yet.');
  return importCompositionFile(raw);
}
