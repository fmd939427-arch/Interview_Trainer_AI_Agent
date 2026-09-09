import React from 'react';

const CATEGORIES = ['System Design','Communication','Leadership','Problem Solving','Behavioral','Technical'];
const DIMS = ['Clarity','Confidence','Specificity'];

function lerp(a, b, t) { return a + (b - a) * t; }
function scoreToColor(score) {
  // 0→dark red, 5→amber, 10→cyan
  if (score === null) return 'rgba(255,255,255,0.03)';
  const t = score / 10;
  if (t < 0.5) {
    const tt = t / 0.5;
    return `rgba(${Math.round(lerp(239,245,tt))},${Math.round(lerp(68,158,tt))},${Math.round(lerp(68,11,tt))},0.7)`;
  }
  const tt = (t - 0.5) / 0.5;
  return `rgba(${Math.round(lerp(245,34,tt))},${Math.round(lerp(158,211,tt))},${Math.round(lerp(11,238,tt))},0.7)`;
}

export default function SkillHeatmap({ answers }) {
  // Build category×dimension matrix from answers
  const matrix = {};
  CATEGORIES.forEach(c => { matrix[c] = {}; DIMS.forEach(d => { matrix[c][d] = null; }); });

  if (answers?.length) {
    answers.forEach((a, i) => {
      // Map questions to categories heuristically
      const cat = CATEGORIES[i % CATEGORIES.length];
      DIMS.forEach(d => {
        const key = d.toLowerCase();
        const v = a.scores?.[key];
        if (v !== undefined) {
          if (matrix[cat][d] === null) matrix[cat][d] = v;
          else matrix[cat][d] = (matrix[cat][d] + v) / 2;
        }
      });
    });
  }

  return (
    <div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skill Heatmap</div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:3 }}>
          <thead>
            <tr>
              <th style={{ width:110, textAlign:'left', fontSize:10, color:'#64748b', fontWeight:600, paddingBottom:4 }}>Category</th>
              {DIMS.map(d => (
                <th key={d} style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textAlign:'center', paddingBottom:4 }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => (
              <tr key={cat}>
                <td style={{ fontSize:10, color:'#64748b', paddingRight:8, paddingBottom:3, whiteSpace:'nowrap' }}>{cat}</td>
                {DIMS.map(d => {
                  const v = matrix[cat][d];
                  return (
                    <td key={d} title={v !== null ? `${d}: ${v.toFixed(1)}/10` : 'No data'}
                      style={{
                        background: scoreToColor(v),
                        borderRadius:5, height:28, width:'100%',
                        textAlign:'center', fontSize:9, color:'rgba(255,255,255,0.8)',
                        fontWeight:700, cursor:'default', transition:'background 0.3s',
                      }}>
                      {v !== null ? v.toFixed(1) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-500">Low</span>
        <div style={{ flex:1, height:6, borderRadius:3, background:'linear-gradient(90deg,rgba(239,68,68,0.7),rgba(245,158,11,0.7),rgba(34,211,238,0.7))' }} />
        <span className="text-xs text-slate-500">High</span>
      </div>
    </div>
  );
}
