import { getStorage, setStorage } from './storage.js';

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets aggregated statistics, automatically resetting daily counts on new calendar days
 */
export async function getStats() {
  const stats = await getStorage('stats') || {};
  const today = getTodayDateString();

  // Reset daily counters if new calendar day
  if (stats.lastDateStamp !== today) {
    const updated = {
      ...stats,
      todayFocusMinutes: 0,
      todayPomodoros: 0,
      todayBlockedAttempts: 0,
      lastDateStamp: today,
      weeklyData: stats.weeklyData || {}
    };
    await setStorage('stats', updated);
    return updated;
  }

  return stats;
}

/**
 * Logs completed focus minutes
 */
export async function recordFocusTime(minutes) {
  const stats = await getStats();
  const today = getTodayDateString();
  const weekly = stats.weeklyData || {};

  const todayWeekly = weekly[today] || { focusMinutes: 0, pomodoros: 0, blockedAttempts: 0 };
  todayWeekly.focusMinutes += minutes;
  weekly[today] = todayWeekly;

  const updated = {
    ...stats,
    todayFocusMinutes: (stats.todayFocusMinutes || 0) + minutes,
    lifetimeFocusMinutes: (stats.lifetimeFocusMinutes || 0) + minutes,
    weeklyData: weekly
  };

  await setStorage('stats', updated);
  return updated;
}

/**
 * Logs completed Pomodoro count
 */
export async function recordCompletedPomodoro() {
  const stats = await getStats();
  const today = getTodayDateString();
  const weekly = stats.weeklyData || {};

  const todayWeekly = weekly[today] || { focusMinutes: 0, pomodoros: 0, blockedAttempts: 0 };
  todayWeekly.pomodoros += 1;
  weekly[today] = todayWeekly;

  const updated = {
    ...stats,
    todayPomodoros: (stats.todayPomodoros || 0) + 1,
    lifetimePomodoros: (stats.lifetimePomodoros || 0) + 1,
    weeklyData: weekly
  };

  await setStorage('stats', updated);
  return updated;
}

/**
 * Logs blocked distraction attempt
 */
export async function recordBlockedAttempt() {
  const stats = await getStats();
  const today = getTodayDateString();
  const weekly = stats.weeklyData || {};

  const todayWeekly = weekly[today] || { focusMinutes: 0, pomodoros: 0, blockedAttempts: 0 };
  todayWeekly.blockedAttempts += 1;
  weekly[today] = todayWeekly;

  const updated = {
    ...stats,
    todayBlockedAttempts: (stats.todayBlockedAttempts || 0) + 1,
    weeklyData: weekly
  };

  await setStorage('stats', updated);
  return updated;
}

/**
 * Generates 7-day weekly trend data array
 */
export async function getWeeklyTrend() {
  const stats = await getStats();
  const weekly = stats.weeklyData || {};
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayData = weekly[dateStamp] || { focusMinutes: 0, pomodoros: 0, blockedAttempts: 0 };

    result.push({
      dayName,
      dateStamp,
      focusMinutes: dayData.focusMinutes || 0,
      pomodoros: dayData.pomodoros || 0
    });
  }

  return result;
}
