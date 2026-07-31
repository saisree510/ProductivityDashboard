import { getDailyFocus } from '../services/dailyFocusService.js';
import { disableFocusMode } from '../services/blocklistService.js';
import { recordBlockedAttempt } from '../services/statsService.js';

async function initBlockedPage() {
  // 1. Log Blocked Site Attempt Metric
  try {
    await recordBlockedAttempt();
  } catch (err) {
    console.error('[Blocked Page] Error recording blocked attempt:', err);
  }

  // 2. Fetch Today's Daily Focus
  try {
    const focusData = await getDailyFocus();
    const focusEl = document.getElementById('blocked-focus-text');
    if (focusEl) {
      focusEl.textContent = focusData?.text ? `"${focusData.text}"` : 'No main focus set yet today';
    }
  } catch (err) {
    console.error('[Blocked Page] Error loading focus:', err);
  }

  // 3. Return to Safety Action (Always Navigates Straight to Dashboard)
  const returnBtn = document.getElementById('blocked-return-btn');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      const dashboardUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL('index.html')
        : 'index.html';
      window.location.href = dashboardUrl;
    });
  }

  // 4. Disable Focus Mode Action
  const disableBtn = document.getElementById('blocked-disable-btn');
  if (disableBtn) {
    disableBtn.addEventListener('click', async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'DISABLE_FOCUS_MODE' }, () => {
            const dashboardUrl = chrome.runtime.getURL('index.html');
            window.location.href = dashboardUrl;
          });
        } else {
          await disableFocusMode();
          window.location.href = 'index.html';
        }
      } catch (err) {
        console.error('[Blocked Page] Error disabling focus mode:', err);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initBlockedPage);
