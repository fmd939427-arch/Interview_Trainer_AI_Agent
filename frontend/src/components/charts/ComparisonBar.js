import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';

const BENCHMARKS = {
  'Software Engineer': { clarity:8, confidence:7.5, specificity:8.5, ownership:8, relevance:9 },
  'Data Analyst':      { clarity:8, confidence:7,   specificity:9,   ownership:7, relevance:8.5 },
  'Product Manager':   { clarity:9, confidence:8,   specificity:8,   ownership:8, relevance:8.5 },
  'HR/Business':       { clarity:9, confidence:8.5, specificity:7.5, ownership:8.5, relevance:8 },
};
const DEFAULT_BENCH = { clarity:8, confidence:7.5, specificity:8, ownership:8, relevance:8.5 };

const DIMS = ['clarity','confidence','specificity','ownership','relevance'];
const LABELS = { clarity:'Clarity', confidence:'Confidence', specificity:'Specificity', ownership:'Ownership', relevance:'Relevance' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(2,8,23,0.95)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:10, padding:'10px 14px' }}>
      <div style={{ color:'#e2e8f0', fontSize:12, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, fontSize:11, fontWeight:600 }}>{p.name}: {p.value?.toFixed(1)}/10</div>
      ))}
    </div>
  );
};

export default function ComparisonBar({ scores, role }) {
  const bench = BENCHMARKS[role] ?? DEFAULT_BENCH;
  const data = DIMS.map(d => ({
    dim: LABELS[d],
    You: scores?.[d] ?? 0,
    Ideal: bench[d] ?? 8,
  }));

  return (
    <div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        You vs. Ideal {role ?? 'Candidate'}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top:5, right:10, bottom:5, left:0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="dim" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0,10]} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} width={22} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
          <Bar dataKey="You" fill="#22d3ee" radius={[4,4,0,0]} maxBarSize={28}
            animationDuration={900}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.You >= d.Ideal * 0.85 ? '#10b981' : d.You >= d.Ideal * 0.65 ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
          <Bar dataKey="Ideal" fill="rgba(168,85,247,0.4)" radius={[4,4,0,0]} maxBarSize={28}
            animationDuration={900} animationBegin={200} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
