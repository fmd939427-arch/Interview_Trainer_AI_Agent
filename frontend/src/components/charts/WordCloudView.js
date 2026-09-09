import React, { useMemo } from 'react';

const FILLER_WORDS = new Set(['um','uh','like','you know','i think','i guess','basically','literally','kind of','sort of','actually','honestly','definitely','obviously','clearly','just','really','very','quite','pretty','so','well','right','okay','yeah']);
const ACTION_VERBS = new Set(['led','built','designed','implemented','improved','managed','created','developed','delivered','increased','reduced','drove','launched','scaled','architected','optimized','mentored','collaborated','resolved','analysed','analyzed','structured','deployed','automated','negotiated']);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(w => w.length > 1);
}

function countWords(answers) {
  const counts = {};
  (answers || []).forEach(a => {
    tokenize(a.userAnswer || '').forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });
  });
  return counts;
}

export default function WordCloudView({ answers }) {
  const words = useMemo(() => {
    if (!answers?.length) return [];
    const counts = countWords(answers);
    return Object.entries(counts)
      .filter(([w]) => FILLER_WORDS.has(w) || ACTION_VERBS.has(w) || counts[w] >= 3)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 40)
      .map(([word, count]) => ({
        word,
        count,
        type: FILLER_WORDS.has(word) ? 'filler' : ACTION_VERBS.has(word) ? 'action' : 'common',
      }));
  }, [answers]);

  if (!words.length) return (
    <div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Word Analysis</div>
      <div className="text-xs text-slate-500 text-center py-6">Complete answers to see word analysis</div>
    </div>
  );

  const fillerCount = words.filter(w => w.type === 'filler').reduce((s,w) => s + w.count, 0);
  const actionCount = words.filter(w => w.type === 'action').reduce((s,w) => s + w.count, 0);
  const maxCount = Math.max(...words.map(w => w.count), 1);

  const colorFor = (type) =>
    type === 'filler' ? '#ef4444' : type === 'action' ? '#10b981' : '#64748b';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Word Analysis</div>
        <div className="flex gap-3 text-xs">
          <span style={{ color:'#ef4444' }}>⚠ {fillerCount} fillers</span>
          <span style={{ color:'#10b981' }}>✓ {actionCount} action verbs</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4 rounded-xl" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', minHeight:100 }}>
        {words.map(({ word, count, type }) => {
          const size = 11 + Math.round((count / maxCount) * 14);
          const color = colorFor(type);
          return (
            <span key={word} title={`"${word}" — ${count}×`}
              style={{
                fontSize: size, color, fontWeight: type === 'action' ? 700 : type === 'filler' ? 700 : 400,
                opacity: 0.7 + (count / maxCount) * 0.3,
                textDecoration: type === 'filler' ? 'underline dotted' : 'none',
                cursor:'default',
                transition:'transform 0.2s',
              }}
              className="hover:opacity-100"
            >{word}</span>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-500">
        <span><span style={{ color:'#ef4444' }}>■</span> Filler words (avoid)</span>
        <span><span style={{ color:'#10b981' }}>■</span> Action verbs (great)</span>
        <span><span style={{ color:'#64748b' }}>■</span> High-frequency</span>
      </div>
    </div>
  );
}
