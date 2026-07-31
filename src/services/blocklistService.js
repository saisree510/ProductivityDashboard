import { getStorage, setStorage } from './storage.js';

const RULE_BASE_ID = 100;

/**
 * Builds Chrome Declarative Net Request (DNR) dynamic rule objects for domain blocking
 */
function buildDnrRules(domains) {
  if (!domains || !Array.isArray(domains)) return [];

  const blockedHtmlUrl = chrome.runtime.getURL('blocked.html');

  return domains.map((domain, index) => {
    // Clean domain string
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').trim();

    return {
      id: RULE_BASE_ID + index,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: blockedHtmlUrl }
      },
      condition: {
        urlFilter: `||${cleanDomain}*`,
        resourceTypes: ['main_frame']
      }
    };
  });
}

/**
 * Enables Focus Mode website blocking dynamic rules
 */
export async function enableFocusMode() {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    console.warn('[Blocklist] chrome.declarativeNetRequest API not available.');
    return;
  }

  const state = await getStorage('focusModeState') || {};
  const domains = state.blockedDomains || [
    'youtube.com',
    'instagram.com',
    'linkedin.com',
    'reddit.com',
    'facebook.com',
    'x.com'
  ];

  const newRules = buildDnrRules(domains);
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: newRules
  });

  const updatedState = { ...state, enabled: true, blockedDomains: domains };
  await setStorage('focusModeState', updatedState);
  console.log('[Blocklist] Focus Mode ENABLED. Registered rules:', newRules.length);
  return updatedState;
}

/**
 * Disables Focus Mode website blocking dynamic rules
 */
export async function disableFocusMode() {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    return;
  }

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  if (removeRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: []
    });
  }

  const state = await getStorage('focusModeState') || {};
  const updatedState = { ...state, enabled: false };
  await setStorage('focusModeState', updatedState);
  console.log('[Blocklist] Focus Mode DISABLED. Removed rules:', removeRuleIds.length);
  return updatedState;
}

/**
 * Syncs DNR rules based on saved storage state
 */
export async function syncFocusModeState() {
  const state = await getStorage('focusModeState');
  if (state && state.enabled) {
    await enableFocusMode();
  } else {
    await disableFocusMode();
  }
}
