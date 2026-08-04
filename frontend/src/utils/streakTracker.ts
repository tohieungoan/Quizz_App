/**
 * Streak & Activity Tracker Utility
 * Tracks daily user activities:
 * - Submitting exams
 * - Joining live quiz rooms
 * - Staying active on the web app for 10 cumulative minutes (600s) per day
 */

import { apiClient } from '@/services/apiClient';

const DATES_KEY = 'quizzapp_daily_activity_dates';
const TODAY_DATE_KEY = 'quizzapp_today_date';
const TODAY_SECONDS_KEY = 'quizzapp_today_active_seconds';
const MIN_ACTIVE_SECONDS = 600; // 10 minutes

export const getDailyActivityDates = (): string[] => {
  try {
    const raw = localStorage.getItem(DATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse daily activity dates:", e);
    return [];
  }
};

export const recordDailyActivity = (dateStr?: string): void => {
  try {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const existing = getDailyActivityDates();
    if (!existing.includes(targetDate)) {
      existing.push(targetDate);
      localStorage.setItem(DATES_KEY, JSON.stringify(existing));

      // Call backend API to increment study_streak in DB
      apiClient.post('/users/me/streak', {}).catch(err => {
        // Silently catch if unauthenticated
      });
    }
  } catch (e) {
    console.error("Failed to record daily activity date:", e);
  }
};

let timerId: ReturnType<typeof setInterval> | null = null;

export const initTimeTracker = (): void => {
  if (timerId) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem(TODAY_DATE_KEY);

  if (lastDate !== todayStr) {
    localStorage.setItem(TODAY_DATE_KEY, todayStr);
    localStorage.setItem(TODAY_SECONDS_KEY, '0');
  }

  timerId = setInterval(() => {
    // Only track if document is visible
    if (document.hidden) return;

    try {
      const currentSeconds = parseInt(localStorage.getItem(TODAY_SECONDS_KEY) || '0', 10);
      const updatedSeconds = currentSeconds + 5;
      localStorage.setItem(TODAY_SECONDS_KEY, updatedSeconds.toString());

      // If cumulative active time reaches 10 minutes (600s), mark today's activity & update DB
      if (updatedSeconds >= MIN_ACTIVE_SECONDS) {
        recordDailyActivity(todayStr);
      }
    } catch (e) {
      console.error("Error updating active seconds:", e);
    }
  }, 5000);
};
