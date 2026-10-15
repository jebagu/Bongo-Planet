export function mountAgentMusic() {
  const guide = `${import.meta.env.BASE_URL}ai-music/`;
  document.querySelector('#ai-music-controls')!.innerHTML = `<a id="ai-music" class="ai-music-link" href="${guide}" target="_blank" rel="noopener" aria-label="AI setup and music guide (opens in a new tab)">AI setup and music guide<span aria-hidden="true">↗</span></a><a id="music-faq" class="ai-music-link" href="${guide}#faq-title" target="_blank" rel="noopener" aria-label="FAQ (opens in a new tab)">FAQ<span aria-hidden="true">↗</span></a>`;
}
