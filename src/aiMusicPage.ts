import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './ai-music.css';
import creationGuide from '../Creation-Guide.md?raw';
import { AGENT_FAQ, buildAgentGuide, buildAgentPrompt, starterComposition } from './agentGuide';

const request = document.querySelector<HTMLTextAreaElement>('#music-request')!;
const prompt = document.querySelector<HTMLTextAreaElement>('#agent-prompt')!;
const status = document.querySelector<HTMLElement>('#agent-copy-status')!;
const downloadStatus = document.querySelector<HTMLElement>('#agent-download-status')!;

for (const item of AGENT_FAQ) {
  const detail = document.createElement('details');
  const question = document.createElement('summary');
  const answer = document.createElement('p');
  question.textContent = item.question;
  answer.textContent = item.answer;
  detail.append(question, answer);
  document.querySelector('#agent-faq')!.append(detail);
}

request.oninput = () => {
  prompt.value = buildAgentPrompt(creationGuide, request.value);
  status.textContent = 'Prompt updated with your music and look request.';
};
prompt.value = buildAgentPrompt(creationGuide, request.value);

document.querySelector<HTMLButtonElement>('#copy-agent-prompt')!.onclick = async () => {
  try {
    await navigator.clipboard.writeText(prompt.value);
    status.textContent = 'Prompt copied. Paste it into your AI agent.';
  } catch {
    prompt.focus();
    prompt.select();
    status.textContent = 'Copy was unavailable. The prompt is selected; press Ctrl+C or ⌘C to copy.';
  }
};

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelector<HTMLButtonElement>('#download-agent-guide')!.onclick = () => {
  download(buildAgentGuide(creationGuide), 'Bongo-Planet-Agent-Guide.md', 'text/markdown');
  downloadStatus.textContent = 'Guide downloaded. Share it with your AI agent.';
};
document.querySelector<HTMLButtonElement>('#download-agent-starter')!.onclick = () => {
  download(JSON.stringify(starterComposition(), null, 2), 'Bongo-Planet-Starter.json', 'application/json');
  downloadStatus.textContent = 'Starter downloaded. Choose Composition → Import, then press Play.';
};
