import { getStorage, setStorage } from './storage.js';

/**
 * Returns local YYYY-MM-DD date string
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets daily focus state, automatically resetting if calendar day has changed
 */
export async function getDailyFocus() {
  const currentFocus = await getStorage('dailyFocus');
  const today = getTodayDateString();

  // Auto-reset if dateStamp is missing or belongs to a previous calendar day
  if (!currentFocus || currentFocus.dateStamp !== today) {
    const freshFocus = {
      text: '',
      dateStamp: today,
      isCompleted: false
    };
    await setStorage('dailyFocus', freshFocus);
    return freshFocus;
  }

  return currentFocus;
}

/**
 * Updates today's focus text
 */
export async function setDailyFocus(text) {
  const today = getTodayDateString();
  const updated = {
    text: text.trim(),
    dateStamp: today,
    isCompleted: false
  };
  await setStorage('dailyFocus', updated);
  return updated;
}

/**
 * Toggles completion status of today's focus
 */
export async function toggleDailyFocusComplete() {
  const current = await getDailyFocus();
  if (!current || !current.text) return current;

  const updated = {
    ...current,
    isCompleted: !current.isCompleted
  };
  await setStorage('dailyFocus', updated);
  return updated;
}

/**
 * Clears current daily focus text to allow re-entry
 */
export async function clearDailyFocus() {
  const today = getTodayDateString();
  const reset = {
    text: '',
    dateStamp: today,
    isCompleted: false
  };
  await setStorage('dailyFocus', reset);
  return reset;
}
