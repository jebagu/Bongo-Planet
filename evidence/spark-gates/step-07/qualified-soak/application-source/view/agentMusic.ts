import creationGuide from '../../Creation-Guide.md?raw';
import { AGENT_FAQ, buildAgentGuide, buildAgentPrompt, starterComposition } from '../agentGuide';

export function mountAgentMusic(message: (text: string) => void) {
  const host = document.querySelector('#ai-music-controls')!;
  host.innerHTML = `<button id="ai-music" class="panel-dropdown" aria-expanded="false" aria-controls="ai-music-guide">Write music with AI</button>
    <section id="ai-music-guide" aria-labelledby="ai-music-title" hidden>
      <div class="guide-heading"><h3 id="ai-music-title">Write music with AI</h3><button id="close-ai-music" aria-label="Close AI music guide">×</button></div>
      <p>Give an AI agent the rules of this planet. It can write your music and choose a look in one file.</p>
      <ol class="guide-steps"><li>Describe the music and look you want.</li><li>Copy the prompt into your AI agent.</li><li>Save its JSON file, choose <strong>Presets → Import</strong>, then press <strong>Play</strong>.</li></ol>
      <label class="guide-label" for="music-request">Your music & look</label>
      <textarea id="music-request" rows="4" placeholder="A playful kalimba melody with glass chords, a peach sky and white sparks…"></textarea>
      <label class="guide-label" for="agent-prompt">Prompt for your agent</label>
      <textarea id="agent-prompt" rows="8" readonly spellcheck="false"></textarea>
      <button id="copy-agent-prompt" class="guide-copy">Copy prompt</button>
      <p id="agent-copy-status" class="guide-status" role="status">Includes the file format, visual settings, musical rules and neighbor map.</p>
      <div class="guide-file-actions"><button id="download-agent-guide">Download guide</button><button id="download-agent-starter">Starter JSON</button></div>
      <p><strong>Save / Load</strong> keep your music and look in this browser. <strong>Export / Import</strong> share them together as a JSON file. Save the agent’s raw JSON with a <strong>.json</strong> extension.</p>
      <h3>FAQ for agents</h3><dl id="agent-faq"></dl>
    </section>`;
  const button = host.querySelector<HTMLButtonElement>('#ai-music')!;
  const tray = host.querySelector<HTMLElement>('#ai-music-guide')!;
  const request = host.querySelector<HTMLTextAreaElement>('#music-request')!;
  const prompt = host.querySelector<HTMLTextAreaElement>('#agent-prompt')!;
  const status = host.querySelector<HTMLElement>('#agent-copy-status')!;
  for (const item of AGENT_FAQ) {
    const question = document.createElement('dt'), answer = document.createElement('dd');
    question.textContent = item.question;
    answer.textContent = item.answer.replace('the map below', 'the map in the prompt').replace('the creation guide below', 'the creation guide in the prompt').replace('The schema below', 'The schema in the prompt');
    host.querySelector('#agent-faq')!.append(question, answer);
  }
  function open(show: boolean) { tray.hidden = !show; button.setAttribute('aria-expanded', String(show)); }
  button.onclick = () => open(tray.hidden === true);
  host.querySelector<HTMLButtonElement>('#close-ai-music')!.onclick = () => { open(false); button.focus({preventScroll:true}); };
  tray.addEventListener('keydown', event => { if (event.key === 'Escape') { open(false); button.focus({preventScroll:true}); event.stopPropagation(); } });
  request.oninput = () => { prompt.value = buildAgentPrompt(creationGuide, request.value); status.textContent = 'Prompt updated with your music and look request.'; };
  prompt.value = buildAgentPrompt(creationGuide, request.value);
  host.querySelector<HTMLButtonElement>('#copy-agent-prompt')!.onclick = async () => {
    try { await navigator.clipboard.writeText(prompt.value); status.textContent = 'Prompt copied. Paste it into your AI agent.'; }
    catch { prompt.focus(); prompt.select(); status.textContent = 'Copy was unavailable. The prompt is selected; press Ctrl+C or ⌘C to copy.'; }
  };
  function download(text: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], {type}));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  host.querySelector<HTMLButtonElement>('#download-agent-guide')!.onclick = () => download(buildAgentGuide(creationGuide), 'Bongo-Planet-Agent-Guide.md', 'text/markdown');
  host.querySelector<HTMLButtonElement>('#download-agent-starter')!.onclick = () => {
    download(JSON.stringify(starterComposition(), null, 2), 'Bongo-Planet-Starter.json', 'application/json');
    message('Starter file downloaded. Choose Import to try it, then press Play.');
  };
}
