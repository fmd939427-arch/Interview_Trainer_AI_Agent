import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import { getQuestions, submitAnswer } from '../utils/api';
import ScoreRing from '../components/ScoreRing';

const DIMENSION_META = {
  clarity:     { label: 'Clarity',     icon: '💡', color: '#22d3ee' },
  confidence:  { label: 'Confidence',  icon: '💪', color: '#a855f7' },
  specificity: { label: 'Specificity', icon: '🎯', color: '#f97316' },
  ownership:   { label: 'Ownership',   icon: '🙋', color: '#ec4899' },
  relevance:   { label: 'Relevance',   icon: '🔗', color: '#10b981' },
};

/* ── Shared glass nav ─────────────────────────────────────────────────── */
function SessionNav({ name, role, level, mode, progress, total, current, onEnd, dark, setDark }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)', boxShadow: '0 0 10px rgba(0,212,255,0.4)' }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,7 19,13 10,19 1,13 1,7" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-white hidden sm:inline">Interview Trainer <span className="neon-cyan">AI</span></span>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-sm mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>{mode === 'technical' ? '⚙️ Technical' : '🧠 Behavioral'}</span>
            <span className="font-mono">Q{Math.min(current + 1, total)} / {total}</span>
          </div>
          <div className="progress-track h-1.5">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setDark(!dark)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={onEnd} className="btn-secondary py-1.5 px-3 text-xs">End Session</button>
        </div>
      </div>
    </nav>
  );
}

/* ── AI typing indicator ─────────────────────────────────────────────── */
function AIThinking() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl"
      style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 animate-glow-pulse"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(0,212,255,0.3)' }}>
        🤖
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-400">IBM Granite is analysing your answer</span>
        <div className="flex items-center gap-1 ml-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, setDark } = useTheme();
  const state = location.state;

  const [mode, setMode] = useState('technical');
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
  const { sessionId, name, role, level } = state || {};

  useEffect(() => {
    if (!sessionId) { navigate('/onboarding'); return; }
    loadQuestions(mode);
    // eslint-disable-next-line
  }, [mode]);

  useEffect(() => {
    if (phase === 'feedback' && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [phase]);

  async function loadQuestions(type) {
    setLoadingQuestions(true);
    setCurrentIdx(0);
    setUserAnswer('');
    setFeedback(null);
    setPhase('question');
    try {
      const data = await getQuestions(role, level, type);
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100 : 0;

  async function handleSubmitAnswer() {
    if (!userAnswer.trim() || loading) return;
    setLoading(true);
    try {
      const result = await submitAnswer({
        sessionId, questionId: currentQ.id,
        question: currentQ.question,
        userAnswer: userAnswer.trim(),
        modelAnswer: currentQ.model_answer,
        role, level,
      });
      setFeedback({ ...result, userAnswer: userAnswer.trim() });
      setSessionAnswers(prev => [...prev, { questionId: currentQ.id, ...result }]);
      setPhase('feedback');
    } catch {
      alert('Error evaluating answer. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      navigate('/summary', { state: { sessionId, name, role, level, answers: sessionAnswers } });
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
      navigate('/summary', { state: { sessionId, name, role, level, answers: sessionAnswers } });
    } else {
      setCurrentIdx(i => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setPhase('question');
    }
  }

  if (!state) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020817' }}>
      <SessionNav
        name={name} role={role} level={level} mode={mode}
        progress={progress} total={questions.length} current={currentIdx}
        onEnd={() => navigate('/summary', { state: { sessionId, name, role, level, answers: sessionAnswers } })}
        dark={dark} setDark={setDark}
      />

      <div className="flex flex-1 pt-16 max-w-7xl mx-auto w-full">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 p-5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
          style={{ borderRight: '1px solid rgba(0,212,255,0.07)' }}>

          {/* Profile card */}
          <div className="card p-4 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#06b6d4,#a855f7)', boxShadow: '0 0 12px rgba(0,212,255,0.35)' }}>
                {name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate text-sm">{name}</div>
                <div className="text-xs text-slate-500 truncate">{role}</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-cyan">{level}</span>
              <span className="badge badge-purple">{mode === 'technical' ? 'Technical' : 'Behavioral'}</span>
            </div>
          </div>

          {/* Mode toggle */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Mode</p>
          <div className="space-y-2 mb-6">
            {['technical', 'behavioral'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: `1px solid ${mode === m ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
                  color: mode === m ? '#22d3ee' : '#64748b',
                }}>
                {m === 'technical' ? '⚙️' : '🧠'}
                {m.charAt(0).toUpperCase() + m.slice(1)}
                {mode === m && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            ))}
          </div>

          {/* Question list */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Progress</p>
          <div className="space-y-1.5">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: i === currentIdx ? 'rgba(0,212,255,0.07)' : 'transparent',
                  border: `1px solid ${i === currentIdx ? 'rgba(0,212,255,0.2)' : 'transparent'}`,
                }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
                  style={{
                    background: sessionAnswers[i] ? 'rgba(16,185,129,0.15)' : i === currentIdx ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                    color: sessionAnswers[i] ? '#10b981' : i === currentIdx ? '#22d3ee' : '#475569',
                    border: `1px solid ${sessionAnswers[i] ? 'rgba(16,185,129,0.3)' : i === currentIdx ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {sessionAnswers[i] ? '✓' : i + 1}
                </div>
                <span className="truncate text-xs"
                  style={{ color: i === currentIdx ? '#22d3ee' : '#475569' }}>
                  {q.topic || `Q${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {loadingQuestions ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 rounded-full animate-spin"
                style={{ border: '3px solid rgba(0,212,255,0.1)', borderTop: '3px solid #22d3ee' }} />
              <p className="text-slate-400 text-sm">Loading your questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="card p-12 text-center max-w-md mx-auto mt-8">
              <div className="text-5xl mb-4">😅</div>
              <h3 className="text-lg font-semibold text-white mb-2">No questions found</h3>
              <p className="text-slate-400 text-sm mb-6">Try switching mode or returning to setup.</p>
              <button onClick={() => navigate('/onboarding')} className="btn-secondary">Back to Setup</button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-5">

              {/* ── Question card ─────────────────────────────────── */}
              <div className="card p-6 animate-slide-up gradient-border">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge"
                      style={{
                        background: mode === 'technical' ? 'rgba(0,212,255,0.1)' : 'rgba(139,92,246,0.1)',
                        border: `1px solid ${mode === 'technical' ? 'rgba(0,212,255,0.3)' : 'rgba(139,92,246,0.3)'}`,
                        color: mode === 'technical' ? '#22d3ee' : '#c084fc',
                      }}>
                      {mode === 'technical' ? '⚙️ Technical' : '🧠 Behavioral'}
                    </span>
                    {currentQ.topic && (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        {currentQ.topic}
                      </span>
                    )}
                    {currentQ.framework && (
                      <span className="badge" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                        {currentQ.framework}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{currentIdx + 1}/{questions.length}</span>
                </div>

                <h2 className="text-xl font-semibold text-white leading-relaxed">
                  {currentQ.question}
                </h2>
                {currentQ.category && (
                  <p className="text-xs text-slate-500 mt-2">Category: {currentQ.category}</p>
                )}
              </div>

              {/* ── Answer area ───────────────────────────────────── */}
              {phase === 'question' && (
                <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Your Answer</label>
                  <textarea
                    ref={textareaRef}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here... Be specific, use concrete examples, and structure your thoughts clearly."
                    rows={6}
                    className="input-field resize-none text-sm leading-relaxed"
                    style={{ fontFamily: 'inherit' }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitAnswer(); }}
                  />

                  {loading && <div className="mt-3"><AIThinking /></div>}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span style={{ color: userAnswer.trim().split(/\s+/).filter(Boolean).length > 30 ? '#22d3ee' : '#475569' }}>
                        {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                      <span>•</span>
                      <span>Ctrl+Enter to submit</span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleSkip} className="btn-secondary py-2 px-4 text-sm">Skip</button>
                      <button onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || loading} className="btn-primary py-2 px-6 text-sm">
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Evaluating...
                          </span>
                        ) : 'Submit →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Feedback ──────────────────────────────────────── */}
              {phase === 'feedback' && feedback && (
                <div ref={feedbackRef} className="space-y-4 animate-slide-up">

                  {/* Score overview card */}
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-glow-pulse"
                        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(0,212,255,0.25)' }}>
                        🤖
                      </div>
                      <h3 className="font-semibold text-white">AI Evaluation</h3>
                      <span className="badge badge-cyan ml-auto">IBM Granite</span>
                    </div>

                    {/* Overall ring + 5 dimension rings */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                      <div className="flex-shrink-0">
                        <ScoreRing score={feedback.scores?.overall || 0} size={110} id="overall" label="Overall" />
                      </div>
                      <div className="grid grid-cols-5 gap-3 flex-1 w-full">
                        {Object.entries(DIMENSION_META).map(([key, meta]) => (
                          <div key={key} className="flex flex-col items-center">
                            <ScoreRing score={feedback.scores?.[key] || 0} size={56} id={key} />
                            <span className="text-xs text-slate-500 mt-1 text-center leading-tight">{meta.icon}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dimension bar breakdown */}
                    <div className="space-y-3 mb-5">
                      {Object.entries(DIMENSION_META).map(([key, meta]) => {
                        const score = feedback.scores?.[key] || 0;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-400">{meta.icon} {meta.label}</span>
                              <span className="text-xs font-bold" style={{ color: score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444' }}>{score}/10</span>
                            </div>
                            <div className="progress-track h-1.5">
                              <div className="progress-fill" style={{
                                width: `${score * 10}%`,
                                background: score >= 7 ? 'linear-gradient(90deg,#10b981,#22d3ee)' : score >= 5 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#ef4444,#ec4899)',
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI feedback summary */}
                    <div className="p-4 rounded-xl mb-4"
                      style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <p className="text-sm text-slate-300 leading-relaxed">{feedback.feedback}</p>
                    </div>

                    {/* Tips */}
                    {feedback.tips?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">💡 Improvement Tips</h4>
                        <ul className="space-y-2">
                          {feedback.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                              <span className="font-bold flex-shrink-0 mt-0.5 neon-cyan">{i + 1}.</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Your answer vs model answer */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="card p-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>👤</span>
                        Your Answer
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{feedback.userAnswer}</p>
                    </div>
                    <div className="card p-4" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>✨</span>
                        Model Answer
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{feedback.modelAnswer}</p>
                    </div>
                  </div>

                  {/* Next button */}
                  <div className="flex justify-end">
                    <button onClick={handleNext} className="btn-primary px-8 py-3">
                      {currentIdx + 1 >= questions.length ? '🏁 View Summary' : 'Next Question →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
