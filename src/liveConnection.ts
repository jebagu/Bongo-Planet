import { exportCompositionFile, importCompositionFile } from './compositionFile';
import { LIVE_AI_CONTROL_ENABLED } from './aiControl';
type Planet = {scene:any;look:{get():any;set(value:any):void};audio:{state:string;play():void;pause():void;enable():Promise<void>};load(scene:any):void};
type Link = {session_id:string;secret:string;code:string;code_expires:number};
type Pulse = {connected:boolean;awaiting_approval:boolean;client:string|null;code_expired:boolean;command:any};
const css = `
.ai-connect-button{width:100%;min-height:40px;border:1px solid #cbd1e5;border-radius:9px;background:#435ce7;color:#fff;font:500 12px 'DM Sans',sans-serif;padding:9px 11px;cursor:pointer;text-align:left}
.ai-connect-status{display:block;font:11px/1.6 'DM Sans',sans-serif;color:#536183;margin:5px 0 9px}
.ai-connect-dialog{width:min(560px,calc(100vw - 32px));max-height:calc(100dvh - 40px);overflow:auto;border:1px solid #dedfeb;border-radius:20px;padding:28px;background:#fffaf2;color:#24365f;font:14px/1.6 'DM Sans',sans-serif;box-shadow:0 20px 90px #101c4940}
.ai-connect-dialog::backdrop{background:#101c4980}
.ai-connect-dialog h2{font:800 28px/1.2 Manrope,sans-serif;margin:0 35px 14px 0;letter-spacing:-.7px}
.ai-connect-dialog h3{font:700 16px Manrope,sans-serif;margin:24px 0 10px}
.ai-connect-dialog p{margin:10px 0;color:#536183}
.ai-connect-dialog button,.ai-connect-dialog a.ai-action{font:500 13px 'DM Sans',sans-serif;padding:10px 14px;min-height:42px;border:1px solid #cbd1e5;border-radius:8px;background:#fff;color:#24365f;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
.ai-connect-dialog button:disabled{opacity:.55;cursor:wait}
.ai-connect-dialog .ai-close{position:absolute;right:18px;top:18px;padding:5px 10px;min-height:30px;font-size:19px}
.ai-connect-dialog .ai-primary{background:#435ce7;color:white;border-color:#435ce7}
.ai-connect-dialog .ai-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
.ai-connect-dialog code{display:block;padding:12px;background:#f0eef8;border-radius:8px;overflow-wrap:anywhere;font:12px/1.6 ui-monospace,monospace}
.ai-connect-dialog .ai-code{font-size:25px;letter-spacing:2px;text-align:center;margin:10px 0}
.ai-connect-dialog .ai-approval{padding:15px;background:#edf5ef;border:1px solid #adcbb4;border-radius:10px;margin-top:15px}
.ai-connect-dialog [hidden]{display:none!important}
.ai-connect-dialog :focus-visible,.ai-connect-button:focus-visible{outline:3px solid #435ce7;outline-offset:3px}
.ai-connect-dialog small{display:block;color:#536183;line-height:1.6}
`;
function mount(planet:Planet) {
  const container=document.querySelector('#ai-music-controls');if(!container)return;
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  container.innerHTML='<button id="connect-ai" class="ai-connect-button">Connect your AI</button><span id="ai-live-status" class="ai-connect-status" role="status">Write music from your chat window.</span><a id="ai-music" class="ai-music-link" href="/BongoPlanet/ai-music/" target="_blank" rel="noopener" aria-label="AI setup and music guide (opens in a new tab)">AI setup &amp; music guide<span aria-hidden="true">↗</span></a>';
  const dialog=document.createElement('dialog');dialog.className='ai-connect-dialog';dialog.setAttribute('aria-labelledby','ai-connect-title');
  dialog.innerHTML='<button class="ai-close" aria-label="Close AI connection">×</button><h2 id="ai-connect-title">Connect your AI<br>to write music.</h2><p>Keep this planet open and compose from ChatGPT or Claude in another tab.</p><h3>1. Add Bongo Planet to your AI</h3><p>In ChatGPT, open <strong>Plugins → + → Add custom MCP server</strong>. In Claude, open <strong>Customize → Connectors → Add custom connector</strong>. Use this server address and complete sign-in:</p><code id="ai-server-url"></code><div class="ai-actions"><button id="copy-ai-server">Copy server address</button><a class="ai-action" href="https://chatgpt.com/plugins" target="_blank" rel="noopener">Open ChatGPT ↗</a><a class="ai-action" href="https://claude.ai" target="_blank" rel="noopener">Open Claude ↗</a></div><small>Setup is needed once per AI account. Your plan or workspace may control which connectors are available.</small><h3>2. Pair this planet tab</h3><p>Enable sound and create a temporary code. Your AI can change this planet only after you approve its request here.</p><div class="ai-actions"><button id="create-ai-code" class="ai-primary">Create pairing code &amp; enable sound</button></div><div id="ai-pairing" hidden><code id="ai-pair-code" class="ai-code"></code><p id="ai-code-help">Tell your AI: “Connect to my Bongo Planet using this code.”</p><div class="ai-actions"><button id="copy-ai-invitation">Copy invitation</button><button id="disconnect-ai">Disconnect</button></div></div><div id="ai-approval" class="ai-approval" hidden><strong id="ai-approval-label"></strong><p>Allow this AI to read and change this tab’s music and look, and control playback.</p><button id="approve-ai" class="ai-primary">Allow connection</button></div><p id="ai-connection-message" role="status" aria-live="polite">Your current composition stays on the planet.</p><div class="ai-actions"><button id="enable-ai-sound">Enable sound</button><a class="ai-action" href="/BongoPlanet/ai-music/" target="_blank" rel="noopener">Setup, music guide &amp; FAQ ↗</a></div>';
  document.body.append(dialog);
  const $=<T extends HTMLElement=HTMLElement>(id:string)=>dialog.querySelector<T>('#'+id)!;
  const sidebar=document.querySelector<HTMLElement>('#ai-live-status')!;
  const message=(value:string)=>{$('ai-connection-message').textContent=value;};
  $('ai-server-url').textContent=location.origin+'/mcp';
  document.querySelector<HTMLButtonElement>('#connect-ai')!.onclick=()=>dialog.showModal();
  if(new URLSearchParams(location.search).get('connect')==='1')dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('.ai-close')!.onclick=()=>dialog.close();
  let link:Link|null=null,stopped=false,polling=false,lastAck:any=null,retry=0;
  const history:{before:string;after:string}[]=[];
  const seen=new Map<string,any>();
  const snapshot=()=>JSON.stringify(JSON.parse(exportCompositionFile(planet.scene,planet.look.get())));
  const transport=()=>({playing:planet.audio.state==='running',audio_state:planet.audio.state});
  async function api<T=Record<string,unknown>>(path:string,data:any,session=link):Promise<T> {
    const response=await fetch('/api/ai/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(session?{'X-Bongo-Session':session.secret}:{})},body:JSON.stringify({...data,...(session?{session_id:session.session_id}:{})}),signal:AbortSignal.timeout(25000)});
    const result=await response.json().catch(()=>({error:'The connection service is unavailable.'})) as T & {error?:string};
    if(!response.ok)throw Object.assign(Error(result.error||'Connection failed.'),{status:response.status});
    return result;
  }
  async function copy(value:string) {try{await navigator.clipboard.writeText(value);message('Copied. Paste it into your AI.');}catch{message('Copy is unavailable. Select the text above and copy it.');}}
  $('copy-ai-server').onclick=()=>void copy(location.origin+'/mcp');
  $('copy-ai-invitation').onclick=()=>{if(link)void copy('Connect to my Bongo Planet using code '+link.code+'. Use connect_planet, then wait while I approve in the planet tab. Read the composition guide and current composition before making changes.');};
  $('enable-ai-sound').onclick=()=>void planet.audio.enable().then(()=>message('Sound enabled. Your AI can start playback.')).catch(e=>message(String(e)));
  function showDisconnected(){sidebar.textContent='Not connected. Your music is ready to edit.';$('ai-pairing').hidden=true;$('ai-approval').hidden=true;$<HTMLButtonElement>('create-ai-code').disabled=false;$('create-ai-code').textContent='Create pairing code & enable sound';}
  $('disconnect-ai').onclick=async()=>{const previous=link;link=null;stopped=true;history.length=0;seen.clear();lastAck=null;showDisconnected();message('AI disconnected. Your composition stays on the planet.');if(previous)try{await api('disconnect',{},previous);}catch{message('This tab stopped accepting AI changes. The server session will expire automatically.');}};
  $('approve-ai').onclick=async()=>{try{await planet.audio.enable();await api('approve',{});$('ai-approval').hidden=true;message('Connected. Ask your AI to make music.');}catch(e){message(String(e));}};
  $('create-ai-code').onclick=async()=>{
    const button=$<HTMLButtonElement>('create-ai-code');button.disabled=true;
    const sound=planet.audio.enable();
    try{
      await sound;
      if(link)await api('disconnect',{});
      const created=await api<Link>('create',{composition:JSON.parse(snapshot()),transport:transport()},null);
      link=created;stopped=false;retry=0;lastAck=null;seen.clear();history.length=0;
      $('ai-pairing').hidden=false;$('ai-pair-code').textContent=(created.code.match(/.{1,4}/g)?.join(' · ') ?? created.code);
      button.textContent='Create a new pairing code';button.disabled=false;
      sidebar.textContent='Waiting for your AI to pair…';message('Code expires in 10 minutes. Share it only with your own AI.');
      void pulse();
    }catch(e){button.disabled=false;message(String(e));}
  };
  async function play() {
    if(['locked','interrupted','error'].includes(planet.audio.state))return {playing:false,audio_activation_required:true,message:'Click Enable sound in the planet tab, then ask to play.'};
    planet.audio.play();
    const deadline=Date.now()+1500;
    while(Date.now()<deadline&&planet.audio.state!=='running'&&!['error','interrupted'].includes(planet.audio.state))await new Promise(r=>setTimeout(r,40));
    if(planet.audio.state!=='running'){planet.audio.pause();return {playing:false,audio_activation_required:true,message:'Playback did not start. Click Enable sound in the planet tab.'};}
    return {playing:true};
  }
  async function execute(command:any) {
    if(seen.has(command.id))return seen.get(command.id);
    const ack:any={id:command.id,status:'rejected',result:{}};
    try{
      if(command.expires<Date.now())throw Error('Command expired.');
      if(snapshot()!==command.expected_state)throw Error('The planet was edited after the AI read it. Read the current composition and merge changes.');
      const payload=JSON.parse(command.payload);
      if(command.action==='load'){
        const loaded=importCompositionFile(JSON.stringify(payload.composition)),before=snapshot();
        try{planet.load(loaded.scene);if(loaded.appearance)planet.look.set(loaded.appearance);}catch(e){const old=importCompositionFile(before);planet.load(old.scene);if(old.appearance)planet.look.set(old.appearance);throw e;}
        history.push({before,after:snapshot()});if(history.length>30)history.shift();
        ack.result={loaded:true,...(payload.play?await play():{playing:false})};
      }else if(command.action==='play')ack.result=await play();
      else if(command.action==='pause'){planet.audio.pause();ack.result={playing:false};}
      else if(command.action==='undo'){
        const previous=history.at(-1);if(!previous)throw Error('No AI composition to undo.');
        if(snapshot()!==previous.after)throw Error('The composition was edited since the last AI change. Use the planet’s Undo control or read and revise the current composition.');
        const old=importCompositionFile(previous.before);planet.load(old.scene);if(old.appearance)planet.look.set(old.appearance);history.pop();ack.result={undone:true,playing:false};
      }else throw Error('Unknown command.');
      ack.status='applied';message(ack.result.audio_activation_required?ack.result.message:'AI change applied. Keep chatting to revise your music.');
    }catch(e){ack.result={error:String(e)};message(String(e));}
    seen.set(command.id,ack);if(seen.size>40)seen.delete(seen.keys().next().value!);return ack;
  }
  async function pulse() {
    if(polling||!link||stopped)return;polling=true;const current=link;
    try{
      const sentAck=lastAck;
      const result=await api<Pulse>('pulse',{composition:JSON.parse(snapshot()),transport:transport(),ack:sentAck,wait:true});
      if(link!==current||stopped)return;
      if(lastAck===sentAck)lastAck=null;
      retry=0;
      sidebar.textContent=result.connected?'Connected to '+result.client:result.awaiting_approval?'Your AI is waiting for approval.':'Waiting for your AI to pair…';
      $('ai-approval').hidden=!result.awaiting_approval;
      $('ai-approval-label').textContent=(result.client||'Your AI')+' wants to connect.';
      if(result.awaiting_approval&&!dialog.open)dialog.showModal();
      if(result.connected){$('ai-code-help').textContent='Connected. Ask for music, then keep chatting to revise it.';$('ai-pair-code').textContent='Connected to '+result.client;}
      if(result.code_expired&&!result.connected){$('ai-code-help').textContent='Pairing code expired. Create a new one.';sidebar.textContent='Pairing code expired.';}
      if(result.command)lastAck=await execute(result.command);
    }catch(e){
      if(link!==current||stopped)return;
      sidebar.textContent='Connection interrupted. Retrying…';retry=Math.min(retry+1,5);
      if([403,404].includes((e as any).status)){link=null;stopped=true;showDisconnected();message('Session ended. Create a new pairing code.');}
    }finally{polling=false;if(link&&!stopped){if(retry)setTimeout(()=>void pulse(),Math.min(1000*2**retry,10000));else void pulse();}}
  }
  window.addEventListener('pagehide',()=>{stopped=true;});
}
function start(){const planet=(window as any).__bongo as Planet|undefined;if(planet)mount(planet);else requestAnimationFrame(start);}
if (LIVE_AI_CONTROL_ENABLED) start();
