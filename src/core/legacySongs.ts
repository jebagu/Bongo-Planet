/** Original melody presets; shared without importing the menu catalog. */
export const SONGS = [
  { id: 'F11', song: 'Twinkle, Twinkle, Little Star', degrees: [0,0,4,4,5,5,4], instruments: ['glass','kalimba'], bpm: 96 },
  { id: 'F12', song: 'Mary Had a Little Lamb', degrees: [2,1,0,1,2,2,2], instruments: ['piano','marimba'], bpm: 100 },
  { id: 'F13', song: 'Row, Row, Row Your Boat', degrees: [0,0,0,1,2,2,1,2,3,4], instruments: ['guitar','kalimba'], bpm: 92 },
  { id: 'F14', song: 'Frère Jacques', degrees: [0,1,2,0,0,1,2,0], instruments: ['glass','piano'], bpm: 88 },
] as const;
