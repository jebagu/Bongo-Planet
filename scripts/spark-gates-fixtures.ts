import {writeFileSync,existsSync} from 'node:fs';
import {gatedExample} from '../src/core/gatedExamples';
import {exportScene} from '../src/core/history';
for(const [id,kind] of [['F15','chain'],['F16','fork'],['F17','loop']] as const){const file=`public/fixtures/${id}.json`;if(existsSync(file))throw Error(`Fixture collision: ${file}`);writeFileSync(file,exportScene(gatedExample(kind))+'\n');}
