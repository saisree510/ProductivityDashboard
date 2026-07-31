import { initStorageDefaults } from './services/storage.js';
import { initWallpaper } from './components/wallpaper.js';
import { initClock } from './components/clock.js';
import { initGreeting } from './components/greeting.js';
import { initDailyFocus } from './components/dailyFocus.js';
import { initTaskList } from './components/taskList.js';
import { initScratchPad } from './components/scratchPad.js';
import { initPomodoroTomato } from './components/pomodoroTomato.js';
import { initAmbientSoundPicker } from './components/ambientSoundPicker.js';
import { initDeepFocusButton } from './components/deepFocusButton.js';
import { initCompletionModal } from './components/completionModal.js';
import { initSettingsModal } from './components/settingsModal.js';

/**
 * Main Extension Dashboard Entry Point
 */
async function initDashboard() {
  console.log('[Focus Dashboard] Initializing extension dashboard...');

  try {
    // 1. Storage Defaults Initialization
    await initStorageDefaults();

    // 2. Initialize Wallpaper Backdrop Engine
    await initWallpaper();

    // 3. Initialize Header (Greeting + Deep Focus CTA + Audio Picker + Settings)
    const headerEl = document.getElementById('dashboard-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <div id="greeting-mount"></div>
        <div id="header-actions" style="display: flex; align-items: center; gap: 0.85rem;">
          <div id="deep-focus-mount"></div>
          <div id="audio-picker-mount"></div>
          <div id="settings-mount"></div>
        </div>
      `;
      await initGreeting(document.getElementById('greeting-mount'));
      await initDeepFocusButton(document.getElementById('deep-focus-mount'));
      await initAmbientSoundPicker(document.getElementById('audio-picker-mount'));
      await initSettingsModal(document.getElementById('settings-mount'));
    }

    // 4. Initialize Hero Section (Clock + Pomodoro Tomato + Daily Focus + Side-by-Side Widgets Row)
    const heroEl = document.getElementById('dashboard-center');
    if (heroEl) {
      heroEl.innerHTML = `
        <div id="clock-mount"></div>
        <div id="pomodoro-mount"></div>
        <div id="daily-focus-mount" style="width: 100%;"></div>
        <div id="dashboard-widgets-row">
          <div id="task-list-mount"></div>
          <div id="scratch-pad-mount"></div>
        </div>
      `;

      await initClock(document.getElementById('clock-mount'));
      await initPomodoroTomato(document.getElementById('pomodoro-mount'));
      await initDailyFocus(document.getElementById('daily-focus-mount'));
      await initTaskList(document.getElementById('task-list-mount'));
      await initScratchPad(document.getElementById('scratch-pad-mount'));
    }

    // 5. Initialize Completion Overlay Modal
    const modalMount = document.createElement('div');
    modalMount.id = 'completion-modal-mount';
    document.body.appendChild(modalMount);
    initCompletionModal(modalMount);

    console.log('[Focus Dashboard] Phase 11 Settings & Customization Panel initialized.');

  } catch (err) {
    console.error('[Focus Dashboard] Dashboard initialization error:', err);
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
