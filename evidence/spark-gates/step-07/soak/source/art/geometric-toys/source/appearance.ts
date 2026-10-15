import { BACKDROPS, type Backdrop } from './swatches';
import defaults from '../theme.json';

export type Appearance = {
  version: 1;
  style: 'classic' | 'toys';
  surface: 'seams' | 'curved';
  pulseEffects: 'struts' | 'legacy';
  guitar: string;
  glass: string;
  kalimba: string;
  piano: string;
  marimba: string;
  planet: string;
  generator: string;
  note: string;
  beat: string;
  background: string;
  backdrop: Backdrop;
  eyes: boolean;
  bounce: boolean;
  glow: number;
  size: number;
  lighting: number;
};

export const DEFAULT_APPEARANCE: Readonly<Appearance> = Object.freeze(defaults as Appearance);
export const APPEARANCE_STORAGE_KEY = 'bongo-planet-appearance-v1';

/** Separate from the composition format: art never changes musical state. */
export function validateAppearance(value: unknown): Appearance {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Expected an appearance object.');
  const input = value as Record<string, unknown>;
  if (input.version !== 1 || (input.style !== 'classic' && input.style !== 'toys')) throw Error('Unsupported appearance preset.');
  const result = { ...DEFAULT_APPEARANCE };
  result.style = 'toys'; // Earlier Original presets adopt the only supported style.
  if (input.surface !== undefined) {
    if (input.surface !== 'seams' && input.surface !== 'curved') throw Error('Invalid surface setting.');
    result.surface = 'seams';
  }
  // Version-one looks saved before strut sparks adopt the new default.
  if (input.pulseEffects !== undefined) {
    if (input.pulseEffects !== 'struts' && input.pulseEffects !== 'legacy') throw Error('Invalid pulse effects setting.');
    result.pulseEffects = 'struts';
  }
  if (input.backdrop !== undefined) {
    if (!BACKDROPS.some(b => b.id === input.backdrop)) throw Error('Invalid background setting.');
    result.backdrop = input.backdrop as Backdrop;
  }
  for (const key of ['planet', 'generator', 'note', 'beat', 'background'] as const) {
    if (typeof input[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(input[key])) throw Error(`Invalid ${key} color.`);
    result[key] = input[key];
  }
  for (const key of ['guitar', 'glass', 'kalimba', 'piano', 'marimba'] as const) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(input[key])) throw Error(`Invalid ${key} color.`);
    result[key] = input[key];
  }
  for (const key of ['eyes', 'bounce'] as const) {
    if (typeof input[key] !== 'boolean') throw Error(`Invalid ${key} setting.`);
    result[key] = input[key];
  }
  for (const [key, min, max] of [['glow', 0, 2], ['size', 0.65, 1.6], ['lighting', 0.5, 2]] as const) {
    const n = input[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw Error(`Invalid ${key} setting.`);
    result[key] = n;
  }
  return result;
}

export function readAppearance(storage: Pick<Storage, 'getItem'>): Appearance {
  try {
    const saved = storage.getItem(APPEARANCE_STORAGE_KEY);
    return saved ? validateAppearance(JSON.parse(saved)) : { ...DEFAULT_APPEARANCE };
  } catch { return { ...DEFAULT_APPEARANCE }; }
}
