import type { SphereView } from '../SphereView';
import { APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE, readAppearance, validateAppearance, type Appearance, type GateIcon, type SparkStyle } from './appearance';
import { GATE_ICONS, gateIconSvg } from './gateIcons';
import { BACKDROPS, SWATCHES, starPoints } from './swatches';

const colorKeys = ['planet', 'generator', 'guitar', 'glass', 'kalimba', 'piano', 'marimba'] as const;
const title = (value: string) => value[0].toUpperCase() + value.slice(1);
const sparkStyles: {id:SparkStyle;name:string;description:string}[] = [
  {id:'ember',name:'Ember',description:'Hot orange with a glowing haze'},
  {id:'white',name:'White ball',description:'A simple moving white ball'},
  {id:'lightning',name:'Lightning',description:'A little yellow bolt with an electric trail'},
];

export function mountAppearance(view: SphereView, message: (text: string) => void) {
  let appearance: Appearance = { ...DEFAULT_APPEARANCE };
  try { appearance = readAppearance(localStorage); } catch { /* Storage can be unavailable. */ }
  const controls = document.createElement('div');
  controls.className = 'appearance-toolbar';
  controls.innerHTML = '<button id="edit-look" aria-expanded="false" aria-controls="look-editor">✦ Edit look <span aria-hidden="true">⌄</span></button>';
  const host=document.querySelector('#look-controls')!;
  host.append(controls);
  const stars = document.createElement('div'); stars.className = 'star-field'; stars.setAttribute('aria-hidden', 'true');
  for (const point of starPoints()) {
    const star = document.createElement('i');
    star.style.cssText = `left:${point.x}%;top:${point.y}%;width:${point.size}px;height:${point.size}px;opacity:${point.opacity}`;
    stars.append(star);
  }
  document.body.prepend(stars);
  const tray = document.createElement('section');
  tray.id = 'look-editor'; tray.hidden=true;
  tray.setAttribute('aria-labelledby', 'look-title');
  tray.innerHTML = `<div class="look-heading"><div><h3 id="look-title">Edit look</h3><p id="look-save-status" role="status">Changes save automatically in this browser.</p></div><button id="close-look" aria-label="Close appearance tray">×</button></div>
    <section class="look-section" aria-labelledby="spark-style-title"><h3 id="spark-style-title">Spark style</h3><div class="spark-styles">${sparkStyles.map(s=>`<button data-spark-style="${s.id}" aria-label="Spark style: ${s.name}" aria-pressed="false" title="${s.description}"><span class="spark-preview spark-${s.id}" aria-hidden="true"><i>${s.id==='lightning'?gateIconSvg('bolt',true):''}</i></span><span>${s.name}</span></button>`).join('')}</div><p class="look-hint">The same spark, three different looks.</p></section>
    <section class="look-section" aria-labelledby="gate-icon-title"><h3 id="gate-icon-title">Gate icon</h3><div class="gate-icon-choices">${GATE_ICONS.map(g=>`<button data-gate-icon="${g.id}" aria-label="Gate icon: ${g.name}" aria-pressed="false"><span class="gate-icon-pair" aria-hidden="true"><span class="gate-off">${gateIconSvg(g.id,false)}</span><span class="gate-on">${gateIconSvg(g.id,true)}</span></span><span>${g.name}</span></button>`).join('')}</div><p class="look-hint">Outline is off. Solid is on. Click a gate on the planet to toggle it.</p></section>
    <section class="look-section backdrop-section" aria-labelledby="background-title"><h3 id="background-title">Background</h3><div class="backdrop-grid">${BACKDROPS.map(b => `<button data-backdrop="${b.id}" aria-pressed="false"><span class="backdrop-preview" style="background:${b.fill}">${b.id==='stars'?'✦ · ✧':''}</span>${b.name}</button>`).join('')}</div></section>
    <details class="look-color-group"><summary>Planet & instrument colors</summary><div class="look-colors">${colorKeys.map(key => `<fieldset><legend>${title(key)}<span data-color-preview="${key}"></span></legend><div class="swatch-grid">${SWATCHES.map(([name,color]) => `<button class="color-swatch" data-color-key="${key}" data-color="${color}" aria-label="${title(key)}: ${name}" aria-pressed="false" title="${name}" style="--swatch:${color}"></button>`).join('')}</div></fieldset>`).join('')}</div></details>
    <div class="look-ranges">${([['size', 'Friend size', 0.65, 1.6], ['lighting', 'Sunshine', 0.5, 2]] as const).map(([key,label,min,max]) => `<label>${label}<output data-look-output="${key}"></output><input data-look="${key}" aria-label="${label}" type="range" min="${min}" max="${max}" step="0.05"></label>`).join('')}</div>
    <details class="look-files"><summary>Look files</summary><p>Export a copy or import a look from another browser.</p><div class="look-file-actions"><button id="export-look">Export look file</button><button id="import-look">Import look file</button></div><input id="look-file" type="file" accept=".json,application/json" hidden></details>
    <div class="look-actions"><button id="reset-look">Reset to defaults</button></div>`;
  host.append(tray);
  const fields = [...tray.querySelectorAll<HTMLInputElement>('[data-look]')];
  let saveWarning = false;
  function apply(next: Appearance, persist: boolean) {
    appearance = validateAppearance(next); view.setAppearance(appearance);
    for(const button of tray.querySelectorAll<HTMLButtonElement>('[data-gate-icon]'))button.setAttribute('aria-pressed',String(button.dataset.gateIcon===appearance.switches.icon));
    for(const button of tray.querySelectorAll<HTMLButtonElement>('[data-spark-style]'))button.setAttribute('aria-pressed',String(button.dataset.sparkStyle===appearance.sparkStyle));
    for(const element of tray.querySelectorAll<HTMLElement>('.gate-off'))element.style.color=appearance.switches.offColor;
    for(const element of tray.querySelectorAll<HTMLElement>('.gate-on'))element.style.color=appearance.switches.onColor;
    document.documentElement.dataset.visualStyle = 'toys';
    document.documentElement.dataset.backdrop = appearance.backdrop;
    const backdrop = BACKDROPS.find(b => b.id === appearance.backdrop)!;
    document.documentElement.style.setProperty('--toy-sky', backdrop.fill);
    for (const key of ['planet','generator','note','beat','guitar','glass','kalimba','piano','marimba','background'] as const) document.documentElement.style.setProperty(`--toy-${key}`,appearance[key]);
    for (const button of tray.querySelectorAll<HTMLButtonElement>('[data-color-key]')) {
      const color = appearance[button.dataset.colorKey as typeof colorKeys[number]];
      button.setAttribute('aria-pressed',String(color.toLowerCase()===button.dataset.color));
    }
    for (const key of colorKeys) tray.querySelector<HTMLElement>(`[data-color-preview="${key}"]`)!.style.background=appearance[key];
    for (const button of tray.querySelectorAll<HTMLButtonElement>('[data-backdrop]')) button.setAttribute('aria-pressed',String(button.dataset.backdrop===appearance.backdrop));
    for (const input of fields) {
      const value = appearance[input.dataset.look as keyof Appearance];
      input.value=String(value);
      const output = tray.querySelector<HTMLOutputElement>(`[data-look-output="${input.dataset.look}"]`);
      if (output) output.value=Number(value).toFixed(2);
    }
    if (persist) try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(appearance));
      tray.querySelector('#look-save-status')!.textContent='Saved automatically in this browser.';
      saveWarning=false;
    } catch {
      tray.querySelector('#look-save-status')!.textContent='Changes apply for this session. This browser could not save them.';
      if (!saveWarning) message('Look updated for this session. This browser could not save it.'); saveWarning=true;
    }
  }
  const editButton=controls.querySelector<HTMLButtonElement>('#edit-look')!;
  function open(show:boolean) { tray.hidden=!show; editButton.setAttribute('aria-expanded',String(show)); }
  editButton.onclick=()=>open(tray.hidden===true);
  tray.querySelector<HTMLButtonElement>('#close-look')!.onclick=()=>{open(false);editButton.focus({preventScroll:true});};
  tray.addEventListener('keydown',event=>{
    if(event.key==='Escape'){open(false);editButton.focus({preventScroll:true});event.stopPropagation();}
  });
  for (const button of tray.querySelectorAll<HTMLButtonElement>('[data-color-key]')) button.onclick=()=>apply({...appearance,[button.dataset.colorKey!]:button.dataset.color},true);
  for (const button of tray.querySelectorAll<HTMLButtonElement>('[data-backdrop]')) button.onclick=()=>{
    const backdrop=BACKDROPS.find(b=>b.id===button.dataset.backdrop)!;
    apply({...appearance,backdrop:backdrop.id,background:backdrop.color},true);
  };
  for (const input of fields) input.oninput=()=>apply({...appearance,[input.dataset.look!]:Number(input.value)},true);
  tray.querySelector<HTMLButtonElement>('#reset-look')!.onclick=()=>apply({...DEFAULT_APPEARANCE},true);
  for(const button of tray.querySelectorAll<HTMLButtonElement>('[data-gate-icon]'))button.onclick=()=>apply({...appearance,switches:{...appearance.switches,icon:button.dataset.gateIcon as GateIcon}},true);
  for(const button of tray.querySelectorAll<HTMLButtonElement>('[data-spark-style]'))button.onclick=()=>apply({...appearance,sparkStyle:button.dataset.sparkStyle as SparkStyle},true);
  tray.querySelector<HTMLButtonElement>('#export-look')!.onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(appearance,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='Bongo-Planet-Look.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const fileInput=tray.querySelector<HTMLInputElement>('#look-file')!;
  tray.querySelector<HTMLButtonElement>('#import-look')!.onclick=()=>fileInput.click();
  fileInput.onchange=async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    try {if(file.size>8192)throw Error('Look files must be smaller than 8 KiB.');apply(validateAppearance(JSON.parse(await file.text())),true);message('Your look is ready.');}
    catch(error){message(`Could not load look. Your current look is intact. ${String(error)}`);}fileInput.value='';
  };
  apply(appearance,false);
  return {get:()=>structuredClone(appearance),set:(value:unknown)=>apply(validateAppearance(value),true)};
}
