import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import { getQuestions, submitAnswer } from '../utils/api';
import ScoreRing from '../components/ScoreRing';
import AIAvatar from '../components/features/AIAvatar';
import ConfidenceGauge from '../components/charts/ConfidenceGauge';
import { SkeletonFeedback } from '../components/features/SkeletonLoader';
import { useFillerWords } from '../hooks/useFillerWords';
import { useStreak } from '../hooks/useStreak';
import { useAchievements } from '../hooks/useAchievements';

const DIMENSION_META = {
  clarity:     { label:'Clarity',     icon:'💡', color:'#22d3ee' },
  confidence:  { label:'Confidence',  icon:'💪', color:'#a855f7' },
  specificity: { label:'Specificity', icon:'🎯', color:'#f97316' },
  ownership:   { label:'Ownership',   icon:'🙋', color:'#ec4899' },
  relevance:   { label:'Relevance',   icon:'🔗', color:'#10b981' },
};

const PERSONA_META = {
  friendly_hr:  { label:'Friendly HR',        icon:'😊', color:'#10b981' },
  strict_tech:  { label:'Strict Tech Lead',   icon:'⚡', color:'#ef4444' },
  startup_ceo:  { label:'Startup Founder',    icon:'🚀', color:'#f59e0b' },
};

function SessionNav({ mode, progress, total, current, onEnd, dark, setDark, isMock, readinessScore }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#06b6d4,#6366f1)', boxShadow:'0 0 10px rgba(0,212,255,0.4)' }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,7 19,13 10,19 1,13 1,7" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-white hidden sm:inline">Interview Trainer <span className="neon-cyan">AI</span></span>
        </div>

        {isMock && (
          <span className="badge badge-purple text-xs flex-shrink-0">🎭 Mock Mode</span>
        )}

        <div className="flex-1 max-w-sm mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{mode === 'technical' ? '⚙️ Technical' : '🧠 Behavioral'}</span>
            <span className="font-mono">Q{Math.min(current + 1, total)} / {total}</span>
          </div>
          <div className="progress-track h-1.5">
            <div className="progress-fill" style={{ width:`${progress}%` }} />
          </div>
        </div>

        {/* Live readiness score in nav */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <div className="text-xs text-slate-500">Readiness</div>
          <div className="text-sm font-extrabold" style={{ color: readinessScore >= 70 ? '#10b981' : readinessScore >= 45 ? '#f59e0b' : '#ef4444' }}>
            {readinessScore}
          </div>
          <div className="text-xs text-slate-500">/100</div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setDark(!dark)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors text-sm"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={onEnd} className="btn-secondary py-1.5 px-3 text-xs">End Session</button>
        </div>
      </div>
    </nav>
  );
}

function FillerMeter({ text }) {
  const { count, density, words } = useFillerWords(text);
  if (!text || text.length < 10) return null;
  const color = count === 0 ? '#10b981' : density < 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 text-xs flex-wrap">
      <span style={{ color:'#64748b' }}>Filler words:</span>
      <span style={{ color, fontWeight:700 }}>{count}</span>
      {words.slice(0,3).map(([w, c]) => (
        <span key={w} className="badge" style={{ background:`${color}15`, border:`1px solid ${color}30`, color }}>{w} ×{c}</span>
      ))}
      {count === 0 && <span style={{ color:'#10b981' }}>✓ Clean answer!</span>}
    </div>
  );
}

export default function SessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, setDark } = useTheme();
  const state = location.state;

  const [questionMode, setQuestionMode] = useState('technical');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [phase, setPhase] = useState('question');
  const textareaRef = useRef(null);
  const feedbackRef = useRef(null);

  const { sessionId, name, role, level, interviewMode = 'practice', persona = 'friendly_hr', jdQuestions, usedJD = false } = state || {};
  const isMock = interviewMode === 'mock';
  const personaMeta = PERSONA_META[persona] || PERSONA_META.friendly_hr;

  const { recordToday } = useStreak();
  const { recordSession } = useAchievements();

  useEffect(() => {
    if (!sessionId) { navigate('/onboarding'); return; }
    loadQuestions(questionMode);
    recordToday();
    // eslint-disable-next-line
  }, [questionMode]);

  useEffect(() => {
    if (phase === 'feedback' && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }, [phase]);

  async function loadQuestions(type) {
    setLoadingQuestions(true);
    setCurrentIdx(0);
    setUserAnswer('');
    setFeedback(null);
    setPhase('question');
    try {
      // Prefer JD-extracted questions if available
      if (jdQuestions?.length) {
        setQuestions(jdQuestions.slice(0, 8));
      } else {
        const data = await getQuestions(role, level, type);
        setQuestions(data.questions || []);
      }
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100 : 0;

  // Compute live readiness score from session answers so far
  const readinessScore = useMemo(() => {
    if (!sessionAnswers.length) return 0;
    const avg = sessionAnswers.reduce((s, a) => s + (a.scores?.overall ?? 0), 0) / sessionAnswers.length;
    return Math.round(avg * 10); // 0–10 → 0–100
  }, [sessionAnswers]);

  // Avatar phase
  const avatarPhase = loading ? 'thinking' : phase === 'feedback' ? 'feedback' : 'question';
  const lastScore = feedback?.scores?.overall ?? 0;

  async function handleSubmitAnswer() {
    if (!userAnswer.trim() || loading) return;
    setLoading(true);
    setPhase('thinking');
    try {
      const result = await submitAnswer({
        sessionId, questionId: currentQ.id,
        question: currentQ.question,
        userAnswer: userAnswer.trim(),
        modelAnswer: currentQ.model_answer,
        role, level,
      });
      const answerRecord = { questionId: currentQ.id, question: currentQ.question, topic: currentQ.topic, userAnswer: userAnswer.trim(), modelAnswer: currentQ.model_answer, ...result };
      setFeedback(answerRecord);
      setSessionAnswers(prev => [...prev, answerRecord]);
      // In mock mode, don't show feedback panel
      setPhase(isMock ? 'question' : 'feedback');
    } catch {
      alert('Error evaluating answer. Check backend connection.');
      setPhase('question');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      // Record achievements before leaving
      const avg = sessionAnswers.reduce((s,a) => s + (a.scores?.overall ?? 0), 0) / Math.max(sessionAnswers.length, 1);
      recordSession({ answers: sessionAnswers, isMock, averageScore: Math.round(avg), usedJD: !!jdQuestions || usedJD });
      navigate('/summary', { state: { sessionId, name, role, level, answers: sessionAnswers, interviewMode, persona, usedJD: usedJD || !!jdQuestions } });
    } else {
      setCurrentIdx(i => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setPhase('question');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  function handleSkip() {
    if (currentIdx + 1 >= questions.length) {
      navigate('/summary', { state: { sessionId, name, role, level, answers: sessionAnswers, interviewMode, persona, usedJD: usedJD || !!jdQuestions } });
    } else {
      setCurrentIdx(i => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setPhase('question');
    }
  }

  if (!state) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#020817' }}>
      <SessionNav
        mode={questionMode} progress={progress} total={questions.length} current={currentIdx}
        onEnd={() => navigate('/summary', { state: { sessionId, name, role, level, answers: sessionAnswers, interviewMode, persona, usedJD: usedJD || !!jdQuestions } })}
        dark={dark} setDark={setDark} isMock={isMock} readinessScore={readinessScore}
      />

      <div className="flex flex-1 pt-16 max-w-7xl mx-auto w-full">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 p-5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
          style={{ borderRight:'1px solid rgba(0,212,255,0.07)' }}>

          {/* Profile */}
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#06b6d4,#a855f7)', boxShadow:'0 0 12px rgba(0,212,255,0.35)' }}>
                {name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate text-sm">{name}</div>
                <div className="text-xs text-slate-500 truncate">{role}</div>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="badge badge-cyan">{level}</span>
              <span className="badge" style={{ background:`${personaMeta.color}15`, border:`1px solid ${personaMeta.color}30`, color:personaMeta.color }}>
                {personaMeta.icon} {personaMeta.label}
              </span>
              {isMock && <span className="badge badge-purple">🎭 Mock</span>}
            </div>
          </div>

          {/* Live Confidence Gauge */}
          <div className="card p-3 mb-4 flex items-center justify-center">
            <ConfidenceGauge score={readinessScore} size={130} label="Live Readiness" />
          </div>

          {/* Mode toggle */}
          <div className="space-y-1.5 mb-5">
            {['technical','behavioral'].map(m => (
              <button key={m} onClick={() => setQuestionMode(m)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: questionMode === m ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border:`1px solid ${questionMode === m ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
                  color: questionMode === m ? '#22d3ee' : '#64748b',
                }}>
                {m === 'technical' ? '⚙️' : '🧠'} {m.charAt(0).toUpperCase() + m.slice(1)}
                {questionMode === m && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            ))}
          </div>

          {/* Question list */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Progress</p>
          <div className="space-y-1.5 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={q.id || i} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: i === currentIdx ? 'rgba(0,212,255,0.07)' : 'transparent',
                  border:`1px solid ${i === currentIdx ? 'rgba(0,212,255,0.2)' : 'transparent'}`,
                }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
                  style={{
                    background: sessionAnswers[i] ? 'rgba(16,185,129,0.15)' : i === currentIdx ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                    color: sessionAnswers[i] ? '#10b981' : i === currentIdx ? '#22d3ee' : '#475569',
                    border:`1px solid ${sessionAnswers[i] ? 'rgba(16,185,129,0.3)' : i === currentIdx ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {sessionAnswers[i] ? '✓' : i + 1}
                </div>
                <span className="truncate text-xs" style={{ color: i === currentIdx ? '#22d3ee' : '#475569' }}>
                  {q.topic || `Q${i+1}`}
                </span>
                {sessionAnswers[i]?.scores?.overall && (
                  <span className="ml-auto text-xs font-bold flex-shrink-0"
                    style={{ color: sessionAnswers[i].scores.overall >= 7 ? '#10b981' : sessionAnswers[i].scores.overall >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {sessionAnswers[i].scores.overall}
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main panel ─────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {loadingQuestions ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 rounded-full animate-spin"
                style={{ border:'3px solid rgba(0,212,255,0.1)', borderTop:'3px solid #22d3ee' }} />
              <p className="text-slate-400 text-sm">Loading your questions…</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="card p-12 text-center max-w-md mx-auto mt-8">
              <div className="text-5xl mb-4">😅</div>
              <h3 className="text-lg font-semibold text-white mb-2">No questions found</h3>
              <button onClick={() => navigate('/onboarding')} className="btn-secondary mt-4">Back to Setup</button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">

              {/* AI Avatar */}
              <AIAvatar phase={avatarPhase} lastScore={lastScore} isMock={isMock} />

              {/* Question card */}
              <div className="card p-6 animate-slide-up gradient-border">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge"
                      style={{ background: questionMode === 'technical' ? 'rgba(0,212,255,0.1)' : 'rgba(139,92,246,0.1)', border:`1px solid ${questionMode === 'technical' ? 'rgba(0,212,255,0.3)' : 'rgba(139,92,246,0.3)'}`, color: questionMode === 'technical' ? '#22d3ee' : '#c084fc' }}>
                      {questionMode === 'technical' ? '⚙️ Technical' : '🧠 Behavioral'}
                    </span>
                    {currentQ.topic && (
                      <span className="badge" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8' }}>{currentQ.topic}</span>
                    )}
                    {currentQ.framework && (
                      <span className="badge" style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)', color:'#fbbf24' }}>{currentQ.framework}</span>
                    )}
                    {/* Persona badge */}
                    <span className="badge" style={{ background:`${personaMeta.color}10`, border:`1px solid ${personaMeta.color}25`, color:personaMeta.color }}>
                      {personaMeta.icon} {personaMeta.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{currentIdx + 1}/{questions.length}</span>
                </div>
                <h2 className="text-xl font-semibold text-white leading-relaxed">{currentQ.question}</h2>
                {currentQ.category && <p className="text-xs text-slate-500 mt-2">Category: {currentQ.category}</p>}
              </div>

              {/* Answer input */}
              {(phase === 'question' || phase === 'thinking') && (
                <div className="card p-6 animate-slide-up" style={{ animationDelay:'0.1s' }}>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Your Answer</label>
                  <textarea
                    ref={textareaRef}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here… Be specific, use concrete examples, quantify your impact."
                    rows={6}
                    disabled={loading}
                    className="input-field resize-none text-sm leading-relaxed"
                    style={{ fontFamily:'inherit', opacity: loading ? 0.6 : 1 }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitAnswer(); }}
                  />

                  {/* Filler word meter */}
                  <div className="mt-2 min-h-5">
                    <FillerMeter text={userAnswer} />
                  </div>

                  {loading && (
                    <div className="mt-3 flex items-center gap-3 py-3 px-4 rounded-xl"
                      style={{ background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)' }}>
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" style={{ animationDelay:`${i*0.2}s` }} />)}
                      </div>
                      <span className="text-sm text-slate-400">IBM Granite is evaluating your answer…</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span style={{ color: userAnswer.trim().split(/\s+/).filter(Boolean).length > 30 ? '#22d3ee' : '#475569' }}>
                        {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                      <span>Ctrl+Enter to submit</span>
                      {isMock && <span className="badge badge-purple">🎭 Mock — no feedback shown</span>}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleSkip} disabled={loading} className="btn-secondary py-2 px-4 text-sm">Skip</button>
                      <button onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || loading} className="btn-primary py-2 px-6 text-sm">
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Evaluating…
                          </span>
                        ) : isMock ? 'Next →' : 'Submit →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock mode: progress card instead of feedback */}
              {isMock && phase === 'question' && sessionAnswers.length > 0 && (
                <div className="card p-4 animate-fade-in" style={{ border:'1px solid rgba(139,92,246,0.2)', background:'rgba(139,92,246,0.04)' }}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="badge badge-purple">🎭 Mock Mode</span>
                    <span className="text-slate-400">{sessionAnswers.length} answer{sessionAnswers.length !== 1 ? 's' : ''} recorded — feedback revealed at the end</span>
                  </div>
                </div>
              )}

              {/* Practice mode feedback */}
              {!isMock && phase === 'feedback' && feedback && (
                <div ref={feedbackRef} className="space-y-4 animate-slide-up">
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-glow-pulse"
                        style={{ background:'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(99,102,241,0.15))', border:'1px solid rgba(0,212,255,0.25)' }}>
                        🤖
                      </div>
                      <h3 className="font-semibold text-white">AI Evaluation</h3>
                      <span className="badge badge-cyan ml-auto">IBM Granite</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                      <ScoreRing score={feedback.scores?.overall || 0} size={110} id="overall" label="Overall" />
                      <div className="grid grid-cols-5 gap-2 flex-1 w-full">
                        {Object.entries(DIMENSION_META).map(([key, meta]) => (
                          <div key={key} className="flex flex-col items-center">
                            <ScoreRing score={feedback.scores?.[key] || 0} size={52} id={key} />
                            <span className="text-xs text-slate-500 mt-1 text-center">{meta.icon}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {Object.entries(DIMENSION_META).map(([key, meta]) => {
                        const score = feedback.scores?.[key] || 0;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-400">{meta.icon} {meta.label}</span>
                              <span className="text-xs font-bold" style={{ color: score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444' }}>{score}/10</span>
                            </div>
                            <div className="progress-track h-1.5">
                              <div className="progress-fill" style={{ width:`${score*10}%`, background: score>=7?'linear-gradient(90deg,#10b981,#22d3ee)':score>=5?'linear-gradient(90deg,#f59e0b,#f97316)':'linear-gradient(90deg,#ef4444,#ec4899)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 rounded-xl mb-4" style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)' }}>
                      <p className="text-sm text-slate-300 leading-relaxed">{feedback.feedback}</p>
                    </div>

                    {feedback.tips?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">💡 Tips</h4>
                        <ul className="space-y-1.5">
                          {feedback.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                              <span className="font-bold flex-shrink-0 mt-0.5 neon-cyan">{i+1}.</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="card p-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-xs" style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.2)' }}>👤</span>
                        Your Answer
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{feedback.userAnswer}</p>
                    </div>
                    <div className="card p-4" style={{ border:'1px solid rgba(16,185,129,0.2)', background:'rgba(16,185,129,0.04)' }}>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-xs" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)' }}>✨</span>
                        Model Answer
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{feedback.modelAnswer}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleNext} className="btn-primary px-8 py-3">
                      {currentIdx + 1 >= questions.length ? '🏁 View Summary' : 'Next Question →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Skip to next in mock mode */}
              {isMock && phase === 'question' && (
                <div className="flex justify-end">
                  <button onClick={handleNext} className="btn-primary px-8 py-3">
                    {currentIdx + 1 >= questions.length ? '🏁 See Full Results' : 'Next Question →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
