import { getStorage } from '../services/storage.js';
import {
  getSettings,
  updateSettings,
  updateUserName,
  addBlockedDomain,
  removeBlockedDomain,
  restoreDefaultSettings
} from '../services/settingsService.js';
import { uploadCustomWallpaper, selectPresetWallpaper } from './wallpaper.js';

let isModalOpen = false;
let activeTab = 'general';

/**
 * Initializes the Settings & Customization Modal Component
 */
export async function initSettingsModal(containerEl) {
  if (!containerEl) return;

  renderWidget(containerEl);
  bindEvents();
}

function renderWidget(containerEl) {
  containerEl.innerHTML = `
    <button id="settings-trigger-btn" class="settings-trigger-btn" title="Open Dashboard Settings">
      <span>⚙️ Settings</span>
    </button>

    <div id="settings-overlay" class="settings-overlay">
      <div class="settings-modal-card">
        <div class="settings-header">
          <h2 class="settings-modal-title">Settings & Customization</h2>
          <button id="settings-close-btn" class="settings-close-btn" title="Close Settings">✕</button>
        </div>

        <div class="settings-tabs-bar">
          <button class="settings-tab-btn active" data-tab="general">General</button>
          <button class="settings-tab-btn" data-tab="pomodoro">Pomodoro</button>
          <button class="settings-tab-btn" data-tab="focus-mode">Focus Mode</button>
          <button class="settings-tab-btn" data-tab="sound">Sound & Automations</button>
        </div>

        <div class="settings-content-body">
          <!-- General Tab -->
          <div id="tab-general" class="settings-tab-panel">
            <div class="settings-form-group">
              <label class="settings-label">Your Name</label>
              <input type="text" id="settings-user-name" class="glass-input" placeholder="e.g. Friend" />
              <span class="settings-help">Displays in the header greeting</span>
            </div>

            <div class="settings-form-group">
              <label class="settings-label">Clock Format</label>
              <div style="display: flex; gap: 1rem;">
                <label style="font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="clockFormat" value="12h" id="clock-12h" /> 12-Hour (10:45 AM)
                </label>
                <label style="font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="clockFormat" value="24h" id="clock-24h" /> 24-Hour (22:45)
                </label>
              </div>
            </div>

            <div class="settings-form-group">
              <label class="settings-label">Wallpaper Backdrop</label>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <button id="wp-preset-1" class="glass-button" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">Deep Indigo</button>
                <button id="wp-preset-2" class="glass-button" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">Emerald Forest</button>
                <button id="wp-preset-3" class="glass-button" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">Warm Amber</button>
              </div>
              <input type="file" id="settings-wallpaper-file" accept="image/*" style="font-size: 0.8rem;" />
              <span class="settings-help">Upload custom image file</span>
            </div>
          </div>

          <!-- Pomodoro Tab -->
          <div id="tab-pomodoro" class="settings-tab-panel hidden">
            <div class="settings-form-group">
              <label class="settings-label">Focus Session Duration (Minutes)</label>
              <input type="number" id="pomo-dur-focus" class="glass-input" min="1" max="120" value="25" />
            </div>

            <div class="settings-form-group">
              <label class="settings-label">Short Break Duration (Minutes)</label>
              <input type="number" id="pomo-dur-short" class="glass-input" min="1" max="60" value="5" />
            </div>

            <div class="settings-form-group">
              <label class="settings-label">Long Break Duration (Minutes)</label>
              <input type="number" id="pomo-dur-long" class="glass-input" min="1" max="60" value="15" />
            </div>
          </div>

          <!-- Focus Mode Tab -->
          <div id="tab-focus-mode" class="settings-tab-panel hidden">
            <div class="settings-form-group">
              <label class="settings-label">Blocked Distraction Domains</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="settings-new-domain" class="glass-input" placeholder="e.g. tiktok.com" />
                <button id="settings-add-domain-btn" class="glass-button" style="padding: 0.5rem 1rem;">Add</button>
              </div>
              <div id="domain-pills-container" class="domain-pills-container"></div>
            </div>
          </div>

          <!-- Sound Tab -->
          <div id="tab-sound" class="settings-tab-panel hidden">
            <div class="settings-form-group">
              <label class="settings-label">
                <input type="checkbox" id="settings-autoplay-music" /> Auto-play Ambient Sound on Deep Focus launch
              </label>
            </div>
            <div class="settings-form-group">
              <label class="settings-label">
                <input type="checkbox" id="settings-auto-focusmode" /> Auto-enable Website Blocking on session start
              </label>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <button id="settings-restore-btn" class="glass-button" style="color: var(--accent-tomato); border-color: rgba(255,82,82,0.3);">
            Restore Default Settings
          </button>
          <button id="settings-done-btn" class="glass-button" style="background: var(--accent-focus); border-color: var(--accent-focus);">
            Done
          </button>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  const triggerBtn = document.getElementById('settings-trigger-btn');
  const closeBtn = document.getElementById('settings-close-btn');
  const doneBtn = document.getElementById('settings-done-btn');
  const overlay = document.getElementById('settings-overlay');
  const restoreBtn = document.getElementById('settings-restore-btn');

  if (triggerBtn && overlay) {
    triggerBtn.onclick = async () => {
      await populateFormValues();
      overlay.classList.add('active');
    };
  }

  if (closeBtn && overlay) {
    closeBtn.onclick = () => overlay.classList.remove('active');
  }

  if (doneBtn && overlay) {
    doneBtn.onclick = () => overlay.classList.remove('active');
  }

  // Tab switching
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      const targetPanel = document.getElementById(`tab-${tabId}`);
      if (targetPanel) targetPanel.classList.remove('hidden');
    };
  });

  // Name Input
  const nameInput = document.getElementById('settings-user-name');
  if (nameInput) {
    nameInput.onchange = async () => await updateUserName(nameInput.value);
  }

  // Clock format
  const clock12 = document.getElementById('clock-12h');
  const clock24 = document.getElementById('clock-24h');
  if (clock12 && clock24) {
    clock12.onchange = async () => await updateSettings({ clockFormat: '12h' });
    clock24.onchange = async () => await updateSettings({ clockFormat: '24h' });
  }

  // Wallpaper presets
  const wp1 = document.getElementById('wp-preset-1');
  const wp2 = document.getElementById('wp-preset-2');
  const wp3 = document.getElementById('wp-preset-3');
  if (wp1) wp1.onclick = async () => await selectPresetWallpaper('wallpaper-default-1');
  if (wp2) wp2.onclick = async () => await selectPresetWallpaper('wallpaper-default-2');
  if (wp3) wp3.onclick = async () => await selectPresetWallpaper('wallpaper-default-3');

  // Custom Wallpaper upload
  const wpFile = document.getElementById('settings-wallpaper-file');
  if (wpFile) {
    wpFile.onchange = async () => {
      if (wpFile.files && wpFile.files[0]) {
        await uploadCustomWallpaper(wpFile.files[0]);
      }
    };
  }

  // Pomodoro Durations
  const focusInput = document.getElementById('pomo-dur-focus');
  const shortInput = document.getElementById('pomo-dur-short');
  const longInput = document.getElementById('pomo-dur-long');
  if (focusInput && shortInput && longInput) {
    const saveDurations = async () => {
      const settings = await getSettings();
      await updateSettings({
        pomodoroDurations: {
          focus: parseInt(focusInput.value, 10) || 25,
          shortBreak: parseInt(shortInput.value, 10) || 5,
          longBreak: parseInt(longInput.value, 10) || 15
        }
      });
    };
    focusInput.onchange = saveDurations;
    shortInput.onchange = saveDurations;
    longInput.onchange = saveDurations;
  }

  // Add Domain
  const newDomainInput = document.getElementById('settings-new-domain');
  const addDomainBtn = document.getElementById('settings-add-domain-btn');
  if (newDomainInput && addDomainBtn) {
    addDomainBtn.onclick = async () => {
      if (newDomainInput.value.trim()) {
        await addBlockedDomain(newDomainInput.value.trim());
        newDomainInput.value = '';
        await renderDomainPills();
      }
    };
  }

  // Restore Defaults
  if (restoreBtn) {
    restoreBtn.onclick = async () => {
      if (confirm('Restore all default settings?')) {
        await restoreDefaultSettings();
        await populateFormValues();
        alert('Settings restored to defaults.');
      }
    };
  }
}

async function populateFormValues() {
  const userName = await getStorage('userName') || 'Friend';
  const settings = await getSettings();
  const focusState = await getStorage('focusModeState') || {};

  const nameInput = document.getElementById('settings-user-name');
  if (nameInput) nameInput.value = userName;

  const clock12 = document.getElementById('clock-12h');
  const clock24 = document.getElementById('clock-24h');
  if (clock12 && clock24) {
    if (settings.clockFormat === '24h') {
      clock24.checked = true;
    } else {
      clock12.checked = true;
    }
  }

  const focusInput = document.getElementById('pomo-dur-focus');
  const shortInput = document.getElementById('pomo-dur-short');
  const longInput = document.getElementById('pomo-dur-long');
  if (focusInput) focusInput.value = settings.pomodoroDurations?.focus || 25;
  if (shortInput) shortInput.value = settings.pomodoroDurations?.shortBreak || 5;
  if (longInput) longInput.value = settings.pomodoroDurations?.longBreak || 15;

  await renderDomainPills();
}

async function renderDomainPills() {
  const pillsContainer = document.getElementById('domain-pills-container');
  if (!pillsContainer) return;

  const focusState = await getStorage('focusModeState') || {};
  const domains = focusState.blockedDomains || [];

  pillsContainer.innerHTML = domains.map(domain => `
    <span class="domain-pill">
      <span>${escapeHtml(domain)}</span>
      <button class="domain-remove-btn" data-domain="${escapeHtml(domain)}" title="Remove domain">✕</button>
    </span>
  `).join('');

  pillsContainer.querySelectorAll('.domain-remove-btn').forEach(btn => {
    btn.onclick = async () => {
      await removeBlockedDomain(btn.dataset.domain);
      await renderDomainPills();
    };
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
