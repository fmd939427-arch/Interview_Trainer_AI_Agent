import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot
} from 'recharts';

const scoreColor = s => s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444';

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = scoreColor(payload.score);
  return (
    <circle cx={cx} cy={cy} r={6} fill={color} stroke="rgba(2,8,23,0.8)"
      strokeWidth={2} style={{ filter:`drop-shadow(0 0 5px ${color})` }} />
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:'rgba(2,8,23,0.95)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:10, padding:'10px 14px', maxWidth:220 }}>
      <div style={{ color:'#22d3ee', fontSize:11, fontWeight:700, marginBottom:4 }}>Q{d.index+1} — Score {d.score}/10</div>
      <div style={{ color:'#94a3b8', fontSize:11, lineHeight:1.4 }}>{d.question}</div>
      <div style={{ color: scoreColor(d.score), fontSize:10, fontWeight:600, marginTop:4 }}>{d.topic}</div>
    </div>
  );
};

export default function ProgressTimeline({ answers }) {
  if (!answers?.length) return null;

  const data = answers.map((a, i) => ({
    index: i,
    name: `Q${i+1}`,
    score: a.scores?.overall ?? 0,
    question: a.question ?? '',
    topic: a.topic ?? '',
  }));

  const avg = Math.round(data.reduce((s,d) => s + d.score, 0) / data.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Timeline</div>
        <div className="text-xs text-slate-500">Avg: <span style={{ color:'#22d3ee', fontWeight:700 }}>{avg}/10</span></div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top:10, right:16, bottom:0, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0,10]} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
          <ReferenceLine y={avg} stroke="rgba(0,212,255,0.25)" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2}
            dot={<CustomDot />} activeDot={{ r:7, fill:'#22d3ee' }}
            animationDuration={1000} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
