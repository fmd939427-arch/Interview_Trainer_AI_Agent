import React, { useState, useEffect, useRef } from 'react';

const MESSAGES = {
  intro:     ["Let's do this! I'll be coaching you through every answer. 🎯", "Ready when you are. Give it your best! 💪"],
  good:      ["Great structure on that answer! Keep it up.", "Solid response — clear and confident.", "I can see you know this topic well. ✨", "That was specific and well-reasoned!"],
  medium:    ["Good start — try adding a concrete example next time.", "Not bad! A metric or number would strengthen that.", "You're on the right track. Add more ownership language."],
  low:       ["Let's build on that. Review the model answer and try again next session.", "Keep going — every answer teaches you something.", "That topic needs more prep — note it for later."],
  thinking:  ["Analysing your answer with IBM Granite AI…", "Evaluating clarity, confidence, and specificity…", "Running your response through the rubric…"],
  complete:  ["🏁 Session complete! Check out your full report below.", "You made it through! See how you performed."],
  mock:      ["Mock mode: no feedback until the end. Stay focused!", "Keep your answers concise and structured.", "Imagine a real panel interview. You've got this!"],
  streak:    ["You're on a streak! Consistency is key to improvement. 🔥"],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function AIAvatar({ phase, lastScore, interviewMode, isMock }) {
  const [message, setMessage] = useState(pick(MESSAGES.intro));
  const [visible, setVisible] = useState(true);
  const [pulse, setPulse] = useState(false);
  const prevPhase = useRef(null);

  useEffect(() => {
    if (phase === prevPhase.current) return;
    prevPhase.current = phase;

    let msg = '';
    if (phase === 'thinking') msg = pick(MESSAGES.thinking);
    else if (phase === 'feedback') {
      if (isMock) msg = pick(MESSAGES.mock);
      else if (lastScore >= 7) msg = pick(MESSAGES.good);
      else if (lastScore >= 5) msg = pick(MESSAGES.medium);
      else msg = pick(MESSAGES.low);
    } else if (phase === 'complete') msg = pick(MESSAGES.complete);
    else msg = pick(MESSAGES.intro);

    if (!msg) return;
    setPulse(true);
    setVisible(false);
    const t1 = setTimeout(() => { setMessage(msg); setVisible(true); }, 200);
    const t2 = setTimeout(() => setPulse(false), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, lastScore, isMock]);

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl animate-fade-in"
      style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)' }}>
      {/* Avatar crystal orb */}
      <div className="flex-shrink-0 relative">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300 ${pulse ? 'scale-125' : 'scale-100'}`}
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(139,92,246,0.25))',
            border: '1.5px solid rgba(0,212,255,0.4)',
            boxShadow: pulse ? '0 0 20px rgba(0,212,255,0.6)' : '0 0 8px rgba(0,212,255,0.25)',
          }}>
          🤖
        </div>
        {phase === 'thinking' && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-pulse"
            style={{ boxShadow:'0 0 8px #22d3ee' }} />
        )}
      </div>

      {/* Bubble */}
      <div className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-xs font-bold text-cyan-400 mb-0.5">AI Coach</div>
        <div className="text-sm text-slate-300 leading-relaxed">{message}</div>
      </div>
    </div>
  );
}
