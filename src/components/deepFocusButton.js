import { startDeepFocus, stopDeepFocus, isDeepFocusActive } from '../services/deepFocusService.js';
import { onStorageChange } from '../services/storage.js';

/**
 * Initializes the Deep Focus CTA Button Component
 */
export async function initDeepFocusButton(containerEl) {
  if (!containerEl) return;

  const isActive = await isDeepFocusActive();
  renderButton(containerEl, isActive);

  // Subscribe to storage changes
  onStorageChange(async (changes) => {
    if (changes.deepFocusState) {
      const updatedActive = !!(changes.deepFocusState.newValue && changes.deepFocusState.newValue.active);
      renderButton(containerEl, updatedActive);
    }
  });
}

function renderButton(containerEl, isActive) {
  const activeClass = isActive ? 'active' : '';
  const labelText = isActive ? '⚡ Deep Focus Active (Stop)' : '⚡ Start Deep Focus';
  const tooltipText = isActive ? 'Click to stop Deep Focus session' : 'One-click: Start Pomodoro, block distractions & play audio';

  containerEl.innerHTML = `
    <button
      id="deep-focus-btn"
      class="deep-focus-btn ${activeClass}"
      title="${tooltipText}"
    >
      <span>${labelText}</span>
    </button>
  `;

  const btn = document.getElementById('deep-focus-btn');
  if (btn) {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const currentlyActive = await isDeepFocusActive();
        if (currentlyActive) {
          await stopDeepFocus();
        } else {
          await startDeepFocus();
        }
      } catch (err) {
        console.error('[Deep Focus Button] Error toggling session:', err);
      } finally {
        btn.disabled = false;
      }
    };
  }
}
