import { useMemo } from 'react';

const FILLER_WORDS = ['um','uh','like','basically','literally','i think','i guess',
  'you know','kind of','sort of','actually','you see','right','okay so','well so'];

export function useFillerWords(text = '') {
  return useMemo(() => {
    if (!text) return { count: 0, words: [], wpm: 0, density: 0 };
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const found = {};
    FILLER_WORDS.forEach(f => {
      const re = new RegExp(`\\b${f.replace(/\s+/g,'\\s+')}\\b`, 'gi');
      const matches = lower.match(re) || [];
      if (matches.length) found[f] = matches.length;
    });
    const count = Object.values(found).reduce((s, v) => s + v, 0);
    const density = words.length ? Math.round((count / words.length) * 100) : 0;
    return {
      count,
      words: Object.entries(found),
      wpm: words.length, // proxy: total words (real WPM needs timing)
      density,
    };
  }, [text]);
}
