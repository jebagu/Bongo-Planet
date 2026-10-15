import { BACKDROPS } from '../../src/view/art/swatches';
import { PLANET_FINISHES } from '../../src/view/art/planetMaterials';

export const ORIGINAL_SKY = { name: 'Star field', color: '#171c45', fill: BACKDROPS.find(sky => sky.id === 'stars').fill, stars: true };
const sky = (name, color, haze, bottom, stars = true) => ({ name, color, stars, fill: `radial-gradient(ellipse at 75% 25%, ${haze} 0%, transparent 62%), linear-gradient(145deg, ${color}, ${bottom})` });

export const FINISHES = {
  glaze: { name: 'Satin ceramic', roughness: .52, clearcoat: .08, bump: 0, texture: 'smooth', note: 'A soft ceramic sheen that echoes the shiny little instruments.' },
  satin: { name: 'Satin paint', roughness: .55, clearcoat: .08, bump: 0, texture: 'smooth', note: 'Smooth color, soft highlights and clean geometric facets.' },
  chalk: { name: 'Fine chalk', roughness: .92, clearcoat: .01, bump: .0015, texture: 'chalk', note: 'A very fine, matte grain. No terrain or large texture marks.' },
  velvet: { name: 'Powder matte', roughness: .98, clearcoat: .01, bump: .0007, texture: 'velvet', note: 'A quiet powder finish with just a trace of texture.' },
  matte: { name: 'Soft matte', roughness: .78, clearcoat: .01, bump: 0, texture: 'smooth', note: 'A calm painted surface with very little glare.' },
  clay: { ...PLANET_FINISHES.clay, texture: 'clay', note: 'Fine clay grain and gentle surface irregularities, with a soft matte finish.' },
  workedClay: { ...PLANET_FINISHES.workedClay, texture: 'workedClay', note: 'More visible clay grain, shallow thumb impressions and faint curved working marks.' },
};

export const COMBOS = [
  { id: 1, name: 'Moon glaze', planet: '#96a6bf', grid: '#52627e', opacity: .44, sky: ORIGINAL_SKY, finish: 'glaze', note: 'Cool blue-gray ceramic with a quiet ink-blue grid. A lighter moon for the candy colors.' },
  { id: 2, name: 'Moon chalk', planet: '#4e5b81', grid: '#bac5e4', opacity: .32, sky: ORIGINAL_SKY, finish: 'chalk', note: 'Dusty indigo with pale blue lines. A soft, cool base behind the bright instruments.' },
  { id: 3, name: 'Velvet orbit', planet: '#6c608d', grid: '#bcb1d5', opacity: .30, sky: ORIGINAL_SKY, finish: 'velvet', note: 'Muted violet and dusty lilac, tying the planet to the piano, marimba and star field.' },
  { id: 4, name: 'Porcelain blue', planet: '#b4c8dc', grid: '#597591', opacity: .40, sky: sky('Ink-blue stars', '#152438', '#304762', '#20304a'), finish: 'glaze', note: 'A pale, glazed blue moon against ink-blue stars, with a fine slate grid.' },
  { id: 5, name: 'Milk glass', planet: '#a3c3ca', grid: '#507580', opacity: .40, sky: sky('Deep blue stars', '#14252f', '#294855', '#1b3443'), finish: 'glaze', note: 'A cool, milky aqua moon. Apricot, yellow and rose get a gentle blue-green companion.' },
  { id: 6, name: 'Sage moon', planet: '#82a9a2', grid: '#c3d8cb', opacity: .40, sky: ORIGINAL_SKY, finish: 'matte', note: 'Muted sage and pale mint lines on the original star field. Quiet green rather than forest green.' },
  { id: 7, name: 'Seafoam ceramic', planet: '#a6c9bc', grid: '#4f746c', opacity: .42, sky: sky('Teal stars', '#122b2c', '#28524d', '#193b3b'), finish: 'glaze', note: 'Light seafoam, soft deep-teal lines and a related teal night sky.' },
  { id: 8, name: 'Periwinkle pop', planet: '#7488bc', grid: '#c2d5ed', opacity: .36, sky: ORIGINAL_SKY, finish: 'satin', note: 'A gentler periwinkle with an icy blue grid. Familiar blue, with less saturation.' },
  { id: 9, name: 'Lilac porcelain', planet: '#b4a4ce', grid: '#6f5c8d', opacity: .44, sky: ORIGINAL_SKY, finish: 'glaze', note: 'Pale lilac ceramic with plum-gray seams, framed by the original navy stars.' },
  { id: 10, name: 'Rose quartz', planet: '#b99fbc', grid: '#e3cfde', opacity: .38, sky: sky('Plum stars', '#241a30', '#4c3657', '#342440'), finish: 'satin', note: 'A muted pink-lilac world, pale rose lines and a plum sky. Warmth without brown.' },
  { id: 11, name: 'Peach moon', planet: '#cebaa9', grid: '#907b84', opacity: .46, sky: ORIGINAL_SKY, finish: 'matte', note: 'Pale peach and mauve-gray seams. A warm moon on the cool, familiar star field.' },
  { id: 12, name: 'Butter porcelain', planet: '#cbbf96', grid: '#7f7b91', opacity: .48, sky: ORIGINAL_SKY, finish: 'glaze', note: 'Soft butter cream with gray-violet seams. The navy sky holds the warmer palette together.' },
  { id: 13, name: 'Blue dusk', planet: '#849cae', grid: '#cad6e2', opacity: .40, sky: sky('Blue dusk', '#334a63', '#526d87', '#273e57', false), finish: 'satin', note: 'A slate-blue planet and a blue-hour gradient. A quieter alternative to stars.' },
  { id: 14, name: 'Lavender fog', planet: '#9b91b4', grid: '#dbd1ed', opacity: .36, sky: sky('Lavender dusk', '#3b3452', '#5b5271', '#302a45', false), finish: 'velvet', note: 'Dusty lavender and a matching twilight haze, with no stars or bright texture.' },
  { id: 15, name: 'Blue hour', planet: '#a3b2cd', grid: '#6d7d99', opacity: .48, sky: sky('Blue-hour stars', '#172a49', '#304b72', '#213359'), finish: 'matte', note: 'A pale denim moon, blue-gray lines and a slightly bluer star field.' },
  { id: 16, name: 'Cloud ceramic', planet: '#c3c6d1', grid: '#798197', opacity: .46, sky: sky('Slate stars', '#272f44', '#434d67', '#333b53'), finish: 'glaze', note: 'A cool near-neutral ceramic moon. All the colorful instruments share the same quiet stage.' },
  { id: 17, name: 'Dusty aqua', planet: '#7aa5b4', grid: '#d2e6e6', opacity: .36, sky: sky('Ocean stars', '#193c4a', '#2c5868', '#244754'), finish: 'chalk', note: 'A muted aqua surface with pale mist lines and a related ocean-blue sky.' },
  { id: 18, name: 'Lilac dusk', planet: '#8275a8', grid: '#e0d4e9', opacity: .34, sky: sky('Violet stars', '#1f2145', '#414064', '#2c2853'), finish: 'satin', note: 'A slightly brighter violet moon with warm lilac seams and a cool violet sky.' },
  { id: 19, name: 'Ink enamel', planet: '#4c617b', grid: '#9ebbd1', opacity: .42, sky: sky('Navy stars', '#10202e', '#233b50', '#192b3c'), finish: 'glaze', note: 'A dark blue that stays in the same cool color family, with a softer enamel sheen.' },
  { id: 20, name: 'Silver meadow', planet: '#a9b9b0', grid: '#667d78', opacity: .46, sky: sky('Green dusk', '#213334', '#40544c', '#293f3c', false), finish: 'matte', note: 'Silver sage, muted green seams and a calm green twilight. Soft and slightly warmer.' },
];

// Preserve the original 20 numbers and repeat the requested colors exactly.
for (const baseId of [2, 10, 18, 19]) {
  const base = COMBOS.find(combo => combo.id === baseId);
  for (const finish of ['clay', 'workedClay']) {
    COMBOS.push({ ...base, id: COMBOS.length + 1, baseId, finish,
      name: `${base.name} · ${finish === 'clay' ? 'Clay' : 'Worked clay'}`,
      note: `The same planet, grid and sky colors as option ${String(baseId).padStart(2, '0')}, with ${finish === 'clay' ? 'soft molded clay' : 'a more visibly hand-worked clay surface'}.` });
  }
}
