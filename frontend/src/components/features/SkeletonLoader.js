import React from 'react';

export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return (
    <div className={`rounded ${className}`}
      style={{
        width, height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(0,212,255,0.06) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s infinite',
      }} />
  );
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <SkeletonLine width="60%" height={16} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '40%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <SkeletonLine width="45%" height={14} className="mb-4" />
      <div style={{ height, background:'rgba(255,255,255,0.02)', borderRadius:8, position:'relative', overflow:'hidden' }}>
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(90deg, transparent, rgba(0,212,255,0.04), transparent)',
          animation: 'shimmer 1.6s infinite',
          backgroundSize:'200% 100%',
        }} />
      </div>
    </div>
  );
}

export function SkeletonFeedback() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(0,212,255,0.08)' }} />
        <SkeletonLine width="30%" height={14} />
      </div>
      <div className="flex gap-4 items-center">
        <div style={{ width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.03)', flexShrink:0 }} />
        <div className="flex-1 space-y-2">
          {[80,60,90,70,50].map((w,i) => (
            <SkeletonLine key={i} width={`${w}%`} height={12} />
          ))}
        </div>
      </div>
      <SkeletonLine width="100%" height={48} />
      <div className="space-y-2">
        {[1,2,3].map(i => <SkeletonLine key={i} width={i===3?'55%':'90%'} height={12} />)}
      </div>
    </div>
  );
}
