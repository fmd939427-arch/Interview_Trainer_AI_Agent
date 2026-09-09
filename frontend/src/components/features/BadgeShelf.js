import React, { useMemo } from 'react';

const ALL_BADGES = [
  { id:'first_session',  icon:'🎯', name:'First Step',       desc:'Completed your first session',              check: (s) => s.sessions >= 1 },
  { id:'five_sessions',  icon:'🔥', name:'5 Sessions',       desc:'Completed 5 sessions',                      check: (s) => s.sessions >= 5 },
  { id:'ten_sessions',   icon:'💎', name:'10 Sessions',      desc:'Completed 10 sessions',                     check: (s) => s.sessions >= 10 },
  { id:'star_master',    icon:'⭐', name:'STAR Master',       desc:'Used STAR structure 3+ times',              check: (s) => s.starAnswers >= 3 },
  { id:'no_fillers',     icon:'🎙️', name:'Zero Fillers',    desc:'Completed a session with 0 filler words',   check: (s) => s.noFillerSession },
  { id:'perfect_score',  icon:'🏆', name:'Perfect 10',       desc:'Scored 10/10 on any dimension',             check: (s) => s.hasPerfect10 },
  { id:'action_hero',    icon:'⚡', name:'Action Hero',      desc:'Used 5+ unique action verbs in one session',check: (s) => s.actionVerbs >= 5 },
  { id:'streak_3',       icon:'🌊', name:'3-Day Streak',     desc:'Practiced 3 days in a row',                 check: (s) => s.streak >= 3 },
  { id:'streak_7',       icon:'🚀', name:'7-Day Streak',     desc:'Practiced 7 days in a row',                 check: (s) => s.streak >= 7 },
  { id:'high_scorer',    icon:'📊', name:'High Scorer',      desc:'Averaged 8+ across a full session',         check: (s) => s.bestAvg >= 8 },
  { id:'mock_complete',  icon:'🎭', name:'Mock Champion',    desc:'Completed a full Mock Interview session',   check: (s) => s.mockComplete },
  { id:'jd_mode',        icon:'📋', name:'JD Hunter',        desc:'Practised with a custom Job Description',   check: (s) => s.usedJD },
];

function BadgeTile({ badge, earned }) {
  return (
    <div title={badge.desc} className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
      style={{
        background: earned ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${earned ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
        opacity: earned ? 1 : 0.35,
        filter: earned ? 'none' : 'grayscale(1)',
        cursor: 'default',
      }}>
      <span style={{ fontSize: 22 }}>{badge.icon}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: earned ? '#22d3ee' : '#475569', textAlign:'center', lineHeight:1.2 }}>
        {badge.name}
      </span>
    </div>
  );
}

export default function BadgeShelf({ stats }) {
  const earned = useMemo(() =>
    new Set(ALL_BADGES.filter(b => b.check(stats || {})).map(b => b.id)),
  [stats]);

  const earnedCount = earned.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievement Badges</div>
        <div className="text-xs text-slate-500">{earnedCount}/{ALL_BADGES.length} unlocked</div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {ALL_BADGES.map(b => <BadgeTile key={b.id} badge={b} earned={earned.has(b.id)} />)}
      </div>
    </div>
  );
}
