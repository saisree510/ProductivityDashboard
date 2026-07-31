import {
  getDailyFocus,
  setDailyFocus,
  clearDailyFocus
} from '../services/dailyFocusService.js';
import { onStorageChange } from '../services/storage.js';

/**
 * Initializes the Daily Focus component inside target container element
 */
export async function initDailyFocus(containerEl) {
  if (!containerEl) return;

  const focusData = await getDailyFocus();
  render(containerEl, focusData);

  // Subscribe to reactive storage changes
  onStorageChange(async (changes) => {
    if (changes.dailyFocus) {
      const updated = changes.dailyFocus.newValue;
      render(containerEl, updated);
    }
  });
}

function render(containerEl, focusData) {
  if (!focusData || !focusData.text) {
    renderUnsetPrompt(containerEl);
  } else {
    renderActiveHyperlink(containerEl, focusData);
  }
}

function renderUnsetPrompt(containerEl) {
  containerEl.innerHTML = `
    <div class="daily-focus-container">
      <label for="daily-focus-input" class="daily-focus-prompt-label">
        What is your main focus today?
      </label>
      <div class="daily-focus-input-wrapper">
        <input
          type="text"
          id="daily-focus-input"
          class="daily-focus-input"
          placeholder="e.g. Finish Chrome Extension Layout"
          autocomplete="off"
        />
      </div>
    </div>
  `;

  const inputEl = document.getElementById('daily-focus-input');
  if (inputEl) {
    inputEl.focus();
    inputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && inputEl.value.trim()) {
        await setDailyFocus(inputEl.value);
      }
    });
  }
}

function renderActiveHyperlink(containerEl, focusData) {
  containerEl.innerHTML = `
    <div class="daily-focus-container">
      <div class="daily-focus-prompt-label">TODAY'S MAIN FOCUS</div>
      <div class="daily-focus-link-wrapper">
        <a
          href="#"
          id="daily-focus-link"
          class="daily-focus-link"
          title="Click to edit main focus"
        >
          "${escapeHtml(focusData.text)}"
        </a>
      </div>
    </div>
  `;

  const linkEl = document.getElementById('daily-focus-link');
  if (linkEl) {
    linkEl.addEventListener('click', async (e) => {
      e.preventDefault();
      await clearDailyFocus();
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
