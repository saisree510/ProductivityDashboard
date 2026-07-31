let audioCtx = null;
let masterGain = null;
let activeNodes = [];

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopActiveNodes() {
  activeNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  activeNodes = [];
}

function createNoiseBuffer(ctx, type = 'white') {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'brown') {
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    } else {
      data[i] = white;
    }
  }
  return buffer;
}

function playTrackInternal(trackId, volume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopActiveNodes();
  masterGain.gain.setValueAtTime(Math.max(0.01, volume), ctx.currentTime);

  switch (trackId) {
    case 'RAIN': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'brown');
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      activeNodes.push(noise, filter);
      break;
    }
    case 'OCEAN': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'brown');
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.14;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 350;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      noise.connect(filter);
      filter.connect(masterGain);
      lfo.start();
      noise.start();
      activeNodes.push(noise, filter, lfo, lfoGain);
      break;
    }
    case 'FIREPLACE': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'brown');
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 650;
      filter.Q.value = 2.5;
      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      activeNodes.push(noise, filter);
      break;
    }
    case 'BROWN_NOISE': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'brown');
      noise.loop = true;
      noise.connect(masterGain);
      noise.start();
      activeNodes.push(noise);
      break;
    }
    case 'WHITE_NOISE': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'white');
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      activeNodes.push(noise, filter);
      break;
    }
    case 'FOREST':
    case 'CAFE': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'brown');
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      activeNodes.push(noise, filter);
      break;
    }
    case 'PIANO':
    case 'LOFI': {
      const freqs = [329.63, 415.30, 493.88];
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        activeNodes.push(osc, gain);
      });
      break;
    }
    default: {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 'brown');
      noise.loop = true;
      noise.connect(masterGain);
      noise.start();
      activeNodes.push(noise);
      break;
    }
  }
}

function pauseAudioInternal() {
  if (audioCtx && masterGain) {
    masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    setTimeout(() => {
      stopActiveNodes();
      if (audioCtx) audioCtx.suspend();
    }, 300);
  }
}

function setVolumeInternal(vol) {
  if (audioCtx && masterGain) {
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, vol)), audioCtx.currentTime);
  }
}

// Runtime message listener for background offscreen commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_PLAY_TRACK') {
    playTrackInternal(message.trackId, message.volume || 0.5);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OFFSCREEN_PAUSE_AUDIO') {
    pauseAudioInternal();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OFFSCREEN_SET_VOLUME') {
    setVolumeInternal(message.volume);
    sendResponse({ success: true });
    return true;
  }
});
