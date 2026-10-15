import type { Piece, Scene } from '../core/contracts';
import { INSTRUMENTS } from '../core/instruments';
import { soundFor } from '../core/engine';

export function fieldValue(key: string, value: number): string {
  if (key === 'travel' || key === 'phase' || key === 'level') return `${Math.round(value * 100)}%`;
  if (key === 'reach') return `${value}°`;
  return `${Number(value.toFixed(2))} s`;
}

function range(label: string, key: string, value: number, min: number, max: number, step: number) {
  return `<label class="control-field"><span class="field-heading"><span>${label}</span><output data-field-output="${key}">${fieldValue(key,value)}</output></span><input aria-label="${label}" data-field="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
}
function choice(label: string, key: string, value: string | number, options: {value:string|number;label:string}[], wide=false) {
  return `<label class="control-field ${wide?'full-field':''}"><span class="field-heading">${label}</span><select aria-label="${label}" data-field="${key}">${options.map(option=>`<option value="${option.value}" ${option.value===value?'selected':''}>${option.label}</option>`).join('')}</select></label>`;
}

export function selectedControls(piece: Piece, settings: Scene['settings']): string {
  if (piece.kind==='generator') return `<div class="node-controls">
    ${choice('Spark interval','period',piece.period,[1,2,3,4,6,8].map(value=>({value,label:`${value} ${value===1?'beat':'beats'}`})))}
    ${range('Spark travel','travel',piece.travel??settings.travel,0.25,0.75,0.01)}
    <div class="routing-field full-field"><span>Spark route</span><strong>${piece.path?'Saved song path':'Automatic branches'}</strong>${piece.path?'<button id="wander">Use automatic routes</button>':''}</div>
  </div>`;
  if (piece.kind!=='note') return '';
  const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const notes=[0,1,2,3,4,5,6].map(degree=>{
    const sound=soundFor({...piece,degree},settings);
    const midi=sound.kind==='note'?Math.round(69+12*Math.log2(sound.frequency/440)):60;
    return {value:degree,label:names[midi%12]};
  });
  return `<div class="node-controls">
    ${choice('Instrument','instrument',piece.instrument??'piano',INSTRUMENTS.map(i=>({value:i.id,label:i.name})),true)}
    ${choice('Note','degree',piece.degree,notes)}
    ${choice('Octave','octave',piece.octave,[2,3,4,5,6].map(value=>({value,label:String(value)})))}
    ${range('Note length','duration',piece.duration,0.05,8,0.05)}
    ${range('Level','level',piece.level,0,1,0.01)}
  </div>`;
}
