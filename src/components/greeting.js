import { getStorage, onStorageChange } from '../services/storage.js';

/**
 * Initializes time-of-day greeting component inside target element
 */
export async function initGreeting(containerEl) {
  if (!containerEl) return;

  const userName = await getStorage('userName') || 'Friend';
  renderGreeting(containerEl, userName);

  // Subscribe to name updates in storage
  onStorageChange((changes) => {
    if (changes.userName) {
      const updatedName = changes.userName.newValue || 'Friend';
      renderGreeting(containerEl, updatedName);
    }
  });
}

function renderGreeting(containerEl, userName) {
  const salutation = getSalutation();
  containerEl.innerHTML = `
    <div class="greeting-container">
      <h2 class="greeting-text">
        ${salutation}, <span class="greeting-name" id="greeting-name-display" title="Click Settings to edit name">${escapeHtml(userName)}</span>.
      </h2>
    </div>
  `;
}

function getSalutation() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
