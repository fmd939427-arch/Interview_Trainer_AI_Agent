import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ita_achievements';

const DEFAULT_STATS = {
  sessions: 0, starAnswers: 0, noFillerSession: false,
  hasPerfect10: false, actionVerbs: 0, streak: 0,
  bestAvg: 0, mockComplete: false, usedJD: false,
};

function load() {
  try { return { ...DEFAULT_STATS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...DEFAULT_STATS }; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useAchievements() {
  const [stats, setStats] = useState(load);

  const update = useCallback((patch) => {
    setStats(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  // Record a completed session
  const recordSession = useCallback(({ answers = [], isMock = false, usedJD = false, averageScore = 0 }) => {
    const FILLER_WORDS = new Set(['um','uh','like','basically','literally','i think','i guess','you know']);
    const ACTION_VERBS = new Set(['led','built','designed','implemented','improved','managed','created','developed','delivered','increased','reduced','drove','launched','scaled','optimized','mentored']);

    let fillerCount = 0;
    let actionVerbSet = new Set();
    let starCount = 0;
    let hasPerfect10 = false;

    answers.forEach(a => {
      const words = (a.userAnswer || '').toLowerCase().split(/\s+/);
      words.forEach(w => {
        if (FILLER_WORDS.has(w)) fillerCount++;
        if (ACTION_VERBS.has(w)) actionVerbSet.add(w);
      });
      if ((a.userAnswer || '').match(/situation|task|action|result/i)) starCount++;
      Object.values(a.scores || {}).forEach(v => { if (v === 10) hasPerfect10 = true; });
    });

    setStats(prev => {
      const next = {
        ...prev,
        sessions: prev.sessions + 1,
        starAnswers: prev.starAnswers + starCount,
        noFillerSession: fillerCount === 0 ? true : prev.noFillerSession,
        hasPerfect10: hasPerfect10 || prev.hasPerfect10,
        actionVerbs: Math.max(prev.actionVerbs, actionVerbSet.size),
        bestAvg: Math.max(prev.bestAvg, averageScore),
        mockComplete: isMock || prev.mockComplete,
        usedJD: usedJD || prev.usedJD,
      };
      save(next);
      return next;
    });
  }, []);

  return { stats, update, recordSession };
}
