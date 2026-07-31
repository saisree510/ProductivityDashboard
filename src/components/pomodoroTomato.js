import {
  getPomodoroState,
  startPomodoro,
  pausePomodoro,
  resumePomodoro,
  resetPomodoro,
  skipBreak,
  MODES,
  STATES
} from '../services/pomodoroEngine.js';
import { onStorageChange } from '../services/storage.js';

let updateInterval = null;

/**
 * Initializes the Pomodoro Tomato Timer Widget Component
 */
export async function initPomodoroTomato(containerEl) {
  if (!containerEl) return;

  const state = await getPomodoroState();
  renderWidget(containerEl, state);

  // Start tick interval for smooth second updates
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(async () => {
    const currentState = await getPomodoroState();
    updateDisplay(currentState);
  }, 1000);

  // Subscribe to storage changes
  onStorageChange(async (changes) => {
    if (changes.pomodoroState) {
      const updated = await getPomodoroState();
      renderWidget(containerEl, updated);
    }
  });
}

function renderWidget(containerEl, state) {
  containerEl.innerHTML = `
    <div class="pomodoro-container">
      <div class="tomato-visual-wrapper" id="tomato-visual-btn" title="Click to start/pause Pomodoro">
        <svg class="tomato-svg" viewBox="0 0 100 100" id="tomato-svg-element">
          <!-- Tomato Body -->
          <circle cx="50" cy="54" r="40" fill="#ff5252" />
          <circle cx="50" cy="54" r="38" fill="url(#tomato-grad)" />

          <!-- Leaf Stem -->
          <path d="M50 14 C48 24, 38 22, 34 26 C42 26, 46 30, 50 34 C54 30, 58 26, 66 26 C62 22, 52 24, 50 14 Z" fill="#10b981" />
          <path d="M50 14 Q52 8 55 6" stroke="#047857" stroke-width="3" fill="none" stroke-linecap="round" />

          <!-- Gradient Definition -->
          <defs>
            <radialGradient id="tomato-grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#ff7b7b" />
              <stop offset="70%" stop-color="#ff5252" />
              <stop offset="100%" stop-color="#d93838" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div class="pomodoro-info">
        <span id="pomodoro-mode-badge" class="pomodoro-mode-badge">${getModeLabel(state.mode)}</span>
        <span id="pomodoro-time-display" class="pomodoro-time-display">${formatTime(state.remainingSeconds)}</span>
      </div>

      <div id="pomodoro-controls" class="pomodoro-controls">
        ${renderControlsHtml(state)}
      </div>
    </div>
  `;

  bindEvents(containerEl);
  updateDisplay(state);
}

function updateDisplay(state) {
  const timeEl = document.getElementById('pomodoro-time-display');
  const badgeEl = document.getElementById('pomodoro-mode-badge');
  const svgEl = document.getElementById('tomato-svg-element');
  const controlsEl = document.getElementById('pomodoro-controls');

  if (timeEl) timeEl.textContent = formatTime(state.remainingSeconds);
  if (badgeEl) badgeEl.textContent = getModeLabel(state.mode);

  if (svgEl && state.durationSeconds > 0) {
    const elapsed = state.durationSeconds - state.remainingSeconds;
    const progress = Math.min(1, Math.max(0, elapsed / state.durationSeconds));
    const rotationDeg = progress * 360;
    svgEl.style.transform = `rotate(${rotationDeg}deg)`;
  }

  if (controlsEl) {
    controlsEl.innerHTML = renderControlsHtml(state);
    bindControlEvents();
  }
}

function bindEvents(containerEl) {
  const visualBtn = document.getElementById('tomato-visual-btn');
  if (visualBtn) {
    visualBtn.addEventListener('click', async () => {
      const state = await getPomodoroState();
      if (state.state === STATES.RUNNING) {
        await pausePomodoro();
      } else if (state.state === STATES.PAUSED) {
        await resumePomodoro();
      } else {
        await startPomodoro(MODES.FOCUS);
      }
    });
  }

  bindControlEvents();
}

function bindControlEvents() {
  const startBtn = document.getElementById('pomo-btn-start');
  if (startBtn) {
    startBtn.onclick = async () => await startPomodoro(MODES.FOCUS);
  }

  const pauseBtn = document.getElementById('pomo-btn-pause');
  if (pauseBtn) {
    pauseBtn.onclick = async () => await pausePomodoro();
  }

  const resumeBtn = document.getElementById('pomo-btn-resume');
  if (resumeBtn) {
    resumeBtn.onclick = async () => await resumePomodoro();
  }

  const resetBtn = document.getElementById('pomo-btn-reset');
  if (resetBtn) {
    resetBtn.onclick = async () => await resetPomodoro();
  }

  const skipBtn = document.getElementById('pomo-btn-skip');
  if (skipBtn) {
    skipBtn.onclick = async () => await skipBreak();
  }
}

function renderControlsHtml(state) {
  if (state.state === STATES.STOPPED) {
    return `<button id="pomo-btn-start" class="pomodoro-btn pomodoro-btn-start">▶ Start</button>`;
  }

  if (state.state === STATES.RUNNING) {
    return `
      <button id="pomo-btn-pause" class="pomodoro-btn">⏸ Pause</button>
      <button id="pomo-btn-reset" class="pomodoro-btn">↺ Reset</button>
    `;
  }

  if (state.state === STATES.PAUSED) {
    return `
      <button id="pomo-btn-resume" class="pomodoro-btn pomodoro-btn-start">▶ Resume</button>
      <button id="pomo-btn-reset" class="pomodoro-btn">↺ Reset</button>
    `;
  }

  return '';
}

function getModeLabel(mode) {
  if (mode === MODES.SHORT_BREAK) return 'Short Break';
  if (mode === MODES.LONG_BREAK) return 'Long Break';
  return 'Focus Session';
}

function formatTime(totalSeconds) {
  const minutes = Math.floor((totalSeconds || 0) / 60);
  const seconds = (totalSeconds || 0) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
