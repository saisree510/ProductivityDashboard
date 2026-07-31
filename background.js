import { initStorageDefaults, getStorage, setStorage } from './src/services/storage.js';
import { syncFocusModeState, enableFocusMode, disableFocusMode } from './src/services/blocklistService.js';

let creatingOffscreenDocument = null;

async function ensureOffscreenDocument() {
  if (typeof chrome === 'undefined' || !chrome.offscreen) return;
  const path = 'offscreen.html';

  if (await chrome.offscreen.hasDocument()) return;

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
  } else {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Persistent background ambient sound playback during focus sessions'
    });
    await creatingOffscreenDocument;
    creatingOffscreenDocument = null;
  }
}

// Seed storage & sync blocklist rules on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Focus Dashboard] Service worker installed:', details.reason);
  try {
    await initStorageDefaults();
    await syncFocusModeState();
  } catch (err) {
    console.error('[Focus Dashboard] Initialization failed:', err);
  }
});

// Sync rules when Chrome starts up
chrome.runtime.onStartup.addListener(async () => {
  try {
    await syncFocusModeState();
  } catch (err) {
    console.error('[Focus Dashboard] Startup sync failed:', err);
  }
});

// Alarm Listener for background timer completion
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'pomodoro_timer_alarm') {
      console.log('[Focus Dashboard] Alarm fired! Verifying completion status...');
      const currentState = await getStorage('pomodoroState');

      if (currentState && currentState.state === 'RUNNING' && currentState.endTime) {
        const now = Date.now();
        // Guard against premature alarm execution
        if (now >= currentState.endTime - 2000) {
          console.log('[Focus Dashboard] Pomodoro session completed successfully!');
          const isFocus = currentState.mode === 'FOCUS';
          const updated = {
            ...currentState,
            state: 'STOPPED',
            remainingSeconds: 0,
            endTime: null,
            completedCount: isFocus ? (currentState.completedCount || 0) + 1 : (currentState.completedCount || 0)
          };
          await setStorage('pomodoroState', updated);

          // Stop ambient audio in offscreen document on session finish
          try {
            await ensureOffscreenDocument();
            chrome.runtime.sendMessage({ type: 'OFFSCREEN_PAUSE_AUDIO' });
          } catch (e) {
            // Ignore offscreen errors
          }

          // Native Chrome Notification
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'index.html',
              title: isFocus ? 'Focus Session Complete! 🍅' : 'Break Time Complete! 🔔',
              message: isFocus ? 'Great job! Time to take a well-deserved break.' : 'Ready to resume your deep focus?',
              priority: 2
            });
          }
        } else {
          console.log('[Focus Dashboard] Alarm fired early. Rescheduling for target endTime...');
          chrome.alarms.create('pomodoro_timer_alarm', { when: currentState.endTime });
        }
      }
    }
  });
}

// Communication gateway between UI, Service Worker, and Offscreen Document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', timestamp: Date.now() });
    return true;
  }

  if (message.type === 'ENABLE_FOCUS_MODE') {
    enableFocusMode().then((state) => sendResponse({ success: true, state }));
    return true;
  }

  if (message.type === 'DISABLE_FOCUS_MODE') {
    disableFocusMode().then((state) => sendResponse({ success: true, state }));
    return true;
  }

  if (message.type === 'PLAY_AMBIENT_AUDIO') {
    ensureOffscreenDocument().then(() => {
      chrome.runtime.sendMessage({
        type: 'OFFSCREEN_PLAY_TRACK',
        trackId: message.trackId,
        volume: message.volume !== undefined ? message.volume : 0.5
      });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'PAUSE_AMBIENT_AUDIO') {
    ensureOffscreenDocument().then(() => {
      chrome.runtime.sendMessage({ type: 'OFFSCREEN_PAUSE_AUDIO' });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'SET_AMBIENT_VOLUME') {
    ensureOffscreenDocument().then(() => {
      chrome.runtime.sendMessage({
        type: 'OFFSCREEN_SET_VOLUME',
        volume: message.volume
      });
      sendResponse({ success: true });
    });
    return true;
  }
});
