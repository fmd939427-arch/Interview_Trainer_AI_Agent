import React, { useMemo } from 'react';

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function StreakCalendar({ activityDates = [], streak = 0 }) {
  const days = useMemo(() => getLastNDays(56), []); // 8 weeks
  const active = useMemo(() => new Set(activityDates), [activityDates]);

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Practice Streak</div>
        <div className="flex items-center gap-1">
          <span className="text-base">🔥</span>
          <span className="text-sm font-extrabold" style={{ color: streak >= 7 ? '#f97316' : streak >= 3 ? '#f59e0b' : '#94a3b8' }}>
            {streak} day{streak !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map(day => {
              const isToday = day === today;
              const practiced = active.has(day);
              return (
                <div key={day} title={day}
                  style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: practiced
                      ? 'linear-gradient(135deg,#06b6d4,#6366f1)'
                      : isToday
                        ? 'rgba(0,212,255,0.15)'
                        : 'rgba(255,255,255,0.04)',
                    border: isToday ? '1px solid rgba(0,212,255,0.4)' : 'none',
                    boxShadow: practiced ? '0 0 5px rgba(0,212,255,0.4)' : 'none',
                    cursor: 'default',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-slate-600">Less</span>
        <div className="flex gap-1">
          {['rgba(255,255,255,0.04)','rgba(0,212,255,0.2)','rgba(0,212,255,0.5)','#06b6d4'].map((c,i) => (
            <div key={i} style={{ width:10, height:10, borderRadius:2, background:c }} />
          ))}
        </div>
        <span className="text-xs text-slate-600">More</span>
      </div>
    </div>
  );
}
