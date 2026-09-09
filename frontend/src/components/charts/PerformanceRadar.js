import React, { useEffect, useRef, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const DIMS = ['Clarity','Confidence','Specificity','Ownership','Relevance'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(2,8,23,0.92)', border:'1px solid rgba(0,212,255,0.25)', borderRadius:10, padding:'10px 14px' }}>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontSize:12, fontWeight:600 }}>
          {p.name}: {p.value}/10
        </div>
      ))}
    </div>
  );
};

export default function PerformanceRadar({ scores, benchmarkScores, role }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, [scores]);

  const data = DIMS.map(d => ({
    subject: d,
    You: animated ? (scores?.[d.toLowerCase()] ?? 0) : 0,
    Ideal: animated ? (benchmarkScores?.[d.toLowerCase()] ?? 8) : 0,
  }));

  return (
    <div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Performance Radar</div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top:10, right:30, bottom:10, left:30 }}>
          <PolarGrid stroke="rgba(0,212,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill:'#94a3b8', fontSize:11, fontWeight:600 }} />
          <PolarRadiusAxis domain={[0,10]} tick={false} axisLine={false} />
          <Radar name="You" dataKey="You" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.18}
            strokeWidth={2} dot={{ fill:'#22d3ee', r:3 }}
            animationBegin={0} animationDuration={900} isAnimationActive />
          <Radar name={`Ideal (${role ?? 'Target'})`} dataKey="Ideal" stroke="#a855f7"
            fill="#a855f7" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3"
            animationBegin={200} animationDuration={900} isAnimationActive />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
