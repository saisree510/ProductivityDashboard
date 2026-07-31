import { getStats, getWeeklyTrend } from '../services/statsService.js';
import { onStorageChange } from '../services/storage.js';

/**
 * Initializes the Statistics Tracker Widget Component
 */
export async function initStatsWidget(containerEl) {
  if (!containerEl) return;

  const stats = await getStats();
  const trend = await getWeeklyTrend();
  renderWidget(containerEl, stats, trend);

  // Subscribe to storage changes
  onStorageChange(async (changes) => {
    if (changes.stats) {
      const updatedStats = await getStats();
      const updatedTrend = await getWeeklyTrend();
      renderWidget(containerEl, updatedStats, updatedTrend);
    }
  });
}

function renderWidget(containerEl, stats, trend) {
  const focusTimeDisplay = formatFocusTime(stats.todayFocusMinutes || 0);
  const pomodoros = stats.todayPomodoros || 0;
  const blockedAttempts = stats.todayBlockedAttempts || 0;

  const maxMins = Math.max(1, ...trend.map(t => t.focusMinutes));

  containerEl.innerHTML = `
    <div class="glass-card stats-card">
      <div class="stats-header">
        <span class="stats-title">Focus Statistics</span>
        <span style="font-size: 0.72rem; color: var(--text-muted);">Today</span>
      </div>

      <div class="stats-metrics-grid">
        <div class="stats-metric-card">
          <span class="stats-metric-value">${focusTimeDisplay}</span>
          <span class="stats-metric-label">Focus Time</span>
        </div>
        <div class="stats-metric-card">
          <span class="stats-metric-value">${pomodoros}</span>
          <span class="stats-metric-label">Pomodoros</span>
        </div>
        <div class="stats-metric-card">
          <span class="stats-metric-value">${blockedAttempts}</span>
          <span class="stats-metric-label">Blocked Sites</span>
        </div>
      </div>

      <div class="stats-chart-wrapper">
        <span class="stats-chart-title">Weekly Trend (Minutes)</span>
        <div class="stats-bars-container">
          ${trend.map(day => {
            const heightPct = Math.max(8, Math.round((day.focusMinutes / maxMins) * 100));
            return `
              <div class="stats-bar-col" title="${day.dateStamp}: ${day.focusMinutes} focus mins">
                <div class="stats-bar-fill" style="height: ${heightPct}%;"></div>
                <span class="stats-bar-day">${day.dayName}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function formatFocusTime(totalMinutes) {
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = (totalMinutes / 60).toFixed(1);
  return `${hours}h`;
}
