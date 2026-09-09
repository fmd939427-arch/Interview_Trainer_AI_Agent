import React, { useEffect, useRef } from 'react';

/* Speedometer-style SVG gauge, 0–100 readiness score */
export default function ConfidenceGauge({ score = 0, size = 180, label = 'Readiness' }) {
  const prevRef = useRef(0);
  const animRef = useRef(null);
  const arcRef = useRef(null);
  const textRef = useRef(null);

  const cx = size / 2, cy = size * 0.62;
  const R = size * 0.40;
  const strokeW = size * 0.08;
  const startAngle = -210, endAngle = 30; // degrees, counter-clockwise
  const totalArc = endAngle - startAngle; // 240 degrees
  const circumference = (totalArc / 360) * 2 * Math.PI * R;

  function polarToXY(angleDeg, r) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcPath(fromDeg, toDeg, r) {
    const [x1, y1] = polarToXY(fromDeg, r);
    const [x2, y2] = polarToXY(toDeg, r);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const scoreColor = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    if (!arcRef.current || !textRef.current) return;
    const from = prevRef.current;
    const to = Math.min(100, Math.max(0, score));
    prevRef.current = to;
    const start = performance.now();
    const dur = 1000;
    cancelAnimationFrame(animRef.current);
    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      const endDeg = startAngle + (current / 100) * totalArc;
      arcRef.current.setAttribute('d', arcPath(startAngle, endDeg, R));
      textRef.current.textContent = Math.round(current);
      arcRef.current.setAttribute('stroke', scoreColor);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    }
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line
  }, [score]);

  const scoreLabel = score >= 70 ? 'Interview Ready' : score >= 45 ? 'Developing' : 'Keep Practicing';
  const needleDeg = startAngle + (Math.min(100, Math.max(0, score)) / 100) * totalArc;
  const [nx, ny] = polarToXY(needleDeg, R * 0.68);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`} style={{ overflow:'visible' }}>
        <defs>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path d={arcPath(startAngle, endAngle, R)} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} strokeLinecap="round" />
        {/* Tick marks */}
        {[0,25,50,75,100].map(v => {
          const deg = startAngle + (v / 100) * totalArc;
          const [ox,oy] = polarToXY(deg, R + strokeW * 0.8);
          const [ix,iy] = polarToXY(deg, R + strokeW * 0.2);
          return <line key={v} x1={ix} y1={iy} x2={ox} y2={oy}
            stroke="rgba(255,255,255,0.15)" strokeWidth={v%50===0?2:1} />;
        })}
        {/* Score arc */}
        <path ref={arcRef} d={arcPath(startAngle, startAngle, R)} fill="none"
          stroke={scoreColor} strokeWidth={strokeW} strokeLinecap="round"
          filter="url(#gaugeGlow)" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="white" strokeWidth={2} strokeLinecap="round"
          style={{ filter:'drop-shadow(0 0 4px rgba(255,255,255,0.6))' }} />
        <circle cx={cx} cy={cy} r={strokeW * 0.4} fill="#1e293b"
          stroke={scoreColor} strokeWidth={2} />
        {/* Center score */}
        <text ref={textRef} x={cx} y={cy * 0.7} textAnchor="middle"
          fill={scoreColor} fontSize={size * 0.22} fontWeight={800}
          fontFamily="Inter,system-ui,sans-serif">0</text>
        <text x={cx} y={cy * 0.7 + size * 0.1} textAnchor="middle"
          fill="#64748b" fontSize={size * 0.07} fontFamily="Inter,system-ui,sans-serif">/100</text>
      </svg>
      <div className="text-xs font-bold mt-1" style={{ color: scoreColor }}>{scoreLabel}</div>
    </div>
  );
}
