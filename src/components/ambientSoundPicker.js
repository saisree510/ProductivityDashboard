import { SOUND_TRACKS, playTrack, pauseAudio, setVolume } from '../services/audioEngine.js';
import { getStorage, onStorageChange } from '../services/storage.js';

let isPopoverOpen = false;

/**
 * Initializes the Ambient Sound Picker Widget Component
 */
export async function initAmbientSoundPicker(containerEl) {
  if (!containerEl) return;

  const audioState = await getStorage('ambientAudioState') || {
    currentTrack: 'RAIN',
    isPlaying: false,
    volume: 0.5
  };

  renderWidget(containerEl, audioState);

  // Subscribe to storage changes
  onStorageChange(async (changes) => {
    if (changes.ambientAudioState) {
      const updated = changes.ambientAudioState.newValue || {};
      updateWidgetUI(updated);
    }
  });
}

function renderWidget(containerEl, state) {
  const currentTrack = SOUND_TRACKS.find(t => t.id === state.currentTrack) || SOUND_TRACKS[0];
  const isPlayingClass = state.isPlaying ? 'playing' : '';

  containerEl.innerHTML = `
    <div class="audio-picker-container">
      <button id="audio-toggle-btn" class="audio-toggle-btn ${isPlayingClass}" title="Ambient Sounds">
        <span>${currentTrack.icon}</span>
        <span>${state.isPlaying ? 'Playing' : 'Ambient Sounds'}</span>
        ${state.isPlaying ? renderEqualizerHtml() : ''}
      </button>

      <div id="audio-popover-card" class="audio-popover-card hidden">
        <div class="audio-popover-header">
          <span>Ambient Focus Sounds</span>
          <span style="font-size: 0.75rem; text-transform: none; color: var(--text-muted);">100% Offline</span>
        </div>

        <div class="audio-tracks-grid">
          ${SOUND_TRACKS.map(track => {
            const activeClass = state.currentTrack === track.id ? 'active' : '';
            return `
              <button class="audio-track-btn ${activeClass}" data-track-id="${track.id}">
                <span class="audio-track-icon">${track.icon}</span>
                <span>${track.name}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="audio-volume-wrapper">
          <span style="font-size: 0.8rem; color: var(--text-secondary);">🔈</span>
          <input
            type="range"
            id="audio-volume-slider"
            class="audio-volume-slider"
            min="0"
            max="1"
            step="0.05"
            value="${state.volume !== undefined ? state.volume : 0.5}"
          />
          <span style="font-size: 0.8rem; color: var(--text-secondary);">🔊</span>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function updateWidgetUI(state) {
  const toggleBtn = document.getElementById('audio-toggle-btn');
  const currentTrack = SOUND_TRACKS.find(t => t.id === state.currentTrack) || SOUND_TRACKS[0];

  if (toggleBtn) {
    toggleBtn.className = `audio-toggle-btn ${state.isPlaying ? 'playing' : ''}`;
    toggleBtn.innerHTML = `
      <span>${currentTrack.icon}</span>
      <span>${state.isPlaying ? 'Playing' : 'Ambient Sounds'}</span>
      ${state.isPlaying ? renderEqualizerHtml() : ''}
    `;
  }

  // Update track buttons active state
  document.querySelectorAll('.audio-track-btn').forEach(btn => {
    if (btn.dataset.trackId === state.currentTrack) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const slider = document.getElementById('audio-volume-slider');
  if (slider && state.volume !== undefined) {
    slider.value = state.volume;
  }
}

function bindEvents() {
  const toggleBtn = document.getElementById('audio-toggle-btn');
  const popoverCard = document.getElementById('audio-popover-card');
  const volumeSlider = document.getElementById('audio-volume-slider');

  if (toggleBtn && popoverCard) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      isPopoverOpen = !isPopoverOpen;
      if (isPopoverOpen) {
        popoverCard.classList.remove('hidden');
      } else {
        popoverCard.classList.add('hidden');
      }
    };

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (isPopoverOpen && !popoverCard.contains(e.target) && !toggleBtn.contains(e.target)) {
        isPopoverOpen = false;
        popoverCard.classList.add('hidden');
      }
    });
  }

  // Track selection clicks
  document.querySelectorAll('.audio-track-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const trackId = btn.dataset.trackId;
      const state = await getStorage('ambientAudioState') || {};

      if (state.isPlaying && state.currentTrack === trackId) {
        await pauseAudio();
      } else {
        await playTrack(trackId);
      }
    };
  });

  // Volume slider input
  if (volumeSlider) {
    volumeSlider.oninput = async () => {
      await setVolume(parseFloat(volumeSlider.value));
    };
  }
}

function renderEqualizerHtml() {
  return `
    <span class="sound-wave-eq">
      <span class="sound-wave-bar"></span>
      <span class="sound-wave-bar"></span>
      <span class="sound-wave-bar"></span>
    </span>
  `;
}
