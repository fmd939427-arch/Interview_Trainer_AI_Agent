import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useTheme } from '../App';
import { createSession, parseJobDesc } from '../utils/api';

const ROLES = ['Software Engineer', 'Data Analyst', 'Product Manager', 'HR/Business'];
const LEVELS = ['Entry', 'Mid', 'Senior'];
const LEVEL_DESCRIPTIONS = {
  Entry: '0–2 years • Fundamentals & core concepts',
  Mid:   '2–5 years • Applied experience & ownership',
  Senior:'5+ years • Leadership & system design',
};
const LEVEL_COLORS = { Entry: '#22d3ee', Mid: '#a855f7', Senior: '#ec4899' };

const PERSONAS = [
  { id:'friendly_hr',  icon:'😊', name:'Friendly HR',           desc:'Warm, conversational — focuses on culture fit and soft skills.' },
  { id:'strict_tech',  icon:'⚡', name:'Strict Tech Lead',      desc:'Direct, no-nonsense — deep technical depth and precision required.' },
  { id:'startup_ceo',  icon:'🚀', name:'Startup Founder',       desc:'Fast-paced — big-picture thinking and bias for action.' },
];

const INTERVIEW_MODES = [
  { id:'practice', icon:'📚', name:'Practice Mode',   desc:'Feedback after every answer. Best for learning.' },
  { id:'mock',     icon:'🎭', name:'Mock Interview',  desc:'All questions upfront, feedback revealed at the end. Simulates a real interview.' },
];

function GlassNav({ onBack, dark, setDark }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass-nav">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#06b6d4,#6366f1)', boxShadow:'0 0 12px rgba(0,212,255,0.4)' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,7 19,13 10,19 1,13 1,7" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-white tracking-tight">Interview Trainer <span className="neon-cyan">AI</span></span>
        </button>
        <button onClick={() => setDark(!dark)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</div>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();
  const [form, setForm] = useState({ name:'', role:ROLES[0], customRole:'', level:'Mid' });
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New options
  const [interviewMode, setInterviewMode] = useState('practice');
  const [persona, setPersona] = useState('friendly_hr');
  const [jdMode, setJdMode] = useState(false);
  const [jdText, setJdText] = useState('');
  const [jdParsing, setJdParsing] = useState(false);
  const [jdResult, setJdResult] = useState(null);

  const onDrop = useCallback((accepted) => {
    const file = accepted[0];
    if (!file) return;
    setResumeFile(file);
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => setResumeText(e.target.result);
      reader.readAsText(file);
    } else {
      setResumeText(`[Uploaded: ${file.name}]`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleParseJD = async () => {
    if (!jdText.trim() || jdText.length < 20) return;
    setJdParsing(true);
    try {
      const result = await parseJobDesc(jdText);
      setJdResult(result);
      if (result.detectedRole) setForm(f => ({ ...f, role: result.detectedRole }));
    } catch {
      setError('JD parsing failed — you can still continue manually.');
    } finally {
      setJdParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    setError('');
    setLoading(true);
    try {
      const role = form.customRole.trim() || form.role;
      const { sessionId } = await createSession({ name: form.name.trim(), role, level: form.level, resumeText });
      navigate('/session', {
        state: {
          sessionId, name: form.name.trim(), role, level: form.level,
          interviewMode, persona,
          jdQuestions: jdResult?.questions || null,
          usedJD: jdMode && !!jdResult,
        }
      });
    } catch {
      setError('Could not connect to server. Is the backend running on port 4000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020817' }}>
      <GlassNav onBack={() => navigate('/')} dark={dark} setDark={setDark} />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex:0 }}>
        <div className="absolute top-1/4 -right-40 w-80 h-80 rounded-full animate-orb-drift"
          style={{ background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter:'blur(60px)' }} />
        <div className="absolute bottom-1/4 -left-40 w-96 h-96 rounded-full animate-orb-drift"
          style={{ background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', filter:'blur(60px)', animationDelay:'5s' }} />
        <div className="absolute inset-0" style={{
          backgroundImage:'linear-gradient(rgba(0,212,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.015) 1px, transparent 1px)',
          backgroundSize:'60px 60px',
        }} />
      </div>

      <main className="relative flex-1 flex items-start justify-center px-6 pt-24 pb-16" style={{ zIndex:1 }}>
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center justify-center mb-5">
              <svg width="64" height="64" viewBox="0 0 64 64" className="animate-float"
                style={{ filter:'drop-shadow(0 0 12px rgba(0,212,255,0.6))' }}>
                <polygon points="32,4 60,22 60,42 32,60 4,42 4,22" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                <polygon points="32,4 60,22 60,42 32,60 4,42 4,22" fill="url(#ogr2)" opacity="0.3" />
                <circle cx="32" cy="32" r="6" fill="#22d3ee" opacity="0.8" />
                <defs>
                  <radialGradient id="ogr2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Configure Your <span className="text-shimmer">Session</span></h1>
            <p className="text-slate-400 mt-2">Tell us about yourself — we'll tailor every question to your profile.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up" style={{ animationDelay:'0.1s' }}>

            {/* ── Profile ─────────────────────────────────────────── */}
            <SectionCard title="Your Profile">
              <div className="space-y-4">
                <input type="text" placeholder="Your name (e.g. Alex Johnson)"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field" required />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <select value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value, customRole:'' }))}
                      className="input-field"
                      style={{ appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2367e8f9' strokeWidth='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 1rem center' }}>
                      {ROLES.map(r => <option key={r} value={r} style={{ background:'#0a1628' }}>{r}</option>)}
                    </select>
                  </div>
                  <input type="text" placeholder="Custom role (optional)"
                    value={form.customRole} onChange={e => setForm(f => ({ ...f, customRole: e.target.value }))}
                    className="input-field flex-1 text-sm" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map(lvl => {
                    const active = form.level === lvl;
                    const color = LEVEL_COLORS[lvl];
                    return (
                      <button key={lvl} type="button"
                        onClick={() => setForm(f => ({ ...f, level: lvl }))}
                        className="relative p-3 rounded-xl text-left transition-all duration-200"
                        style={{ background: active ? `${color}12` : 'rgba(255,255,255,0.02)', border:`1.5px solid ${active ? color : 'rgba(255,255,255,0.08)'}`, boxShadow: active ? `0 0 16px ${color}25` : 'none' }}>
                        {active && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: color }}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                        <div className="font-bold text-sm mb-0.5" style={{ color: active ? color : '#94a3b8' }}>{lvl}</div>
                        <div className="text-xs text-slate-500 leading-snug">{LEVEL_DESCRIPTIONS[lvl]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            {/* ── Interview Mode ───────────────────────────────── */}
            <SectionCard title="Interview Mode">
              <div className="grid grid-cols-2 gap-3">
                {INTERVIEW_MODES.map(m => {
                  const active = interviewMode === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setInterviewMode(m.id)}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{ background: active ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)', border:`1.5px solid ${active ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: active ? '0 0 16px rgba(0,212,255,0.15)' : 'none' }}>
                      <div className="text-xl mb-2">{m.icon}</div>
                      <div className="font-bold text-sm text-white mb-1">{m.name}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* ── Interviewer Persona ──────────────────────────── */}
            <SectionCard title="Interviewer Persona">
              <div className="grid grid-cols-3 gap-3">
                {PERSONAS.map(p => {
                  const active = persona === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setPersona(p.id)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{ background: active ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)', border:`1.5px solid ${active ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
                      <div className="text-xl mb-1.5">{p.icon}</div>
                      <div className="font-bold text-xs text-white mb-0.5">{p.name}</div>
                      <div className="text-xs text-slate-500 leading-tight">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* ── Job Description Mode ─────────────────────────── */}
            <SectionCard title="Job Description (optional)">
              <div className="flex items-center gap-3 mb-3">
                <button type="button"
                  onClick={() => setJdMode(v => !v)}
                  className="flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: jdMode ? '#22d3ee' : '#64748b' }}>
                  <div className="w-9 h-5 rounded-full transition-all relative flex-shrink-0"
                    style={{ background: jdMode ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)', border:`1px solid ${jdMode ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                      style={{ background: jdMode ? '#22d3ee' : '#475569', left: jdMode ? '18px' : '2px', boxShadow: jdMode ? '0 0 8px rgba(0,212,255,0.6)' : 'none' }} />
                  </div>
                  Paste a job description for hyper-targeted questions
                </button>
              </div>

              {jdMode && (
                <div className="space-y-3 animate-slide-up">
                  <textarea value={jdText} onChange={e => setJdText(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={5} className="input-field resize-none text-sm" />
                  <div className="flex gap-3 items-center">
                    <button type="button" onClick={handleParseJD}
                      disabled={jdParsing || jdText.length < 20}
                      className="btn-secondary py-2 px-4 text-sm">
                      {jdParsing ? '⏳ Analysing…' : '🔍 Extract Requirements'}
                    </button>
                    {jdResult && (
                      <div className="flex flex-wrap gap-1.5">
                        {jdResult.keywords?.slice(0,4).map(k => (
                          <span key={k} className="badge badge-cyan text-xs">{k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {jdResult && (
                    <div className="text-xs text-green-400 flex items-center gap-1">
                      ✓ Detected: <span className="font-bold">{jdResult.detectedRole}</span> • {jdResult.questions?.length} targeted questions ready
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── Resume Upload ────────────────────────────────── */}
            <SectionCard title="Resume (optional)">
              <div {...getRootProps()}
                className="rounded-xl p-5 text-center cursor-pointer transition-all duration-200"
                style={{ border:`2px dashed ${isDragActive ? 'rgba(0,212,255,0.7)' : 'rgba(0,212,255,0.2)'}`, background: isDragActive ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.01)' }}>
                <input {...getInputProps()} />
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-cyan-400 text-xl">✅</span>
                    <span className="font-medium text-sm text-cyan-300">{resumeFile.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setResumeFile(null); setResumeText(''); }}
                      className="text-slate-500 hover:text-red-400 text-xs ml-2 transition-colors">✕</button>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-1.5">📄</div>
                    <p className="text-sm text-slate-400">{isDragActive ? 'Drop here' : 'Drag & drop your resume'}</p>
                    <p className="text-xs text-slate-600 mt-0.5">PDF or TXT • Max 5MB</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#fca5a5' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Launching Session…
                </span>
              ) : `🚀 Start ${interviewMode === 'mock' ? 'Mock Interview' : 'Practice Session'}`}
            </button>

            <p className="text-center text-xs text-slate-600">No account needed • All data stays local</p>
          </form>
        </div>
      </main>
    </div>
  );
}
