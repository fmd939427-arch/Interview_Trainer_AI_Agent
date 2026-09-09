import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import { getSummary } from '../utils/api';
import { exportReportPDF } from '../utils/pdfExport';
import { useAchievements } from '../hooks/useAchievements';
import { useStreak } from '../hooks/useStreak';
import ScoreRing from '../components/ScoreRing';
import PerformanceRadar from '../components/charts/PerformanceRadar';
import ProgressTimeline from '../components/charts/ProgressTimeline';
import ComparisonBar from '../components/charts/ComparisonBar';
import SkillHeatmap from '../components/charts/SkillHeatmap';
import WordCloudView from '../components/charts/WordCloudView';
import BadgeShelf from '../components/features/BadgeShelf';
import StreakCalendar from '../components/features/StreakCalendar';
import SessionReplay from '../components/features/SessionReplay';

const DIMENSION_INFO = {
  clarity:     { icon: '💡', label: 'Clarity',     color: '#22d3ee' },
  confidence:  { icon: '💪', label: 'Confidence',  color: '#a855f7' },
  specificity: { icon: '🎯', label: 'Specificity', color: '#f97316' },
  ownership:   { icon: '🙋', label: 'Ownership',   color: '#ec4899' },
  relevance:   { icon: '🔗', label: 'Relevance',   color: '#10b981' },
};

const RATING_CONFIG = {
  Outstanding:     { color: '#10b981', glow: 'rgba(16,185,129,0.25)',  border: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.06)',  emoji: '🏆' },
  Strong:          { color: '#22d3ee', glow: 'rgba(34,211,238,0.25)',  border: 'rgba(34,211,238,0.3)',  bg: 'rgba(34,211,238,0.05)',  emoji: '⭐' },
  Developing:      { color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',   border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.05)',  emoji: '📈' },
  'Needs Practice':{ color: '#ef4444', glow: 'rgba(239,68,68,0.2)',    border: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.05)',   emoji: '🔄' },
};

const PERSONA_LABELS = {
  friendly_hr:  { label: 'Friendly HR',    icon: '😊' },
  strict_tech:  { label: 'Strict Tech',    icon: '🤖' },
  startup_ceo:  { label: 'Startup CEO',    icon: '🚀' },
};

/* ─── Section wrapper ─────────────────────────────── */
function Section({ title, icon, children, style }) {
  return (
    <div className="card p-6" style={style}>
      {(title || icon) && (
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2 text-base">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/* ─── Mock-mode revealed feedback banner ──────────── */
function MockRevealBanner() {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3 mb-2"
      style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)' }}>
      <span className="text-2xl">🎭</span>
      <div>
        <div className="font-bold text-indigo-300 text-sm">Mock Interview Mode — Feedback Unlocked</div>
        <div className="text-xs text-slate-400 mt-0.5">
          You answered all questions without mid-session hints. Here is your complete analysis.
        </div>
      </div>
    </div>
  );
}

/* ─── PDF export button ───────────────────────────── */
function ExportButton({ onClick, exporting }) {
  return (
    <button onClick={onClick} disabled={exporting}
      className="btn-secondary flex items-center gap-2 px-6 py-3 text-sm"
      style={{ opacity: exporting ? 0.6 : 1 }}>
      {exporting
        ? <><span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />Exporting…</>
        : <>📄 Export PDF</>}
    </button>
  );
}

/* ══════════════════════════════════════════════════ */
export default function SummaryPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { dark, setDark } = useTheme();
  const state       = location.state ?? {};

  const { stats, recordSession } = useAchievements();
  const { days, streak, recordToday } = useStreak();

  const [summary,     setSummary]     = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [exporting,   setExporting]   = useState(false);
  const [activeTab,   setActiveTab]   = useState('overview'); // overview | charts | replay
  const recorded = useRef(false);

  /* ── data ── */
  const answers      = state.answers      ?? [];
  const interviewMode= state.interviewMode ?? 'practice';
  const persona      = state.persona       ?? 'friendly_hr';
  const isMock       = interviewMode === 'mock';
  const usedJD       = !!state.jobDescription;

  useEffect(() => {
    if (!state?.sessionId) { navigate('/'); return; }
    fetchSummary();
    // eslint-disable-next-line
  }, []);

  async function fetchSummary() {
    try {
      const data = await getSummary(state.sessionId);
      setSummary(data.summary);
      setSessionInfo(data.session);
    } catch {
      computeLocalSummary();
    } finally {
      setLoading(false);
    }
  }

  function computeLocalSummary() {
    if (!answers.length) {
      setSummary({ averageScore:0, totalAnswered:0, dimensionScores:{}, strengths:[], improvements:[], rating:'Needs Practice' });
      return;
    }
    const dims = ['clarity','confidence','specificity','ownership','relevance'];
    const dimensionScores = {};
    dims.forEach(d => {
      const vals = answers.map(a => a.scores?.[d] ?? 0);
      dimensionScores[d] = Math.round(vals.reduce((s,v) => s + v, 0) / vals.length);
    });
    const avg    = Math.round(Object.values(dimensionScores).reduce((s,v) => s + v, 0) / 5);
    const sorted = Object.entries(dimensionScores).sort(([,a],[,b]) => b - a);
    setSummary({
      averageScore:  avg,
      totalAnswered: answers.length,
      dimensionScores,
      strengths:    sorted.slice(0, 2).map(([k]) => ({ area: k.charAt(0).toUpperCase()+k.slice(1), score: dimensionScores[k] })),
      improvements: sorted.slice(3).map(([k])    => ({ area: k.charAt(0).toUpperCase()+k.slice(1), score: dimensionScores[k] })),
      rating: avg >= 8 ? 'Outstanding' : avg >= 6 ? 'Strong' : avg >= 4 ? 'Developing' : 'Needs Practice',
    });
  }

  /* ── record achievements once ── */
  useEffect(() => {
    if (!summary || recorded.current) return;
    recorded.current = true;
    recordToday();
    recordSession({ answers, isMock, usedJD, averageScore: summary.averageScore });
  }, [summary]); // eslint-disable-line

  /* ── derived ── */
  const rc            = summary ? (RATING_CONFIG[summary.rating] ?? RATING_CONFIG['Developing']) : null;
  const personaMeta   = PERSONA_LABELS[persona] ?? PERSONA_LABELS['friendly_hr'];
  const candidateName = state.name ?? sessionInfo?.name ?? 'Candidate';
  const role          = state.role ?? sessionInfo?.role ?? 'Software Engineer';
  const level         = state.level ?? sessionInfo?.level ?? 'Mid';

  /* ── PDF export ── */
  async function handleExport() {
    setExporting(true);
    await exportReportPDF({
      elementId: 'report-content',
      name: candidateName, role, level,
      averageScore: summary?.averageScore,
      rating: summary?.rating,
    });
    setExporting(false);
  }

  /* ── tabs ── */
  const TABS = [
    { id:'overview', label:'📊 Overview' },
    { id:'charts',   label:'📈 Charts'   },
    { id:'replay',   label:'🔄 Replay'   },
  ];

  /* ══════ render ══════ */
  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#020817' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-nav">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#06b6d4,#6366f1)', boxShadow:'0 0 12px rgba(0,212,255,0.4)' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,1 19,7 19,13 10,19 1,13 1,7" fill="none" stroke="white" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">Interview Trainer <span className="neon-cyan">AI</span></span>
          </button>
          <div className="flex items-center gap-3">
            {summary && (
              <ExportButton onClick={handleExport} exporting={exporting} />
            )}
            <button onClick={() => setDark(!dark)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Background orbs ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex:0 }}>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full animate-orb-drift"
          style={{ background:'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter:'blur(60px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full animate-orb-drift"
          style={{ background:'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter:'blur(60px)', animationDelay:'6s' }} />
      </div>

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-24 pb-16" style={{ zIndex:1 }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 rounded-full animate-spin"
              style={{ border:'3px solid rgba(0,212,255,0.1)', borderTop:'3px solid #22d3ee' }} />
            <p className="text-slate-400 text-sm">Generating your report…</p>
          </div>
        ) : (
          <div id="report-content" className="space-y-6 animate-slide-up">

            {/* ── Hero header ── */}
            <div className="text-center py-8">
              <div className="text-6xl mb-4 animate-float">{rc?.emoji}</div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
                Session <span className="text-shimmer">Complete!</span>
              </h1>
              <p className="text-slate-400 text-lg">
                Here's your performance report, <span className="text-white font-semibold">{candidateName}</span>
              </p>
              {/* persona / mode badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <span className="badge badge-purple">{personaMeta.icon} {personaMeta.label}</span>
                <span className={`badge ${isMock ? 'badge-cyan' : 'badge-purple'}`}>
                  {isMock ? '🎭 Mock Mode' : '✏️ Practice Mode'}
                </span>
                {usedJD && <span className="badge badge-cyan">📋 JD Mode</span>}
              </div>
            </div>

            {isMock && <MockRevealBanner />}

            {/* ── Overall rating banner ── */}
            <div className="card p-6 gradient-border flex flex-col sm:flex-row items-center gap-6"
              style={{ border:`1px solid ${rc?.border}`, background:rc?.bg, boxShadow:`0 0 40px ${rc?.glow}` }}>
              <div className="flex-shrink-0">
                <ScoreRing score={summary?.averageScore ?? 0} size={120} id="overall-summary" label="Overall" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:rc?.color }}>
                  Overall Rating
                </div>
                <div className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color:rc?.color }}>
                  {summary?.rating}
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  You answered{' '}
                  <span className="font-bold text-white">{summary?.totalAnswered}</span>{' '}
                  question{summary?.totalAnswered !== 1 ? 's' : ''} · avg score{' '}
                  <span className="font-bold text-white">{summary?.averageScore}/10</span>
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="badge badge-cyan">{role}</span>
                  <span className="badge badge-purple">{level} Level</span>
                </div>
              </div>
            </div>

            {/* ── Tab navigation ── */}
            <div className="flex gap-1 p-1 rounded-2xl w-fit"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={activeTab === t.id
                    ? { background:'linear-gradient(135deg,#06b6d4,#6366f1)', color:'#fff', boxShadow:'0 0 14px rgba(0,212,255,0.3)' }
                    : { color:'#64748b' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ══ TAB: Overview ══ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* Dimension score rings + bars */}
                {summary?.dimensionScores && Object.keys(summary.dimensionScores).length > 0 && (
                  <Section title="Performance Breakdown" icon="⚡">
                    <div className="grid grid-cols-5 gap-3 mb-6">
                      {Object.entries(summary.dimensionScores).map(([key, score]) => {
                        const info = DIMENSION_INFO[key];
                        if (!info) return null;
                        return (
                          <div key={key} className="flex flex-col items-center gap-2">
                            <ScoreRing score={score} size={68} id={`sum-${key}`} />
                            <span className="text-xs text-slate-400 font-medium text-center leading-tight">
                              {info.icon} {info.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-3">
                      {Object.entries(summary.dimensionScores).map(([key, score]) => {
                        const info = DIMENSION_INFO[key];
                        if (!info) return null;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-400">{info.icon} {info.label}</span>
                              <span className="text-xs font-bold" style={{ color:info.color }}>{score}/10</span>
                            </div>
                            <div className="progress-track h-2">
                              <div className="progress-fill" style={{
                                width:`${score * 10}%`,
                                background:`linear-gradient(90deg, ${info.color}90, ${info.color})`,
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* Strengths + Improvements */}
                <div className="grid md:grid-cols-2 gap-5">
                  <Section title="Your Strengths" icon="🌟">
                    {summary?.strengths?.length > 0 ? (
                      <ul className="space-y-3">
                        {summary.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-xl"
                            style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)' }}>
                            <span className="text-lg flex-shrink-0 mt-0.5" style={{ color:'#10b981' }}>✓</span>
                            <div>
                              <div className="font-semibold text-sm" style={{ color:'#6ee7b7' }}>{s.area}</div>
                              {s.description && <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.description}</div>}
                              {s.score !== undefined && <div className="text-xs font-bold mt-1" style={{ color:'#10b981' }}>Score: {s.score}/10</div>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Complete more questions to identify strengths.</p>
                    )}
                  </Section>

                  <Section title="Areas to Improve" icon="📈">
                    {summary?.improvements?.length > 0 ? (
                      <ul className="space-y-3">
                        {summary.improvements.map((s, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-xl"
                            style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.18)' }}>
                            <span className="text-lg flex-shrink-0 mt-0.5" style={{ color:'#f97316' }}>↑</span>
                            <div>
                              <div className="font-semibold text-sm" style={{ color:'#fdba74' }}>{s.area}</div>
                              {s.description && <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.description}</div>}
                              {s.score !== undefined && <div className="text-xs font-bold mt-1" style={{ color:'#f97316' }}>Score: {s.score}/10</div>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Keep practising to find improvement areas.</p>
                    )}
                  </Section>
                </div>

                {/* Badges */}
                <Section title="Achievements" icon="🏅">
                  <BadgeShelf stats={{ ...stats, streak }} />
                </Section>

                {/* Streak calendar */}
                <Section>
                  <StreakCalendar activityDates={days} streak={streak} />
                </Section>

                {/* Next steps */}
                <div className="card p-6"
                  style={{ background:'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.08))', border:'1px solid rgba(0,212,255,0.15)' }}>
                  <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🚀</span> Next Steps
                  </h2>
                  <ul className="space-y-2.5 text-sm text-slate-400">
                    {[
                      'Review the model answers for questions you found difficult.',
                      'Practice your lowest-scoring dimension by answering out loud before typing.',
                      'Try Behavioral mode if you practised Technical, and vice versa.',
                      'Include at least one specific number or metric in every answer.',
                      isMock ? 'Try Practice Mode next time for real-time coaching hints.' : 'Try Mock Mode to simulate a real interview without hints.',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="neon-cyan flex-shrink-0 mt-0.5 font-bold">›</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}

            {/* ══ TAB: Charts ══ */}
            {activeTab === 'charts' && (
              <div className="space-y-6">

                {/* Radar + Comparison side-by-side on wide screens */}
                <div className="grid md:grid-cols-2 gap-5">
                  <Section>
                    <PerformanceRadar
                      scores={summary?.dimensionScores ?? {}}
                      benchmarkScores={null}
                      role={role}
                    />
                  </Section>
                  <Section>
                    <ComparisonBar
                      scores={summary?.dimensionScores ?? {}}
                      role={role}
                    />
                  </Section>
                </div>

                {/* Score timeline */}
                {answers.length > 0 && (
                  <Section>
                    <ProgressTimeline answers={answers} />
                  </Section>
                )}

                {/* Heatmap + Word cloud */}
                <div className="grid md:grid-cols-2 gap-5">
                  {answers.length > 0 && (
                    <Section>
                      <SkillHeatmap answers={answers} />
                    </Section>
                  )}
                  {answers.length > 0 && (
                    <Section>
                      <WordCloudView answers={answers} />
                    </Section>
                  )}
                </div>

                {/* Badges in chart tab too */}
                <Section title="Achievements" icon="🏅">
                  <BadgeShelf stats={{ ...stats, streak }} />
                </Section>

              </div>
            )}

            {/* ══ TAB: Session Replay ══ */}
            {activeTab === 'replay' && (
              <div className="space-y-6">
                {answers.length > 0 ? (
                  <Section title="Session Replay" icon="🔄">
                    <SessionReplay answers={answers} />
                  </Section>
                ) : (
                  <div className="card p-10 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-slate-400">No recorded answers to replay.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Action buttons ── */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 pb-8">
              <button onClick={() => navigate('/onboarding')} className="btn-primary px-10 py-4 text-base">
                🔄 Practice Again
              </button>
              <ExportButton onClick={handleExport} exporting={exporting} />
              <button onClick={() => navigate('/')} className="btn-secondary px-10 py-4 text-base">
                🏠 Back to Home
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
