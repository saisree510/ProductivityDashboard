import { getStorage, setStorage, onStorageChange } from '../services/storage.js';

let debounceTimeout = null;

/**
 * Initializes the Scratch Pad Widget Component
 */
export async function initScratchPad(containerEl) {
  if (!containerEl) return;

  const initialNote = await getStorage('scratchPad') || '';
  renderWidget(containerEl, initialNote);

  // Subscribe to storage updates (e.g. from other tabs)
  onStorageChange((changes) => {
    if (changes.scratchPad) {
      const textarea = document.getElementById('scratch-pad-textarea');
      if (textarea && textarea.value !== changes.scratchPad.newValue) {
        textarea.value = changes.scratchPad.newValue || '';
      }
    }
  });
}

function renderWidget(containerEl, initialNote) {
  containerEl.innerHTML = `
    <div class="glass-card scratch-pad-card">
      <div class="scratch-pad-header">
        <span class="scratch-pad-title">Scratch Pad</span>
        <span id="scratch-pad-status" class="scratch-pad-status saved">Saved</span>
      </div>
      <textarea
        id="scratch-pad-textarea"
        class="scratch-pad-textarea"
        placeholder="Lightweight notes & temporary thoughts..."
        autocomplete="off"
        spellcheck="false"
      >${escapeHtml(initialNote)}</textarea>
    </div>
  `;

  const textareaEl = document.getElementById('scratch-pad-textarea');
  const statusEl = document.getElementById('scratch-pad-status');

  if (textareaEl && statusEl) {
    textareaEl.addEventListener('input', () => {
      // Set status badge to 'Saving...'
      statusEl.textContent = 'Saving...';
      statusEl.className = 'scratch-pad-status saving';

      if (debounceTimeout) clearTimeout(debounceTimeout);

      // Debounce 300ms before persisting to chrome.storage.local
      debounceTimeout = setTimeout(async () => {
        await setStorage('scratchPad', textareaEl.value);
        statusEl.textContent = 'Saved';
        statusEl.className = 'scratch-pad-status saved';
      }, 300);
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
