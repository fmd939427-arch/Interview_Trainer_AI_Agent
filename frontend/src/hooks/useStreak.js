import { useState, useEffect, useCallback } from 'react';

const STREAK_KEY = 'ita_streak';

function todayStr() { return new Date().toISOString().split('T')[0]; }

function loadStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"days":[],"streak":0,"lastDate":null}');
  } catch { return { days:[], streak:0, lastDate:null }; }
}

export function useStreak() {
  const [streakData, setStreakData] = useState(loadStreak);

  const recordToday = useCallback(() => {
    const today = todayStr();
    setStreakData(prev => {
      if (prev.days.includes(today)) return prev; // already recorded

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];

      const consecutive = prev.lastDate === yStr;
      const newStreak = consecutive ? prev.streak + 1 : 1;
      const next = {
        days: [...prev.days.slice(-90), today],
        streak: newStreak,
        lastDate: today,
      };
      try { localStorage.setItem(STREAK_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { ...streakData, recordToday };
}
