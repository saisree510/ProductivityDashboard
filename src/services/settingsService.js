import { getStorage, setStorage, DEFAULT_STORAGE_STATE } from './storage.js';
import { enableFocusMode, syncFocusModeState } from './blocklistService.js';

/**
 * Settings Sync & Reset Engine
 */

export async function getSettings() {
  const current = await getStorage('settings');
  return current || DEFAULT_STORAGE_STATE.settings;
}

export async function updateSettings(partialSettings) {
  const current = await getSettings();
  const updated = {
    ...current,
    ...partialSettings
  };
  await setStorage('settings', updated);
  return updated;
}

export async function updateUserName(name) {
  const cleanName = (name || 'Friend').trim();
  await setStorage('userName', cleanName);
  return cleanName;
}

export async function addBlockedDomain(domain) {
  if (!domain || !domain.trim()) return;
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').trim();

  const state = await getStorage('focusModeState') || {};
  const domains = state.blockedDomains || [];

  if (!domains.includes(cleanDomain)) {
    const updatedDomains = [...domains, cleanDomain];
    const updatedState = { ...state, blockedDomains: updatedDomains };
    await setStorage('focusModeState', updatedState);

    if (state.enabled) {
      await enableFocusMode();
    }
  }
}

export async function removeBlockedDomain(domain) {
  const state = await getStorage('focusModeState') || {};
  const domains = state.blockedDomains || [];

  const updatedDomains = domains.filter(d => d !== domain);
  const updatedState = { ...state, blockedDomains: updatedDomains };
  await setStorage('focusModeState', updatedState);

  if (state.enabled) {
    await enableFocusMode();
  }
}

export async function restoreDefaultSettings() {
  await setStorage('userName', DEFAULT_STORAGE_STATE.userName);
  await setStorage('wallpaper', DEFAULT_STORAGE_STATE.wallpaper);
  await setStorage('settings', DEFAULT_STORAGE_STATE.settings);
  await setStorage('focusModeState', DEFAULT_STORAGE_STATE.focusModeState);
  await syncFocusModeState();
  return DEFAULT_STORAGE_STATE;
}
