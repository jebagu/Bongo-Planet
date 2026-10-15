const $ = (id) => document.getElementById(id);
const manifest = JSON.parse($('asset-manifest').textContent);
const samples = new Map(manifest.samples.map((sample) => [sample.index, sample]));
const assetUrl = (path) => new URL(`assets/${path}`, document.baseURI).href;
let instrument = manifest.instruments[0];
let slot = 5;
let context, master, analyser;
let generation = 0, played = 0, signal = 0, failed = 0, pending = 0;
const voices = new Set();
const buffers = new Map();
const loadedNotes = new Set();
const status = (text) => { $('status').textContent = text; };

function diagnostics() {
  const state = context?.state ?? 'locked';
  Object.assign($('diagnostic-results').dataset, {
    loaded: loadedNotes.size, failed, played, signal: signal.toFixed(5),
    active: voices.size, pending, audio: state,
  });
  $('diagnostic-results').textContent = `${loadedNotes.size} / 195 notes decoded · ${played} playback starts · ${signal.toFixed(4)} peak signal · ${voices.size} active voices`;
  $('audio-state').textContent = `Audio: ${state}`;
  $('audio-dot').classList.toggle('ready', state === 'running');
  $('enable').textContent = state === 'running' ? 'Audio enabled' : 'Enable audio';
}

function monitor() {
  const values = new Float32Array(analyser.fftSize);
  function frame() {
    analyser.getFloatTimeDomainData(values);
    for (const value of values) signal = Math.max(signal, Math.abs(value));
    for (const voice of voices) {
      const sounding = context.currentTime >= voice.when;
      voice.key?.classList.toggle('playing', sounding);
    }
    diagnostics();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Resume synchronously in the click handler, before fetching or decoding a WAV.
function enableAudio() {
  if (!context) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return Promise.reject(new Error('This browser does not support Web Audio.'));
    context = new Audio();
    master = context.createGain();
    master.gain.value = Number($('volume').value);
    analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    master.connect(analyser);
    analyser.connect(context.destination);
    context.onstatechange = diagnostics;
    monitor();
  }
  return context.resume().then(() => {
    diagnostics();
    if (context.state !== 'running') throw new Error('Audio is paused. Click Enable audio again.');
  });
}

function showError(error) {
  $('error').hidden = false;
  $('error').textContent = error.message;
  status('Could not play audio. See the message above.');
}

function loadBuffer(path, isNote = false) {
  if (!buffers.has(path)) {
    pending++;
    const promise = fetch(assetUrl(path)).then(async (response) => {
      if (!response.ok) throw new Error(`Missing audio file (${response.status}): ${path}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      if (!buffer.length) throw new Error(`Empty audio file: ${path}`);
      if (isNote) loadedNotes.add(path);
      return buffer;
    }).catch((error) => {
      failed++;
      buffers.delete(path);
      throw error;
    }).finally(() => { pending--; diagnostics(); });
    buffers.set(path, promise);
  }
  return buffers.get(path);
}

function stop() {
  generation++;
  for (const voice of voices) {
    voice.source.onended = null;
    voice.source.stop();
    voice.source.disconnect();
    voice.gain?.disconnect();
  }
  voices.clear();
  for (const key of $('keys').children) key.classList.remove('playing');
  diagnostics();
  status('Stopped. Ready for another note.');
}

function startVoice(buffer, when, token, options = {}) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  const voice = { source, when, key: options.key };
  if (options.sample) {
    source.playbackRate.value = options.rate;
    source.loop = options.loop;
    source.loopStart = options.sample.loopStartFrame / options.sample.decodedSampleRate;
    source.loopEnd = buffer.duration;
    voice.gain = context.createGain();
    voice.gain.gain.setValueAtTime(0, when);
    voice.gain.gain.linearRampToValueAtTime(0.6, when + 0.005);
    voice.gain.gain.setValueAtTime(0.6, when + 0.7);
    voice.gain.gain.linearRampToValueAtTime(0, when + 0.78);
    source.connect(voice.gain);
    voice.gain.connect(master);
    Object.assign($('diagnostic-results').dataset, { rate: options.rate, sample: options.sample.index, loop: options.loop });
  } else source.connect(master);
  source.onended = () => {
    voices.delete(voice);
    voice.key?.classList.remove('playing');
    source.disconnect();
    voice.gain?.disconnect();
    if (token === generation && !voices.size) status('Finished. Tap another note to listen.');
    diagnostics();
  };
  voices.add(voice);
  source.start(when);
  if (options.sample) source.stop(when + 0.79);
  played++;
  diagnostics();
}

async function playNative(all = false) {
  const ready = enableAudio();
  stop();
  const token = generation;
  const selected = instrument;
  const notes = all ? selected.notes : [selected.notes[slot - 1]];
  $('error').hidden = true;
  status(`Loading ${selected.name}…`);
  try {
    await ready;
    const decoded = await Promise.all(notes.map((note) => loadBuffer(note.wav, true)));
    if (token !== generation) return;
    let when = context.currentTime + 0.025;
    notes.forEach((note, index) => {
      startVoice(decoded[index], when, token, { key: $('keys').children[note.staffPosition - 1] });
      when += decoded[index].duration + 0.12;
    });
    status(all ? `Playing ${selected.name} · all 13 staff positions` : `Playing ${selected.name} · ${notes[0].staffLabel}`);
  } catch (error) { if (token === generation) showError(error); }
}

function selectedSample() { return samples.get(instrument.notes[slot - 1].sampleIndex); }

async function playSource() {
  const ready = enableAudio();
  stop();
  const token = generation;
  const sample = selectedSample();
  const rate = 2 ** (Number($('pitch').value) / 12);
  const loop = $('loop').checked && sample.endLoopFlag;
  $('error').hidden = true;
  status('Loading source sample…');
  try {
    await ready;
    const buffer = await loadBuffer(sample.decodedWav);
    if (token !== generation) return;
    startVoice(buffer, context.currentTime + 0.025, token, { sample, rate, loop });
    status(`Playing source #${sample.index} · ${rate.toFixed(2)}× speed · ${loop ? 'loop on' : 'one shot'}`);
  } catch (error) { if (token === generation) showError(error); }
}

let waveformRequest = 0;
async function drawWaveform(sample) {
  const request = ++waveformRequest;
  try {
    const response = await fetch(assetUrl(sample.decodedWav));
    if (!response.ok) throw new Error(`Could not load waveform: ${sample.decodedWav}`);
    const data = new DataView(await response.arrayBuffer());
    let offset = 12;
    while (offset + 8 <= data.byteLength) {
      const id = String.fromCharCode(...[0, 1, 2, 3].map((i) => data.getUint8(offset + i)));
      const size = data.getUint32(offset + 4, true);
      if (id === 'data') break;
      offset += 8 + size + (size % 2);
    }
    if (request !== waveformRequest) return;
    const start = offset + 8;
    const frames = Math.min(sample.pcmFrames, (data.byteLength - start) / 2);
    const canvas = $('waveform');
    canvas.width = Math.max(1, canvas.clientWidth) * devicePixelRatio;
    canvas.height = 75 * devicePixelRatio;
    const pen = canvas.getContext('2d');
    const { width, height } = canvas;
    if (sample.endLoopFlag) {
      pen.fillStyle = '#dce9ce';
      pen.fillRect(width * sample.loopStartFrame / frames, 0, width, height);
    }
    pen.strokeStyle = '#477345';
    pen.beginPath();
    for (let x = 0; x < width; x++) {
      let low = 0, high = 0;
      for (let frame = Math.floor(x * frames / width); frame < Math.max(1, Math.ceil((x + 1) * frames / width)); frame++) {
        const value = data.getInt16(start + Math.min(frame, frames - 1) * 2, true) / 32768;
        low = Math.min(low, value); high = Math.max(high, value);
      }
      pen.moveTo(x, height * (0.5 + low * 0.45));
      pen.lineTo(x, height * (0.5 + high * 0.45));
    }
    pen.stroke();
  } catch (error) { if (request === waveformRequest) showError(error); }
}

function selectSlot(position) {
  slot = position;
  const note = instrument.notes[slot - 1];
  for (const key of $('keys').children) key.setAttribute('aria-pressed', String(Number(key.dataset.slot) === slot));
  $('download-note').href = assetUrl(note.wav);
  $('note-detail').textContent = `${note.staffLabel} · ${Math.round(note.durationSeconds * 1000)} ms · 32 kHz mono`;
  const sample = selectedSample();
  $('sample-badge').textContent = `SOURCE #${String(sample.index).padStart(2, '0')}`;
  $('download-source').href = assetUrl(sample.decodedWav);
  $('loop').disabled = !sample.endLoopFlag;
  $('loop').checked = sample.endLoopFlag;
  $('source-detail').textContent = `Source #${sample.index} · ${sample.brrBytes} BRR bytes · ${sample.pcmFrames} decoded frames · ${sample.endLoopFlag ? `loop starts at frame ${sample.loopStartFrame}` : 'one shot; no sustain loop'}`;
  $('wave-detail').textContent = `${(sample.pcmFrames / sample.decodedSampleRate * 1000).toFixed(1)} ms at reference rate`;
  void drawWaveform(sample);
}

function chooseInstrument(selected) {
  stop();
  instrument = selected;
  for (const button of $('instruments').children) button.setAttribute('aria-pressed', String(button.dataset.instrument === selected.id));
  $('selected-icon').src = assetUrl(selected.icon);
  $('selected-icon').alt = selected.name;
  $('selected-number').textContent = `INSTRUMENT ${String(selected.composerIndex + 1).padStart(2, '0')} / 15`;
  $('selected-name').textContent = selected.name;
  $('selected-timbre').textContent = selected.timbreDescription;
  $('keys').replaceChildren(...selected.notes.map((note) => {
    const button = document.createElement('button');
    button.className = 'key';
    button.dataset.slot = note.staffPosition;
    button.setAttribute('aria-label', `Play ${selected.name} ${note.staffLabel}`);
    button.innerHTML = `<span>${note.staffLabel}</span><small>${String(note.staffPosition).padStart(2, '0')}</small>`;
    button.onclick = () => { selectSlot(note.staffPosition); void playNative(); };
    return button;
  }));
  selectSlot(slot);
  status(`${selected.name} selected. Tap a note to listen.`);
}

$('instruments').replaceChildren(...manifest.instruments.map((item) => {
  const button = document.createElement('button');
  button.className = 'instrument';
  button.dataset.instrument = item.id;
  button.setAttribute('aria-label', `Select ${item.name}`);
  const image = document.createElement('img');
  image.src = assetUrl(item.icon); image.alt = ''; image.width = 40; image.height = 40;
  const name = document.createElement('span'); name.textContent = item.name;
  button.append(image, name);
  button.onclick = () => chooseInstrument(item);
  return button;
}));
$('enable').onclick = () => { void enableAudio().then(() => status('Audio enabled. Tap a note to listen.')).catch(showError); };
$('stop').onclick = stop;
$('play-scale').onclick = () => { void playNative(true); };
$('play-source').onclick = () => { void playSource(); };
$('volume').oninput = () => { if (master) master.gain.setTargetAtTime(Number($('volume').value), context.currentTime, 0.01); };
$('pitch').oninput = () => {
  const shift = Number($('pitch').value);
  $('pitch-label').textContent = `${shift > 0 ? '+' : ''}${shift} semitones · ${(2 ** (shift / 12)).toFixed(2)}×`;
};
$('check-assets').onclick = async () => {
  const button = $('check-assets');
  button.disabled = true;
  button.textContent = 'Checking audio files…';
  try {
    await enableAudio();
    const queue = manifest.instruments.flatMap((item) => item.notes);
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (queue.length) await loadBuffer(queue.shift().wav, true);
    }));
    button.textContent = '195 / 195 notes ready ✓';
    status('All 195 note files decoded successfully.');
  } catch (error) { button.textContent = 'Retry asset check'; showError(error); }
  finally { button.disabled = false; diagnostics(); }
};
window.addEventListener('pagehide', stop);
window.addEventListener('resize', () => { void drawWaveform(selectedSample()); });
chooseInstrument(instrument);
