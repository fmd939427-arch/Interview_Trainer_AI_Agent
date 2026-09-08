import React, { useEffect, useRef } from 'react';

const SCORE_GRADIENTS = {
  excellent: ['#22d3ee', '#6366f1'],
  good:      ['#a855f7', '#6366f1'],
  fair:      ['#f59e0b', '#f97316'],
  poor:      ['#ef4444', '#ec4899'],
};

function getGradientId(score, id) {
  if (score >= 8) return `sg-exc-${id}`;
  if (score >= 6) return `sg-good-${id}`;
  if (score >= 4) return `sg-fair-${id}`;
  return `sg-poor-${id}`;
}

function getColors(score) {
  if (score >= 8) return SCORE_GRADIENTS.excellent;
  if (score >= 6) return SCORE_GRADIENTS.good;
  if (score >= 4) return SCORE_GRADIENTS.fair;
  return SCORE_GRADIENTS.poor;
}

export default function ScoreRing({ score, size = 100, id = 'ring', label = '' }) {
  const strokeWidth = Math.max(6, size * 0.09);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 10) / 10) * circumference;
  const cx = size / 2, cy = size / 2;
  const gradId = getGradientId(score, id);
  const [c1, c2] = getColors(score);
  const scoreLabel = score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Needs Work';
  const circleRef = useRef(null);

  // Animate on mount
  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.strokeDashoffset = offset;
    });
  }, [score, circumference, offset]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <filter id={`gf-${id}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />

          {/* Glow arc (behind) */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={c1} strokeWidth={strokeWidth + 4} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            opacity="0.15" filter={`url(#gf-${id})`} />

          {/* Main arc */}
          <circle ref={circleRef} cx={cx} cy={cy} r={radius} fill="none"
            stroke={`url(#${gradId})`} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference} />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-extrabold leading-none" style={{
            fontSize: size * 0.26,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>{score}</span>
          <span className="text-slate-500 font-medium" style={{ fontSize: size * 0.11 }}>/10</span>
        </div>
      </div>

      {/* Labels */}
      <div className="text-center">
        {label && <div className="text-xs text-slate-400 font-medium">{label}</div>}
        <div className="text-xs font-bold" style={{ color: c1 }}>{scoreLabel}</div>
      </div>
    </div>
  );
}
