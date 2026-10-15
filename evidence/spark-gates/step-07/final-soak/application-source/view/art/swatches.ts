export const SWATCHES = [
  ['Butter', '#ffd35b'], ['Apricot', '#ffb883'], ['Coral', '#ff9685'], ['Rose', '#f7aab9'],
  ['Lilac', '#c6b4f6'], ['Periwinkle', '#889cf8'], ['Planet blue', '#5262e9'], ['Sky', '#a1dff9'],
  ['Mint', '#70dec8'], ['Sage', '#b5dfaa'], ['Cream', '#fff8ed'], ['Ink', '#344362'],
] as const;

export const BACKDROPS = [
  { id: 'cream', name: 'Daydream', color: '#fff8ed', fill: 'radial-gradient(ellipse at 72% 20%, #f3e6ff 0%, transparent 55%), linear-gradient(150deg, #fff8ed, #ffe9de)' },
  { id: 'peach', name: 'Peach sky', color: '#fff0df', fill: 'radial-gradient(ellipse at 80% 15%, #fff6c9 0%, transparent 55%), linear-gradient(145deg, #fff5e6, #ffd4db)' },
  { id: 'mint', name: 'Mint meadow', color: '#eaf8ec', fill: 'radial-gradient(ellipse at 70% 20%, #d6f5ff 0%, transparent 60%), linear-gradient(145deg, #f9fbe8, #d1eee1)' },
  { id: 'lavender', name: 'Berry clouds', color: '#f1eaff', fill: 'radial-gradient(ellipse at 78% 20%, #ffe3f1 0%, transparent 55%), linear-gradient(145deg, #f6efff, #d6ddfc)' },
  { id: 'stars', name: 'Star field', color: '#171c45', fill: 'radial-gradient(ellipse at 75% 30%, #393563 0%, transparent 60%), linear-gradient(145deg, #111934, #252044)' },
] as const;
export type Backdrop = typeof BACKDROPS[number]['id'];

/** Stable, irregular points: decorative stars never affect the musical scene. */
export function starPoints() {
  let seed = 4317;
  const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  return Array.from({ length: 110 }, () => ({ x: random()*100, y: random()*100, size: 1+random()*2, opacity: 0.25+random()*0.65 }));
}
