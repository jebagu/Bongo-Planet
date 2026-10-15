import type { SphereView } from '../SphereView';
import { APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE,DEFAULT_SWITCH_LOOK, readAppearance, validateAppearance, type Appearance,type SwitchLook } from './appearance';
import {renderGatePreviews} from '../SparkGateRenderer';
import { BACKDROPS, SWATCHES, starPoints } from './swatches';

const colorKeys = ['planet', 'generator', 'guitar', 'glass', 'kalimba', 'piano', 'marimba'] as const;
const title = (value: string) => value[0].toUpperCase() + value.slice(1);

export function mountAppearance(view: SphereView, message: (text: string) => void) {
  let appearance: Appearance = { ...DEFAULT_APPEARANCE };
  try { appearance = readAppearance(localStorage); } catch { /* Storage can be unavailable. */ }
  const controls = document.createElement('div');
  controls.className = 'appearance-toolbar';
  controls.innerHTML = '<button id="edit-look">✦ Edit look</button>';
  document.querySelector('#look-controls')!.append(controls);
  const stars = document.createElement('div'); stars.className = 'star-field'; stars.setAttribute('aria-hidden', 'true');
  for (const point of starPoints()) {
    const star = document.createElement('i');
    star.style.cssText = `left:${point.x}%;top:${point.y}%;width:${point.size}px;height:${point.size}px;opacity:${point.opacity}`;
    stars.append(star);
  }
  document.body.prepend(stars);
  const dialog = document.createElement('dialog');
  dialog.id = 'look-editor'; dialog.setAttribute('aria-labelledby', 'look-title');
  dialog.innerHTML = `<div class="look-heading"><div><h2 id="look-title">Edit look</h2><p id="look-save-status" role="status">Changes save automatically in this browser.</p></div><button id="close-look" aria-label="Close appearance editor">×</button></div>
    <section class="backdrop-section" aria-labelledby="background-title"><h3 id="background-title">Background</h3><div class="backdrop-grid">${BACKDROPS.map(b => `<button data-backdrop="${b.id}" aria-pressed="false"><span class="backdrop-preview" style="background:${b.fill}">${b.id==='stars'?'✦ · ✧':''}</span>${b.name}</button>`).join('')}</div></section>
    <div class="look-colors">${colorKeys.map(key => `<fieldset><legend>${title(key)}<span data-color-preview="${key}"></span></legend><div class="swatch-grid">${SWATCHES.map(([name,color]) => `<button class="color-swatch" data-color-key="${key}" data-color="${color}" aria-label="${title(key)}: ${name}" aria-pressed="false" title="${name}" style="--swatch:${color}"></button>`).join('')}</div></fieldset>`).join('')}</div>
    <div class="look-ranges">${([['glow', 'Spark glow', 0, 2], ['size', 'Friend size', 0.65, 1.6], ['lighting', 'Sunshine', 0.5, 2]] as const).map(([key,label,min,max]) => `<label>${label}<output data-look-output="${key}"></output><input data-look="${key}" aria-label="${label}" type="range" min="${min}" max="${max}" step="0.05"></label>`).join('')}</div>
    <section class="switch-look"><h3>Spark switches</h3><div class="switch-styles">${['ink','toy','glow'].map(style=>`<button data-switch-style="${style}" aria-pressed="false"><img alt="${title(style)} switches, On and Off">${title(style)}</button>`).join('')}</div><div class="switch-look-ranges">${[['size','Switch size',.7,1.6],['stroke','Switch stroke',.65,1.6],['glow','Switch glow',0,1]].map(([key,label,min,max])=>`<label>${label}<input type="range" data-switch-look="${key}" aria-label="${label}" min="${min}" max="${max}" step=".05"></label>`).join('')}<label>On color<input type="color" data-switch-look="onColor" aria-label="Switch On color"></label><label>Off color<input type="color" data-switch-look="offColor" aria-label="Switch Off color"></label><label><input type="checkbox" data-switch-look="animation" aria-label="Switch animation"> Animation</label></div><div class="switch-swatches">${(['onColor','offColor'] as const).map(key=>`<fieldset><legend>${key==='onColor'?'On':'Off'}</legend>${SWATCHES.map(([name,color])=>`<button class="color-swatch" data-switch-color-key="${key}" data-color="${color}" aria-label="Switch ${key==='onColor'?'On':'Off'}: ${name}" style="--swatch:${color}"></button>`).join('')}</fieldset>`).join('')}</div><button id="reset-switch-look">Reset switches look</button></section>
    <details class="look-files"><summary>Look files</summary><p>Export a copy or import a look from another browser.</p><div class="look-file-actions"><button id="export-look">Export look file</button><button id="import-look">Import look file</button></div><input id="look-file" type="file" accept=".json,application/json" hidden></details>
    <div class="look-actions"><button id="reset-look">Reset to defaults</button><button id="done-look">Done</button></div>`;
  document.body.append(dialog);
  const fields = [...dialog.querySelectorAll<HTMLInputElement>('[data-look]')];
  let saveWarning = false;
  let previewSignature='';
  function apply(next: Appearance, persist: boolean) {
    appearance = validateAppearance(next); view.setAppearance(appearance);
    for(const input of dialog.querySelectorAll<HTMLInputElement>('[data-switch-look]')){const value=appearance.switches[input.dataset.switchLook as keyof SwitchLook];if(input.type==='checkbox')input.checked=Boolean(value);else input.value=String(value);}
    for(const button of dialog.querySelectorAll<HTMLButtonElement>('[data-switch-style]'))button.setAttribute('aria-pressed',String(button.dataset.switchStyle===appearance.switches.style));
    const signature=JSON.stringify({...appearance.switches,style:undefined});if(signature!==previewSignature){previewSignature=signature;try{const previews=renderGatePreviews(appearance.switches);for(const button of dialog.querySelectorAll<HTMLButtonElement>('[data-switch-style]'))button.querySelector('img')!.src=previews[button.dataset.switchStyle as SwitchLook['style']];}catch{message('Switch preview unavailable. The styles remain available on your planet.');}}
    document.documentElement.dataset.visualStyle = 'toys';
    document.documentElement.dataset.backdrop = appearance.backdrop;
    const backdrop = BACKDROPS.find(b => b.id === appearance.backdrop)!;
    document.documentElement.style.setProperty('--toy-sky', backdrop.fill);
    for (const key of ['planet','generator','note','beat','guitar','glass','kalimba','piano','marimba','background'] as const) document.documentElement.style.setProperty(`--toy-${key}`,appearance[key]);
    for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-color-key]')) {
      const color = appearance[button.dataset.colorKey as typeof colorKeys[number]];
      button.setAttribute('aria-pressed',String(color.toLowerCase()===button.dataset.color));
    }
    for (const key of colorKeys) dialog.querySelector<HTMLElement>(`[data-color-preview="${key}"]`)!.style.background=appearance[key];
    for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-backdrop]')) button.setAttribute('aria-pressed',String(button.dataset.backdrop===appearance.backdrop));
    for (const input of fields) {
      const value = appearance[input.dataset.look as keyof Appearance];
      if (input.type==='checkbox') input.checked=Boolean(value); else input.value=String(value);
      const output = dialog.querySelector<HTMLOutputElement>(`[data-look-output="${input.dataset.look}"]`);
      if (output) output.value=Number(value).toFixed(2);
    }
    if (persist) try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(appearance));
      dialog.querySelector('#look-save-status')!.textContent='Saved automatically in this browser.';
      saveWarning=false;
    } catch {
      dialog.querySelector('#look-save-status')!.textContent='Changes apply for this session. This browser could not save them.';
      if (!saveWarning) message('Look updated for this session. This browser could not save it.'); saveWarning=true;
    }
  }
  controls.querySelector<HTMLButtonElement>('#edit-look')!.onclick=()=>dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('#close-look')!.onclick=()=>dialog.close();
  dialog.querySelector<HTMLButtonElement>('#done-look')!.onclick=()=>dialog.close();
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-color-key]')) button.onclick=()=>apply({...appearance,[button.dataset.colorKey!]:button.dataset.color},true);
  for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-backdrop]')) button.onclick=()=>{
    const backdrop=BACKDROPS.find(b=>b.id===button.dataset.backdrop)!;
    apply({...appearance,backdrop:backdrop.id,background:backdrop.color},true);
  };
  for (const input of fields) {
    input.oninput=()=>{const output=dialog.querySelector<HTMLOutputElement>(`[data-look-output="${input.dataset.look}"]`);if(output)output.value=Number(input.value).toFixed(2);};
    input.onchange=()=>apply({...appearance,[input.dataset.look!]:input.type==='checkbox'?input.checked:Number(input.value)},true);
  }
  dialog.querySelector<HTMLButtonElement>('#reset-look')!.onclick=()=>apply({...DEFAULT_APPEARANCE},true);
  for(const button of dialog.querySelectorAll<HTMLButtonElement>('[data-switch-style]'))button.onclick=()=>apply({...appearance,switches:{...appearance.switches,style:button.dataset.switchStyle as SwitchLook['style']}},true);
  for(const input of dialog.querySelectorAll<HTMLInputElement>('[data-switch-look]'))input.oninput=()=>apply({...appearance,switches:{...appearance.switches,[input.dataset.switchLook!]:input.type==='checkbox'?input.checked:input.type==='color'?input.value:Number(input.value)}},true);
  for(const button of dialog.querySelectorAll<HTMLButtonElement>('[data-switch-color-key]'))button.onclick=()=>apply({...appearance,switches:{...appearance.switches,[button.dataset.switchColorKey!]:button.dataset.color}},true);
  dialog.querySelector<HTMLButtonElement>('#reset-switch-look')!.onclick=()=>apply({...appearance,switches:{...DEFAULT_SWITCH_LOOK}},true);
  dialog.querySelector<HTMLButtonElement>('#export-look')!.onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(appearance,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='Bongo-Planet-Look.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const fileInput=dialog.querySelector<HTMLInputElement>('#look-file')!;
  dialog.querySelector<HTMLButtonElement>('#import-look')!.onclick=()=>fileInput.click();
  fileInput.onchange=async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    try {if(file.size>8192)throw Error('Look files must be smaller than 8 KiB.');apply(validateAppearance(JSON.parse(await file.text())),true);message('Your look is ready.');}
    catch(error){message(`Could not load look. Your current look is intact. ${String(error)}`);}fileInput.value='';
  };
  apply(appearance,false);
  return {get:()=>structuredClone(appearance),set:(value:unknown)=>apply(validateAppearance(value),true)};
}
