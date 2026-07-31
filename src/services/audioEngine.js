import { getStorage, setStorage } from './storage.js';

export const SOUND_TRACKS = [
  { id: 'RAIN', name: 'Rain', icon: '🌧️' },
  { id: 'FOREST', name: 'Forest', icon: '🌲' },
  { id: 'OCEAN', name: 'Ocean', icon: '🌊' },
  { id: 'FIREPLACE', name: 'Fireplace', icon: '🔥' },
  { id: 'CAFE', name: 'Café', icon: '☕' },
  { id: 'PIANO', name: 'Piano', icon: '🎹' },
  { id: 'LOFI', name: 'Lo-Fi', icon: '🎧' },
  { id: 'BROWN_NOISE', name: 'Brown Noise', icon: '📻' },
  { id: 'WHITE_NOISE', name: 'White Noise', icon: '💨' }
];

let audioCtx = null;
let masterGain = null;
let activeNodes = [];
let isAudioPlaying = false;
let currentTrackId = null;

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

/**
 * Procedural Audio Synthesizer (Unlocked by User Click Gesture)
 */
function playProceduralSound(ctx, trackId, volume = 0.5) {
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
      lfo.frequency.value = 0.14; // 7-second wave cycle
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
      // Warm E-Major chord drone (E4, G#4, B4)
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

/**
 * Plays specified ambient track
 */
export async function playTrack(trackId) {
  const ctx = getAudioContext();
  const storageState = await getStorage('ambientAudioState') || {};
  const masterVolume = storageState.volume !== undefined ? storageState.volume : 0.5;

  currentTrackId = trackId;
  isAudioPlaying = true;

  if (ctx) {
    playProceduralSound(ctx, trackId, masterVolume);
  }

  // Also send command to background offscreen worker
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage({
        type: 'PLAY_AMBIENT_AUDIO',
        trackId,
        volume: masterVolume
      });
    } catch (e) {
      // Ignore background message errors
    }
  }

  await setStorage('ambientAudioState', {
    ...storageState,
    currentTrack: trackId,
    isPlaying: true
  });
}

/**
 * Pauses active ambient audio
 */
export async function pauseAudio() {
  if (audioCtx && masterGain && isAudioPlaying) {
    masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    setTimeout(() => {
      stopActiveNodes();
      if (audioCtx) audioCtx.suspend();
    }, 300);
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage({ type: 'PAUSE_AMBIENT_AUDIO' });
    } catch (e) {
      // Ignore background message errors
    }
  }

  isAudioPlaying = false;
  const storageState = await getStorage('ambientAudioState') || {};
  await setStorage('ambientAudioState', {
    ...storageState,
    isPlaying: false
  });
}

/**
 * Sets master volume level (0.0 to 1.0)
 */
export async function setVolume(volumeLevel) {
  const vol = Math.max(0, Math.min(1, volumeLevel));
  if (audioCtx && masterGain) {
    masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage({
        type: 'SET_AMBIENT_VOLUME',
        volume: vol
      });
    } catch (e) {
      // Ignore background message errors
    }
  }

  const storageState = await getStorage('ambientAudioState') || {};
  await setStorage('ambientAudioState', {
    ...storageState,
    volume: vol
  });
}
