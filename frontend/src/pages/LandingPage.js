import React, { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';

/* ── Crystal AI SVG centerpiece ─────────────────────────────────────── */
function CrystalAI({ size = 280 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const pts = (n, radius, phase = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + phase;
      return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
    });
  const hex = pts(6, r, Math.PI / 6);
  const inner = pts(6, r * 0.52, Math.PI / 6 + Math.PI / 6);
  const poly = (p) => p.map((v) => v.join(',')).join(' ');

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-float"
      style={{ filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.5)) drop-shadow(0 0 60px rgba(99,102,241,0.3))' }}
    >
      <defs>
        <radialGradient id="cg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="40%"  stopColor="#6366f1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id="cg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#f0abfc" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
        </radialGradient>
        <linearGradient id="cgLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth="1" className="animate-crystal-spin" />
      <circle cx={cx} cy={cy} r={r + 26} fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1" strokeDasharray="4 8" className="animate-crystal-spin-rev" />

      {/* Outer hexagon face */}
      <polygon points={poly(hex)} fill="url(#cg1)" stroke="rgba(0,212,255,0.6)" strokeWidth="1.2" filter="url(#glow)" />

      {/* Inner faces — each facet */}
      {hex.map((pt, i) => {
        const next = hex[(i + 1) % hex.length];
        return (
          <polygon
            key={i}
            points={`${cx},${cy} ${pt.join(',')} ${next.join(',')}`}
            fill={i % 2 === 0 ? 'rgba(99,102,241,0.25)' : 'rgba(0,212,255,0.12)'}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Inner hexagon */}
      <polygon points={poly(inner)} fill="url(#cg2)" stroke="rgba(240,171,252,0.6)" strokeWidth="0.8" filter="url(#glow)" />

      {/* Sparkle lines from center */}
      {pts(12, r * 0.35, 0).map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]}
          stroke="url(#cgLine)" strokeWidth={i % 3 === 0 ? '1' : '0.5'} strokeOpacity={i % 3 === 0 ? '0.6' : '0.2'} />
      ))}

      {/* Core */}
      <circle cx={cx} cy={cy} r={r * 0.14} fill="rgba(0,212,255,0.9)" filter="url(#glow2)" />
      <circle cx={cx} cy={cy} r={r * 0.07} fill="#ffffff" />

      {/* Vertex dots */}
      {hex.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#22d3ee" filter="url(#glow)" opacity="0.9" />
      ))}
      {inner.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#c084fc" filter="url(#glow)" opacity="0.7" />
      ))}
    </svg>
  );
}

/* ── Floating particles ──────────────────────────────────────────────── */
function Particles({ count = 30 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top:  `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      color: ['#22d3ee','#6366f1','#a855f7','#ec4899','#67e8f9'][Math.floor(Math.random() * 5)],
      dur:   `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 8}s`,
      dx:    `${(Math.random() - 0.5) * 200}px`,
      dy:    `${(Math.random() - 0.5) * 200}px`,
    })), [count]);

  return (
    <div className="particles-container">
      {particles.map(p => (
        <div key={p.id}
          className="particle"
          style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            background: p.color,
            '--dur': p.dur, '--delay': p.delay,
            '--dx': p.dx,  '--dy': p.dy,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Feature card data ───────────────────────────────────────────────── */
const features = [
  { icon: '🎯', title: 'Role-Specific Questions', color: '#22d3ee',
    desc: 'Tailored question sets for Software Engineers, Data Analysts, Product Managers, and more.' },
  { icon: '🤖', title: 'AI-Powered Feedback',    color: '#a855f7',
    desc: 'IBM Granite evaluates your answers on clarity, confidence, specificity, ownership, and relevance.' },
  { icon: '📈', title: 'Track Your Growth',       color: '#ec4899',
    desc: 'See your scores improve across sessions with detailed rubric breakdowns and actionable tips.' },
  { icon: '🧠', title: 'Technical + Behavioral',  color: '#6366f1',
    desc: 'Toggle between deep technical drills and STAR-framework behavioral scenarios.' },
];

const steps = [
  { step: '01', title: 'Set Your Profile',  icon: '👤', desc: 'Enter your name, target role, and experience level.' },
  { step: '02', title: 'Practice Questions',icon: '💬', desc: 'Answer tailored interview questions one at a time.' },
  { step: '03', title: 'Get AI Feedback',   icon: '🤖', desc: 'Receive scores, model answers, and improvement tips instantly.' },
  { step: '04', title: 'Review & Improve',  icon: '📊', desc: 'Study your summary report and practice again to level up.' },
];

const STATS = [['50+','Interview Questions'],['4 Roles','Supported'],['5 Dimensions','AI Rubric']];

/* ── Main component ──────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { setDark, dark } = useTheme();
  const heroRef = useRef(null);

  // Subtle parallax on hero on mousemove
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handler = (e) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = ((e.clientX - left) / width  - 0.5) * 16;
      const y = ((e.clientY - top)  / height - 0.5) * 10;
      el.style.setProperty('--px', `${x}px`);
      el.style.setProperty('--py', `${y}px`);
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020817' }}>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo crystal */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)', boxShadow: '0 0 16px rgba(0,212,255,0.5)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <polygon points="10,1 19,7 19,13 10,19 1,13 1,7" fill="none" stroke="white" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Interview Trainer <span className="neon-cyan">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDark(!dark)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => navigate('/onboarding')} className="btn-primary py-2 px-5 text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden scan-lines pt-16">
        {/* Deep space background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0a1628 0%, #020817 100%)',
        }} />

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-orb-drift"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full animate-orb-drift"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '4s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        <Particles count={35} />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Content grid */}
        <div className="relative max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-300 text-sm font-medium">Powered by IBM Granite AI</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 animate-slide-up">
              <span className="text-white">Ace Your</span><br />
              <span className="text-shimmer">Next Interview</span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
              AI-powered practice with real-time feedback, model answers, and personalized coaching — for every role and every level.
            </p>

            <div className="flex flex-wrap gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button onClick={() => navigate('/onboarding')}
                className="btn-primary text-base px-8 py-4">
                Start Practicing Free →
              </button>
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-base px-8 py-4">
                See How It Works
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {STATS.map(([val, label]) => (
                <div key={label}>
                  <div className="text-2xl font-extrabold neon-cyan">{val}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Crystal AI */}
          <div className="flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative">
              {/* Outer glow halo */}
              <div className="absolute inset-0 rounded-full animate-glow-pulse"
                style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)', transform: 'scale(1.4)' }} />
              <CrystalAI size={300} />
              {/* Orbiting label chips */}
              {[
                { label: 'IBM Granite', color: '#22d3ee', angle: -30, radius: 160 },
                { label: 'STAR Behavioral', color: '#a855f7', angle: 120, radius: 155 },
                { label: '5D Scoring',  color: '#ec4899', angle: 240, radius: 152 },
              ].map(({ label, color, angle, radius }) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <div key={label}
                    style={{
                      position: 'absolute',
                      left: 150 + Math.cos(rad) * radius,
                      top:  150 + Math.sin(rad) * radius,
                      transform: 'translate(-50%,-50%)',
                      background: 'rgba(2,8,23,0.85)',
                      border: `1px solid ${color}40`,
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 0 12px ${color}30`,
                    }}>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
          <span className="text-xs text-slate-500">Scroll to explore</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative" style={{ background: '#030c1a' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 70%)',
        }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="badge badge-cyan mb-4">CAPABILITIES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to{' '}
              <span className="neon-purple">interview with confidence</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From technical deep-dives to behavioral mastery — the AI coach that never sleeps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="card p-7 group cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${f.color}14`, border: `1px solid ${f.color}30` }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 relative" style={{ background: '#020817' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge badge-purple mb-4">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Four steps to interview mastery</h2>
            <p className="text-slate-400 text-lg">Setup to results in under 10 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px z-0"
                    style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.4), rgba(139,92,246,0.2))' }} />
                )}
                <div className="card p-6 relative z-10 h-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(0,212,255,0.2)' }}>
                    {s.icon}
                  </div>
                  <div className="text-xs font-bold text-cyan-500 mb-1 tracking-widest">{s.step}</div>
                  <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-12 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(99,102,241,0.18), rgba(168,85,247,0.12))', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />
            <Particles count={15} />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to land your <span className="text-shimmer">dream job?</span>
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                Start your personalized AI interview session now — no account required.
              </p>
              <button onClick={() => navigate('/onboarding')} className="btn-primary text-base px-10 py-4">
                🚀 Get Started Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 text-center text-sm text-slate-600"
        style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
        Interview Trainer AI — Powered by{' '}
        <span className="text-cyan-600">IBM Granite</span> &amp;{' '}
        <span className="text-purple-600">watsonx.ai</span>
      </footer>
    </div>
  );
}
