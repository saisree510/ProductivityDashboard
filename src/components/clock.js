import { getStorage, onStorageChange } from '../services/storage.js';

let clockInterval = null;
let is24HourFormat = false;

/**
 * Initializes live digital clock component inside target container element
 */
export async function initClock(containerEl) {
  if (!containerEl) return;

  // 1. Fetch saved clock settings
  const settings = await getStorage('settings');
  is24HourFormat = settings?.clockFormat === '24h';

  // 2. Render container structure
  containerEl.innerHTML = `
    <div class="clock-container">
      <div class="clock-time" id="clock-time-display">--:--</div>
      <div class="clock-date" id="clock-date-display">--</div>
    </div>
  `;

  const timeEl = document.getElementById('clock-time-display');
  const dateEl = document.getElementById('clock-date-display');

  // 3. Start tick loop
  updateClockDisplay(timeEl, dateEl);
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => updateClockDisplay(timeEl, dateEl), 1000);

  // 4. Subscribe to settings updates
  onStorageChange((changes) => {
    if (changes.settings) {
      is24HourFormat = changes.settings.newValue?.clockFormat === '24h';
      updateClockDisplay(timeEl, dateEl);
    }
  });
}

function updateClockDisplay(timeEl, dateEl) {
  if (!timeEl || !dateEl) return;

  const now = new Date();

  // Format Time
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');

  if (!is24HourFormat) {
    hours = hours % 12 || 12; // 12-hour format
  } else {
    hours = String(hours).padStart(2, '0');
  }

  const timeString = `${hours}:${minutes}`;
  if (timeEl.textContent !== timeString) {
    timeEl.textContent = timeString;
  }

  // Format Date (e.g., "Monday, October 24")
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateString = now.toLocaleDateString(undefined, options);
  if (dateEl.textContent !== dateString) {
    dateEl.textContent = dateString;
  }
}

/**
 * Clean up interval listener
 */
export function destroyClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}
