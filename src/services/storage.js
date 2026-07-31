/**
 * Storage Service Module
 * Handles chrome.storage.local persistence, state schema, and reactive listeners.
 */

export const DEFAULT_STORAGE_STATE = {
  userName: 'Friend',
  wallpaper: {
    type: 'default',
    customUrl: null,
    overlayOpacity: 0.35
  },
  dailyFocus: {
    text: '',
    dateStamp: null,
    isCompleted: false
  },
  tasks: [],
  scratchPad: '',
  pomodoroState: {
    mode: 'FOCUS', // 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
    state: 'STOPPED', // 'RUNNING' | 'PAUSED' | 'STOPPED'
    remainingSeconds: 1500,
    endTime: null,
    completedCount: 0
  },
  focusModeState: {
    enabled: false,
    blockedDomains: [
      'youtube.com',
      'instagram.com',
      'linkedin.com',
      'reddit.com',
      'facebook.com',
      'x.com'
    ]
  },
  ambientAudioState: {
    currentTrack: null,
    isPlaying: false,
    volume: 0.5,
    autoPlayOnDeepFocus: true
  },
  stats: {
    todayFocusMinutes: 0,
    todayPomodoros: 0,
    todayBlockedAttempts: 0,
    weeklyData: {},
    lifetimeFocusMinutes: 0,
    lifetimePomodoros: 0
  },
  settings: {
    pomodoroDurations: {
      focus: 25,
      shortBreak: 5,
      longBreak: 15
    },
    clockFormat: '12h',
    autoFocusMode: true,
    notificationSound: true
  }
};

/**
 * Initializes default storage values for keys that do not exist yet.
 */
export async function initStorageDefaults() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('[Storage] chrome.storage.local not available in this environment.');
    return DEFAULT_STORAGE_STATE;
  }

  const existing = await new Promise((resolve) => chrome.storage.local.get(null, resolve));
  const keysToSeed = {};

  for (const [key, defaultValue] of Object.entries(DEFAULT_STORAGE_STATE)) {
    if (existing[key] === undefined) {
      keysToSeed[key] = defaultValue;
    }
  }

  if (Object.keys(keysToSeed).length > 0) {
    await new Promise((resolve) => chrome.storage.local.set(keysToSeed, resolve));
  }

  return { ...DEFAULT_STORAGE_STATE, ...existing, ...keysToSeed };
}

/**
 * Retrieves specific key or all storage data.
 */
export async function getStorage(key = null) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return key ? DEFAULT_STORAGE_STATE[key] : DEFAULT_STORAGE_STATE;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (key) {
        resolve(result[key] !== undefined ? result[key] : DEFAULT_STORAGE_STATE[key]);
      } else {
        resolve({ ...DEFAULT_STORAGE_STATE, ...result });
      }
    });
  });
}

/**
 * Persists value to chrome.storage.local.
 */
export async function setStorage(key, value) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Subscribes to storage changes.
 */
export function onStorageChange(callback) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) {
    return () => {};
  }

  const listener = (changes, areaName) => {
    if (areaName === 'local') {
      callback(changes);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
