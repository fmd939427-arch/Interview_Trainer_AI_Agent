import React, { useState } from 'react';
import ScoreRing from '../ScoreRing';

const DIM_META = {
  clarity:     { label:'Clarity',     icon:'💡', color:'#22d3ee' },
  confidence:  { label:'Confidence',  icon:'💪', color:'#a855f7' },
  specificity: { label:'Specificity', icon:'🎯', color:'#f97316' },
  ownership:   { label:'Ownership',   icon:'🙋', color:'#ec4899' },
  relevance:   { label:'Relevance',   icon:'🔗', color:'#10b981' },
};

function ReplayItem({ item, index, expanded, onToggle }) {
  const score = item.scores?.overall ?? 0;
  const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-12 bottom-0 w-px" style={{ background:'rgba(0,212,255,0.1)' }} />

      <div className="flex gap-4">
        {/* Index bubble */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10"
          style={{ background:`${scoreColor}18`, border:`2px solid ${scoreColor}`, color:scoreColor, boxShadow:`0 0 10px ${scoreColor}30` }}>
          {index + 1}
        </div>

        <div className="flex-1 mb-4">
          <button onClick={onToggle} className="w-full text-left card p-4 hover:border-cyan-500/30 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">{item.topic || `Question ${index+1}`}</div>
                <div className="text-sm font-medium text-white leading-snug line-clamp-2">{item.question}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-extrabold" style={{ color: scoreColor }}>{score}</span>
                <span className="text-xs text-slate-500">/10</span>
                <span className="text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
              </div>
            </div>
          </button>

          {expanded && (
            <div className="mt-2 space-y-3 pl-1 animate-slide-up">
              {/* Scores row */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(DIM_META).map(([k, m]) => (
                  <div key={k} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background:`${m.color}10`, border:`1px solid ${m.color}25` }}>
                    <span style={{ fontSize:10 }}>{m.icon}</span>
                    <span style={{ fontSize:10, color:m.color, fontWeight:700 }}>{item.scores?.[k] ?? '—'}</span>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="card p-3">
                  <div className="text-xs font-bold text-slate-400 mb-1.5">Your Answer</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.userAnswer}</p>
                </div>
                <div className="card p-3" style={{ border:'1px solid rgba(16,185,129,0.15)', background:'rgba(16,185,129,0.03)' }}>
                  <div className="text-xs font-bold text-slate-400 mb-1.5">Model Answer</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.modelAnswer}</p>
                </div>
              </div>

              {item.tips?.length > 0 && (
                <div className="card p-3">
                  <div className="text-xs font-bold text-slate-400 mb-1.5">💡 Tips</div>
                  <ul className="space-y-1">
                    {item.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="neon-cyan font-bold flex-shrink-0">{i+1}.</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionReplay({ answers }) {
  const [expanded, setExpanded] = useState(null);

  if (!answers?.length) return null;

  return (
    <div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Session Replay</div>
      <div className="space-y-0">
        {answers.map((item, i) => (
          <ReplayItem key={i} item={item} index={i}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)} />
        ))}
      </div>
    </div>
  );
}
