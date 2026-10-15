import type { ClassicSong } from './classics';
import { TETRIS_MELODY, TETRIS_PERIOD } from './tetris';

/** Diatonic arrangements on the shared sixteenth-note grid. Tetris uses the
 * full planet; the other three retain their short opening-theme excerpts.
 * Source scores are linked per song; accompaniment is arranged for this game.
 */
export const GAME_THEMES: readonly ClassicSong[] = [
  {
    id: 'S41', title: 'Super Mario Bros. — Ground Theme', artist: 'Koji Kondo', genre: 'Video game',
    nodes: 72, bpm: 168, key: 0, scale: 'major', period: 8, meter: '4/4',
    lead: 'marimba', leadOctave: 5, bass: 'guitar', accompaniment: 'kalimba', style: 'dance', roots: [0],
    melody: [[2,2],[2,2],[null,2],[2,2],[null,2],[0,2],[2,2],[null,2],[4,4],[null,4],[-3,4],[null,4]],
    description: 'The seven-note opening fanfare on bright marimba, keeping its little silences and high-to-low G answer. Plucked bass, kalimba and a light backbeat give it a bouncy planet groove.',
    source: 'https://mariofreepianosheetmusic.wordpress.com/wp-content/uploads/2015/05/mario-sheet-music-overworld-main-theme.pdf',
  },
  {
    id: 'S42', title: 'The Legend of Zelda — Overworld', artist: 'Koji Kondo', genre: 'Video game',
    nodes: 76, bpm: 144, key: 10, scale: 'major', period: 8, meter: '4/4',
    lead: 'marimba', leadOctave: 4, bass: 'piano', accompaniment: 'glass', style: 'chamber', roots: [0],
    melody: [[0,4],[-3,7],[0,1],[0,1],[1,1],[2,1],[3,1],[4,16]],
    description: 'The main-theme leap from B-flat down to F, then the quick climb into a high F. That last note is held to close this two-bar adaptation, over piano roots, glass and soft hand percussion.',
    source: 'https://www.vgleadsheets.com/assets/sheets/C/The%20Legend%20of%20Zelda%20-%20Overworld.pdf',
  },
  {
    id: 'S43', title: 'Tetris — Type A (Korobeiniki)', artist: 'Traditional / Hirokazu Tanaka', genre: 'Video game',
    nodes: 92, bpm: 75, key: 9, scale: 'minor', period: TETRIS_PERIOD, meter: '4/4',
    lead: 'piano', leadOctave: 4, bass: 'guitar', accompaniment: 'marimba', style: 'dance', roots: [4,4,0,0],
    melody: TETRIS_MELODY,
    description: 'All 92 nodes join one 91-hop journey: the complete eight-bar main tune, a compact natural-minor bridge and a closing cadence. Piano leads, with low guitar, marimba and hand-drum answers in the held notes. The 75 BPM grid gives the main tune its familiar 150 BPM feel; the 24-beat loop lasts 19.2 seconds.',
    source: 'https://www.vgleadsheets.com/assets/sheets/C/Tetris%20-%20Korobeiniki%20%28Tetris%20Type%20A%29.pdf',
  },
  {
    id: 'S44', title: 'Final Fantasy — Prelude', artist: 'Nobuo Uematsu', genre: 'Video game',
    nodes: 72, bpm: 100, key: 0, scale: 'major', period: 8, meter: '4/4',
    lead: 'glass', leadOctave: 2, bass: 'guitar', accompaniment: 'piano', style: 'baroque', roots: [0],
    melody: [0,1,2,4,7,8,9,11,14,15,16,18,21,22,23,25,28,25,23,22,21,18,16,15,14,11,9,8,7,4,2,1].map(pitch => [pitch,1] as const),
    description: 'The signature C–D–E–G added-ninth arpeggio rises from C2 to C6 and falls back toward home. Glass takes the flowing line, with quiet piano, low guitar and a barely-there hand-drum pulse.',
    source: 'https://gametabs.net/tabs/final-fantasy-vii/prelude-10',
  },
];

export const GAME_THEME_PRESETS = GAME_THEMES.map(song => ({id: song.id, name: `${song.title} · ${song.artist}`}));
