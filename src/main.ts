import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './style.css';
import './toy-style.css';
import './panel.css';
import './theme-experiment.css';
import { isThemeExperiment } from './view/art/completeThemes';
import {emptyScene,newPiece,changeScene,movePiece,validateScene,placePiece,piecesAt,LIMITS,toggleGate,type Scene,type Piece,type EngineEvent} from './core/contracts';
import { makeGatedCopy } from './core/gatedConversion';
import {History} from './core/history';
import {exportCompositionFile,importCompositionFile,saveCompositionFile,loadCompositionFile,type LoadedComposition} from './compositionFile';
import {SphereView} from './view';
import {AudioAdapter} from './audio/AudioAdapter';
import {OutputAdapter} from './output/OutputAdapter';
import {mountAppearance} from './view/art/controls';
import { INSTRUMENTS, instrumentScene, isPercussion, stackPitch, type Instrument } from './core/instruments';
import { labelPieces } from './core/pieceLabels';
import { selectedControls,fieldValue } from './view/selectionPanel';
import { EXAMPLES, EXAMPLE_GROUPS } from './core/examples';
import { renderInstrumentIcons } from './view/art/instrumentIcons';
import {mountAgentMusic} from './view/agentMusic';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<main>
<div class="palette-card">
<aside class="palette" aria-label="Instrument controls">
  <header class="panel-brand"><a class="brand" href="./">Bongo Planet</a></header>
  <section class="panel-section piece-palette" aria-labelledby="instruments-title"><div class="section-heading"><h2 id="instruments-title" class="section-title">Instruments</h2></div><div class="pieces">
    <button class="palette-piece generator" data-kind="generator" aria-pressed="false"><span class="piece-icon" aria-hidden="true"></span><span class="piece-name">Generator</span></button>
    ${INSTRUMENTS.map(i=>`<button class="palette-piece note instrument-${i.id}" data-kind="note" data-instrument="${i.id}" aria-pressed="false"><span class="piece-icon"></span><span class="piece-name">${i.name}</span></button>`).join('')}
  </div></section>
  <section class="panel-section transport" aria-label="Playback"><button id="play" class="primary">▶ Play</button></section>
  <section class="panel-section preset-controls" aria-labelledby="presets-title">
    <div class="section-heading"><h2 id="presets-title" class="section-title">Piece selector</h2></div>
    <label class="examples"><span class="sr-only">Preset</span><select id="fixture" class="panel-dropdown" aria-label="Preset"><option value="" hidden>Your composition</option>${EXAMPLE_GROUPS.map((group,index)=>`${index?'<hr>':''}<optgroup label="${group.name}">${group.examples.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}</optgroup>`).join('')}</select></label>
  </section>
  <section class="panel-section selection-card" aria-labelledby="selection-title">
    <div class="section-heading selected-heading"><img id="selected-portrait" alt="" hidden><div class="selection-heading-text"><p class="selection-label">Selected piece</p><h2 id="selection-title" class="section-title">No piece selected</h2></div><button id="trash" class="trash" aria-label="Delete selected piece or drop a piece here" title="Delete selected piece" disabled>${trashIcon()}</button></div>
    <div id="inspector-content"><p class="selection-empty">Click a piece on the planet to see its controls.</p></div>
  </section>
  <section class="panel-section global-controls" aria-labelledby="mix-title">
    <div class="section-heading"><h2 id="mix-title" class="section-title">Mix</h2></div>
    <div class="mix-fields">
    <label class="control-field"><span class="field-heading"><span>Volume</span><output id="volume-label">65%</output></span><input id="volume" aria-label="Volume" type="range" min="0" max="1" step=".01" value=".65"></label>
    <label class="control-field"><span class="field-heading"><span>Tempo</span><output id="tempo-label">120 BPM</output></span><input id="tempo" aria-label="Tempo" type="range" min="40" max="180" step="1" value="120"></label>
    </div>
  </section>
  <section class="panel-section settings-controls" aria-labelledby="theme-title"><div class="section-heading"><h2 id="theme-title" class="section-title">Theme</h2></div><div id="look-controls"></div></section>
  <section class="panel-section project-controls" aria-labelledby="composition-title">
    <div class="section-heading"><h2 id="composition-title" class="section-title">Composition</h2></div>
    <div class="scene-actions"><button class="storage-action" id="restore" title="Load local save">Load</button><button id="save" class="storage-action">Save</button><button id="import" class="storage-action">Import</button><button id="export-scene" class="storage-action">Export</button><button id="clear" class="storage-action">Clear</button><button id="undo" class="history-action">↶ Undo</button><button id="redo" class="history-action">↷ Redo</button><input type="file" id="file" accept=".json,application/json" hidden></div>
  </section>
  <nav class="panel-section ai-music-section" aria-label="Help"><div id="ai-music-controls"></div></nav>
</aside>
</div>
<section class="stage" aria-label="Composition"><div id="sphere"></div><div class="view-controls" role="group" aria-label="Globe view"><button id="reset-view" title="Restore the starting view and zoom">Reset view</button><button id="slow-rotate" aria-pressed="false" title="Slowly rotate around the current vertical axis">Slow rotate</button></div></section>
</main><div id="notice" role="status" aria-live="polite"></div>`;
function trashIcon(){return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';}
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let toolInstrument:Instrument='piano';
let scene=emptyScene(),selected:string|null=null,tool:Piece['kind']|null=null,ready=true,counter=0;
let junction:number|null=null;
let travelGesture:{before:Scene}|null=null;
const history=new History(),audio=new AudioAdapter(),output=new OutputAdapter(()=>audio.now);let running=false,lastAudioStatus:unknown=null;
const events:EngineEvent[]=[];
let noticeTimer:ReturnType<typeof setTimeout>|undefined,stickyNotice=false;
function message(text:string,persistent=false){if(noticeTimer)clearTimeout(noticeTimer);stickyNotice=persistent;$('notice').textContent=text;$('notice').classList.add('visible');if(!persistent)noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),4500);}
let view:SphereView;
try{view=new SphereView($('sphere'),{place,select,move,message,remove,selectJunction,toggleGate:editGate,exitTool:()=>setTool(null)});view.setClock(()=>audio.audibleNow);}catch(e){$('sphere').innerHTML='<p class="error">This instrument needs WebGL 2. '+String(e)+'</p>';throw e;}
view.setTrashTarget($('trash'));
$('reset-view').onclick=()=>{view.resetView();$('slow-rotate').setAttribute('aria-pressed','false');};
$('slow-rotate').onclick=()=>{const active=!view.getDiagnostics().slowRotate;view.setSlowRotate(active);$('slow-rotate').setAttribute('aria-pressed',String(active));};
const look=mountAppearance(view,message);
const compositionStorage = isThemeExperiment(location.pathname, location.search) ? {
  getItem: (key: string) => localStorage.getItem(`theme-experiment:${key}`),
  setItem: (key: string, value: string) => localStorage.setItem(`theme-experiment:${key}`, value),
} : localStorage;
mountAgentMusic();
let iconLook='';
let portraits=new Map<string,string>();
function refreshIcons(){const appearance=look.get(),signature=JSON.stringify({...appearance,switches:undefined,sparkStyle:undefined});if(signature===iconLook)return;iconLook=signature;try{const icons=renderInstrumentIcons(appearance);portraits=icons;document.querySelectorAll<HTMLElement>('.palette-piece').forEach(b=>{b.querySelector<HTMLElement>('.piece-icon')!.style.backgroundImage=`url(${icons.get(b.dataset.instrument??'generator')})`;});updateSelectedPortrait();}catch{message('3D palette portraits could not render. Instrument names remain available.');}}
refreshIcons();
document.addEventListener('bongo-theme-change', refreshIcons);
setInterval(refreshIcons,1000);
view.setScene(scene);audio.setScene(scene,'load');output.setScene(scene,'load');
function apply(next:Scene,mode:'edit'|'load'|'clear'='edit',record=true,preserveInspector=false){next=labelPieces(instrumentScene(validateScene(next)));if(!preserveInspector)finishTravelGesture();if(mode!=='edit'){selected=null;junction=null;tool=null;view.resetInteraction();view.setJunction(null);}if(record)history.push(scene,mode);scene=next;if(mode==='clear')ready=true;if(mode!=='edit')running=false;view.setScene(scene);audio.setScene(scene,mode);output.setScene(scene,mode);if(selected&&!scene.pieces.some(p=>p.id===selected))selected=null;if(selected)junction=scene.pieces.find(p=>p.id===selected)!.vertex;refresh(preserveInspector);}
function finishTravelGesture(){const gesture=travelGesture;travelGesture=null;if(gesture&&JSON.stringify(gesture.before)!==JSON.stringify(scene)){history.push(gesture.before);refresh();}}
document.addEventListener('pointerup',finishTravelGesture,true);document.addEventListener('pointercancel',finishTravelGesture,true);window.addEventListener('blur',finishTravelGesture);document.addEventListener('keyup',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown')finishTravelGesture();},true);
async function activate(){try{await audio.enable();}catch(e){message(`Sound: ${String(e)}`);}}
function place(kind:Piece['kind'],vertex:number){try{const first=ready&&kind==='generator'&&!scene.pieces.some(p=>p.kind==='generator');const id=`${kind[0]}-${crypto.randomUUID().slice(0,8)}-${++counter}`;const piece=newPiece(kind,vertex,id);if(piece.kind==='generator'&&scene.version===1)piece.travel=scene.settings.travel;if(piece.kind==='note'){piece.instrument=toolInstrument;piece.duration=8;if(!isPercussion(piece.instrument))Object.assign(piece,stackPitch(scene,vertex));}apply(placePiece(scene,piece));select(id);if(first){ready=false;audio.play();void activate();}else void activate();}catch(e){message(String(e));}}
function move(id:string,vertex:number){try{apply(movePiece(scene,id,vertex));}catch{message(`Choose an open junction or a stack with fewer than ${LIMITS.stack} instruments. Generators need their own junction.`);}}
function select(id:string|null){selected=id;junction=id?scene.pieces.find(p=>p.id===id)?.vertex??null:null;view.setSelected(id);view.setJunction(junction);refreshInspector();}
function selectJunction(vertex:number|null){junction=vertex;selected=scene.pieces.find(p=>p.vertex===vertex)?.id??null;view.setSelected(selected);view.setJunction(vertex);refreshInspector();}
function editGate(vertex:number,exit:number){try{const legacy=scene.version===1;apply(toggleGate(legacy?makeGatedCopy(scene):scene,vertex,exit),legacy?'load':'edit');if(legacy)message('Gated copy ready. Press Play to hear it; Undo restores the original preset.');}catch(error){message(String(error));}}
function setTool(kind:Piece['kind']|null){tool=kind;view.paletteInstrument=toolInstrument;view.setTool(kind);document.querySelectorAll<HTMLButtonElement>('.palette-piece').forEach(b=>{const active=b.dataset.kind===kind&&(kind!=='note'||b.dataset.instrument===toolInstrument);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});refreshInspector();}
function remove(id:string){if(scene.pieces.some(p=>p.id===id))apply(changeScene(scene,s=>{s.pieces=s.pieces.filter(p=>p.id!==id);}));}
function updateSelectedPortrait(){const piece=scene.pieces.find(p=>p.id===selected);const portrait=$<HTMLImageElement>('selected-portrait');portrait.hidden=!piece;if(piece)portrait.src=portraits.get(piece.kind==='generator'?'generator':piece.kind==='note'?(piece.instrument??'piano'):'marimba')??'';}
function refreshInspector(){
 const piece=scene.pieces.find(p=>p.id===selected);
 $('selection-title').textContent=piece?.label??(junction!==null?'Empty junction':'No piece selected');
 const stack=piece?piecesAt(scene,piece.vertex):[];
 const layers=piece&&piece.kind!=='generator'?`<div class="stack-context"><span>${stack.length>1?'Chord':'Instrument'} · ${stack.length} / ${LIMITS.stack} layers</span><div class="stack-layers" role="group" aria-label="Chord layers">${stack.map((p,i)=>`<button type="button" data-stack-piece="${p.id}" aria-label="Select ${p.label}, layer ${i+1}" aria-pressed="${p.id===selected}" title="${p.label}"><img alt="" src="${portraits.get(p.kind==='note'?(p.instrument??'piano'):'marimba')??''}"><span>${i+1}</span></button>`).join('')}</div></div>`:'';
 $('inspector-content').innerHTML=piece?layers+selectedControls(piece,scene.settings):'<p class="selection-empty">Click a piece on the planet to see its controls.</p>';
 document.querySelectorAll<HTMLButtonElement>('[data-stack-piece]').forEach(button=>button.onclick=()=>select(button.dataset.stackPiece!));
 document.querySelector('.selection-card')!.classList.toggle('has-selection',Boolean(piece)||junction!==null);
 $<HTMLButtonElement>('trash').disabled=!piece;
 updateSelectedPortrait();
 document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-field]').forEach(el=>{
  if(el instanceof HTMLInputElement&&el.dataset.field==='travel'){el.addEventListener('pointerdown',()=>{travelGesture??={before:structuredClone(scene)};});el.addEventListener('keydown',e=>{if(e instanceof KeyboardEvent&&(e.key==='ArrowUp'||e.key==='ArrowDown'))travelGesture??={before:structuredClone(scene)};});}
  el.addEventListener('input',()=>{const output=document.querySelector<HTMLOutputElement>(`[data-field-output="${el.dataset.field}"]`);if(output)output.value=fieldValue(el.dataset.field!,Number(el.value));});
  el.addEventListener('change',()=>{const key=el.dataset.field!;const value=el instanceof HTMLInputElement&&el.type==='checkbox'?el.checked:['sound','timbre','instrument'].includes(key)?el.value:Number(el.value);
   try{if(key==='travel'&&!/^[1-9][0-9]*$/.test(el.value))throw Error('Spark travel must be a positive whole number.');const coalesce=key==='travel'&&travelGesture!==null;apply(changeScene(scene,s=>{const piece=s.pieces.find(p=>p.id===selected)!;Object.assign(piece,{[key]:value});}),'edit',!coalesce,coalesce);}catch(e){message(`Value not accepted. ${String(e)}`);finishTravelGesture();refreshInspector();}
  });
 });
 $('wander')?.addEventListener('click',()=>apply(changeScene(scene,s=>{const piece=s.pieces.find(p=>p.id===selected);if(piece?.kind==='generator')delete piece.path;})));
 document.querySelector<HTMLInputElement>('[data-infinite]')?.addEventListener('change',e=>apply(changeScene(scene,s=>{const piece=s.pieces.find(p=>p.id===selected);if(piece?.kind==='generator')piece.travel=(e.target as HTMLInputElement).checked?'infinite':8;})));
}
function refresh(preserveInspector=false){view.setSelected(selected);document.querySelectorAll<HTMLButtonElement>('.palette-piece').forEach(b=>{const active=b.dataset.kind===tool&&(tool!=='note'||b.dataset.instrument===toolInstrument);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});for(const key of ['volume','bpm'] as const){const id=key==='bpm'?'tempo':key;$(id).setAttribute('value',String(scene.settings[key]));($<HTMLInputElement|HTMLSelectElement>(id)).value=String(scene.settings[key]);}$('tempo-label').textContent=`${scene.settings.bpm} BPM`;$('volume-label').textContent=`${Math.round(scene.settings.volume*100)}%`;$<HTMLButtonElement>('undo').disabled=!history.canUndo;$<HTMLButtonElement>('redo').disabled=!history.canRedo;if(!preserveInspector)refreshInspector();}
for(const key of ['volume','bpm'] as const){const id=key==='bpm'?'tempo':key;$<HTMLInputElement|HTMLSelectElement>(id).addEventListener('change',e=>{const value=(e.target as HTMLInputElement).value;try{apply(changeScene(scene,s=>Object.assign(s.settings,{[key]:Number(value)})));}catch(err){message(String(err));}});}
document.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(b=>{b.addEventListener('pointerdown',e=>{toolInstrument=(b.dataset.instrument??'piano') as Instrument;view.paletteInstrument=toolInstrument;void activate();view.beginPaletteDrag(b.dataset.kind as Piece['kind'],e);});b.addEventListener('click',()=>{const same=b.getAttribute('aria-pressed')==='true';toolInstrument=(b.dataset.instrument??'piano') as Instrument;setTool(same?null:b.dataset.kind as Piece['kind']);});});
for(const id of ['volume','tempo'])$<HTMLInputElement>(id).oninput=()=>{$(id==='tempo'?'tempo-label':'volume-label').textContent=id==='tempo'?`${$<HTMLInputElement>(id).value} BPM`:`${Math.round(Number($<HTMLInputElement>(id).value)*100)}%`;};
$('trash').onclick=()=>{if(selected)remove(selected);};
$('play').onclick=async()=>{ready=false;const shouldPause=running&&audio.state==='running';if(shouldPause)audio.pause();else {audio.play();await activate();}};
$('undo').onclick=()=>{const prev=history.undo(scene);if(prev){apply(prev,history.restorationMode,false);ready=false;}};
$('redo').onclick=()=>{const next=history.redo(scene);if(next)apply(next,history.restorationMode,false);};
function loadComposition(file:LoadedComposition){apply(file.scene,'load');if(file.appearance)look.set(file.appearance);refreshIcons();$<HTMLSelectElement>('fixture').value='';ready=false;}
$('save').onclick=()=>{try{saveCompositionFile(scene,look.get(),compositionStorage);message('Music and look saved in this browser.');}catch(e){message(`Save failed; your current pattern is intact. ${String(e)}`);}};
$('export-scene').onclick=()=>{try{const url=URL.createObjectURL(new Blob([exportCompositionFile(scene,look.get())],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='Bongo-Planet.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){message(`Export failed. ${String(e)}`);}};
$('restore').onclick=()=>{try{loadComposition(loadCompositionFile(compositionStorage));message('Music and look loaded. Press Play to hear it.');}catch(e){message(String(e));}};
$('import').onclick=()=>$<HTMLInputElement>('file').click();$<HTMLInputElement>('file').onchange=async e=>{const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>128*1024)throw Error('File exceeds 128 KiB');loadComposition(importCompositionFile(await file.text()));message('Loaded. Press Play.');}catch(e){message(`Import failed; your current music and look are intact. ${String(e)}`);}input.value='';};
$('clear').onclick=()=>{apply(emptyScene(),'clear');ready=true;select(null);$<HTMLSelectElement>('fixture').value='';message('Empty planet is ready. Place a generator to begin.');};
$<HTMLSelectElement>('fixture').onchange=async e=>{const id=(e.target as HTMLSelectElement).value;if(!id)return;try{const preset=EXAMPLES.find(example=>example.id===id);if(!preset)throw Error('Unknown preset.');const s=validateScene(await (await fetch(`${import.meta.env.BASE_URL}fixtures/${id}.json`)).json());apply(s,'load');ready=false;select(null);message(`${preset.name} is ready. Press Play.`);}catch(e){message(String(e));}};
audio.onEvents=ev=>{try{for(const e of ev){events.push(e);view.event(e);output.event(e);}}catch(error){audio.pause();output.disconnect();message(`Playback paused: ${String(error)}`);}if(events.length>10000)events.splice(0,events.length-10000);};
audio.onStatus=status=>{lastAudioStatus=status;running=status.running&&audio.state!=='interrupted'&&audio.state!=='error';$('play').textContent=running?'Ⅱ Pause':'▶ Play';};
audio.onState=(state,detail)=>{if(state==='error'||state==='interrupted')output.disconnect();if(['interrupted','error','paused'].includes(state)){view.clearPlayback();running=false;$('play').textContent='▶ Play';}$<HTMLButtonElement>('play').disabled=state==='starting';if(state==='error'&&detail)message(detail,true);else if(stickyNotice&&['starting','ready','running','paused'].includes(state)){stickyNotice=false;$('notice').classList.remove('visible');}};
window.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select,textarea,button,summary,a'))return;if(e.code==='Space'){e.preventDefault();$('play').click();}if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();}});
Object.assign(window,{__bongo:{get scene(){return structuredClone(scene);},get events(){return events;},get status(){return lastAudioStatus;},get slots(){return view.getProjectedSlots();},get gates(){return view.getProjectedGates();},get output(){return output.diagnostics;},outputAdapter:output,view,look,edit:(s:Scene)=>apply(validateScene(s),'edit'),load:(s:Scene)=>apply(validateScene(s),'load'),audio}});
refresh();
