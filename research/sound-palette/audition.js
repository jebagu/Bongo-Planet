// Isolated research audition. Bongo Planet's engine and audio clock are untouched.
const groupsElement = document.querySelector('#groups');
const status = document.querySelector('#status');
const entries = [];
const cache = new Map();
const sources = new Set();
let context, master, roomInput, roomWet, generation = 0;
const phrase = [60, 67, 72, 76, 74, 67, 62, 69];
const descriptions = {
  'Mbira': 'Metal tines with a woody buzz; a close family relative of kalimba.',
  'Marimba': 'Warm wooden mallets. A natural fit for repeating patterns.',
  'Wine glass': 'A bowed, slowly blooming glass tone.',
  'Soft vibraphone': 'Gentle metallic attack and a long ringing tail.',
  'Concert harp': 'Airy acoustic plucks.',
  'Grand piano': 'A soft Kawai grand piano recording.',
  'FM piano': 'A Yamaha TX81Z electric piano recording.',
  'High bongo': 'A crisp hand drum for the upper part of a rhythm.',
  'Low bongo': 'A rounder hand drum to answer the high bongo.',
};

async function readJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return response.json();
}

function group(title, note, items) {
  const section = document.createElement('section');
  const heading = document.createElement('h2'); heading.textContent = title;
  const description = document.createElement('p'); description.className = 'group-note'; description.textContent = note;
  const grid = document.createElement('div'); grid.className = 'grid';
  for (const item of items) {
    const card = document.createElement('article'); card.className = 'card';
    const name = document.createElement('h3'); name.textContent = item.name;
    const detail = document.createElement('p'); detail.textContent = item.description;
    const actions = document.createElement('div'); actions.className = 'actions';
    const single = document.createElement('button'); single.textContent = 'One note';
    const pattern = document.createElement('button'); pattern.textContent = 'Play pattern'; pattern.className = 'primary';
    for (const [button, isPattern] of [[single, false], [pattern, true]]) {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try { await play(item, isPattern); }
        catch (error) { status.textContent = String(error.message || error); }
        finally { button.disabled = false; }
      });
    }
    const small = document.createElement('small'); small.textContent = `${item.license} · Raw recording`;
    const audio = document.createElement('audio'); audio.controls = true; audio.preload = 'none'; audio.src = item.url;
    audio.volume = Number(document.querySelector('#volume').value);
    audio.addEventListener('play', () => {
      stop(false);
      for (const other of document.querySelectorAll('audio')) if (other !== audio) { other.pause(); other.currentTime = 0; }
      status.textContent = `Raw recording: ${item.name}`;
    });
    actions.append(single, pattern); card.append(name, detail, actions, small, audio); grid.append(card);
    item.card = card; entries.push(item);
  }
  section.append(heading, description, grid); groupsElement.append(section);
}

async function enable() {
  if (!context) {
    context = new AudioContext();
    master = context.createGain(); master.gain.value = Number(document.querySelector('#volume').value);
    const protection = context.createDynamicsCompressor();
    protection.threshold.value = -3; protection.knee.value = 2; protection.ratio.value = 20;
    protection.attack.value = 0.002; protection.release.value = 0.15;
    master.connect(protection); protection.connect(context.destination);
    roomInput = context.createGain();
    const reverb = context.createConvolver();
    const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 2.2), context.sampleRate);
    let seed = 6181;
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        data[i] = (seed / 2 ** 32 * 2 - 1) * (1 - i / data.length) ** 3;
      }
    }
    reverb.buffer = impulse;
    roomWet = context.createGain(); roomWet.gain.value = document.querySelector('#room').checked ? 0.28 : 0;
    roomInput.connect(reverb); reverb.connect(roomWet); roomWet.connect(master);
  }
  await context.resume();
}

async function buffer(url) {
  if (!cache.has(url)) {
    cache.set(url, (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Sample failed: ${response.status} ${url}`);
      return context.decodeAudioData(await response.arrayBuffer());
    })());
  }
  try { return await cache.get(url); }
  catch (error) { cache.delete(url); throw error; }
}

function stop(includeRaw = true) {
  generation++;
  for (const source of sources) { try { source.stop(); } catch {} }
  sources.clear();
  for (const entry of entries) entry.card.classList.remove('playing');
  if (context && roomWet) {
    roomWet.gain.cancelScheduledValues(context.currentTime);
    roomWet.gain.setValueAtTime(0, context.currentTime);
  }
  if (includeRaw) for (const audio of document.querySelectorAll('audio')) { audio.pause(); audio.currentTime = 0; }
}

async function play(item, pattern) {
  stop();
  const request = generation;
  status.textContent = `Loading ${item.name}…`;
  await enable();
  const data = await buffer(item.url);
  if (request !== generation) return;
  item.card.classList.add('playing');
  const time = context.currentTime + 0.05;
  roomWet.gain.setValueAtTime(document.querySelector('#room').checked ? 0.28 : 0, time);
  let peak = 0;
  for (let channel = 0; channel < data.numberOfChannels; channel++) {
    for (const sample of data.getChannelData(channel)) peak = Math.max(peak, Math.abs(sample));
  }
  const notes = pattern ? phrase : [item.root ?? 60];
  for (let index = 0; index < notes.length; index++) {
    const source = context.createBufferSource(); source.buffer = data;
    const rate = item.root === null ? 1 : 2 ** ((notes[index] - item.root) / 12);
    source.playbackRate.value = rate;
    const gain = context.createGain();
    const start = time + index * 0.36;
    const duration = Math.min(data.duration / rate, pattern ? 2.5 : 5);
    const level = (pattern ? 0.38 : 0.65) / Math.max(peak, 0.05);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + Math.min(0.004, duration / 4));
    gain.gain.setValueAtTime(level, start + Math.max(0.004, duration - 0.28));
    gain.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(gain); gain.connect(master); gain.connect(roomInput);
    sources.add(source);
    source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); if (!sources.size && request === generation) item.card.classList.remove('playing'); };
    source.start(start); source.stop(start + duration);
  }
  status.textContent = `${pattern ? 'Eight-note pattern' : 'One note'}: ${item.name}`;
}

document.querySelector('#stop').addEventListener('click', () => { stop(); status.textContent = 'Stopped.'; });
document.querySelector('#volume').addEventListener('input', event => {
  const volume = Number(event.target.value);
  if (master) master.gain.setTargetAtTime(volume, context.currentTime, 0.015);
  for (const audio of document.querySelectorAll('audio')) audio.volume = volume;
});
document.querySelector('#room').addEventListener('change', event => {
  if (roomWet) roomWet.gain.setTargetAtTime(event.target.checked ? 0.28 : 0, context.currentTime, 0.02);
});
document.querySelector('#check').addEventListener('click', async event => {
  event.target.disabled = true;
  try {
    await enable();
    let count = 0;
    for (const item of entries) {
      const decoded = await buffer(item.url);
      if (!decoded.length || !decoded.duration) throw new Error(`Empty sample: ${item.name}`);
      status.textContent = `Decoded ${++count}/${entries.length} samples.`;
    }
    status.textContent = `All ${count} samples decoded successfully.`;
  } catch (error) { status.textContent = String(error.message || error); }
  finally { event.target.disabled = false; }
});

try {
  const [open, harmony, mario] = await Promise.all([readJSON('manifest.json'), readJSON('../harmony-bloom/manifest.json'), readJSON('../mario-paint/assets/manifest.json')]);
  group('01 / Freely licensed instruments', 'Nine original WAVs from Versilian Community Sample Library. CC0. Representative notes for auditioning, with the full instrument banks available upstream.',
    open.samples.map(s => ({name: s.name, url: s.path, root: s.root_midi, license: 'CC0', description: descriptions[s.name]})));
  group('02 / Inside Harmony Bloom', 'The five WAVs extracted directly from your installed app. Proprietary reference recordings; these are not open source. Dry samples, without Harmony Bloom’s native sampler settings.',
    harmony.resources.map(s => ({name: s.name, url: '../harmony-bloom/' + s.path, root: 60, license: 'Extracted personal reference', description: `Original ${s.duration_seconds.toFixed(2)}-second stereo recording. C3 filename; measured dominant tone is near middle C.`})));
  const wanted = ['mario', 'star', 'heart', 'mushroom', 'game-boy', 'yoshi'];
  group('03 / Mario Paint', 'A few favorites from the existing extraction. Nintendo-derived reference assets. Open the full Mario Paint Sound Lab below to hear every instrument.',
    mario.instruments.filter(s => wanted.includes(s.id)).map(s => {
      const note = s.notes.find(n => n.staffLabel === 'C4');
      return {name: `${s.name} · ${s.timbreDescription}`, url: '../mario-paint/assets/' + note.wav, root: 60, license: 'Extracted personal reference', description: 'Rendered with the original SPC700 pitch table and envelope. Pattern transposition is illustrative.'};
    }));
} catch (error) { status.textContent = String(error.message || error); }

window.addEventListener('pagehide', () => stop());
