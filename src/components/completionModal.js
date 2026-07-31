import { startPomodoro, MODES } from '../services/pomodoroEngine.js';
import { triggerSessionCompletion } from '../services/notificationService.js';
import { onStorageChange } from '../services/storage.js';

let lastHandledCompletedTime = null;

/**
 * Initializes the Completion Modal Overlay Component
 */
export function initCompletionModal(containerEl) {
  if (!containerEl) return;

  renderModal(containerEl);

  // Listen to custom pomodoro-completed event
  window.addEventListener('pomodoro-completed', (e) => {
    const isFocus = e.detail ? e.detail.isFocusSession : true;
    showModal(isFocus);
  });

  // Watch storage for state transitions to 0 remaining seconds
  onStorageChange((changes) => {
    if (changes.pomodoroState) {
      const state = changes.pomodoroState.newValue;
      if (state && state.remainingSeconds === 0 && state.state === 'STOPPED') {
        const eventId = `${state.mode}_${state.completedCount}`;
        if (lastHandledCompletedTime !== eventId) {
          lastHandledCompletedTime = eventId;
          triggerSessionCompletion(state.mode === MODES.FOCUS);
        }
      }
    }
  });
}

function renderModal(containerEl) {
  containerEl.innerHTML = `
    <div id="completion-overlay" class="completion-overlay">
      <div class="completion-card">
        <div id="completion-icon" class="completion-icon">🎉</div>
        <h2 id="completion-title" class="completion-title">Focus Session Complete!</h2>
        <p id="completion-message" class="completion-message">
          Great job! You stayed focused and completed your session. Time to rest your mind.
        </p>

        <div class="completion-actions">
          <button id="completion-btn-break" class="completion-btn-primary">
            ☕ Start 5 Min Break
          </button>
          <button id="completion-btn-focus" class="completion-btn-secondary">
            ⚡ Start Another Focus Session
          </button>
          <button id="completion-btn-close" class="completion-btn-secondary" style="opacity: 0.7;">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function showModal(isFocusSession = true) {
  const overlay = document.getElementById('completion-overlay');
  const icon = document.getElementById('completion-icon');
  const title = document.getElementById('completion-title');
  const msg = document.getElementById('completion-message');
  const breakBtn = document.getElementById('completion-btn-break');

  if (!overlay) return;

  if (isFocusSession) {
    if (icon) icon.textContent = '🍅';
    if (title) title.textContent = 'Focus Session Complete!';
    if (msg) msg.textContent = 'Great job! You stayed focused and completed your session. Time to take a short break.';
    if (breakBtn) breakBtn.style.display = 'block';
  } else {
    if (icon) icon.textContent = '🔔';
    if (title) title.textContent = 'Break Complete!';
    if (msg) msg.textContent = 'Your break is over. Ready to start another Deep Focus session?';
    if (breakBtn) breakBtn.style.display = 'none';
  }

  overlay.classList.add('active');
}

function hideModal() {
  const overlay = document.getElementById('completion-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

function bindEvents() {
  const breakBtn = document.getElementById('completion-btn-break');
  const focusBtn = document.getElementById('completion-btn-focus');
  const closeBtn = document.getElementById('completion-btn-close');

  if (breakBtn) {
    breakBtn.onclick = async () => {
      hideModal();
      await startPomodoro(MODES.SHORT_BREAK);
    };
  }

  if (focusBtn) {
    focusBtn.onclick = async () => {
      hideModal();
      await startPomodoro(MODES.FOCUS);
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      hideModal();
    };
  }
}
