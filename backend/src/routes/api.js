const express = require('express');
const router = express.Router();
const sessionStore = require('../db/sessionStore');
const interviewService = require('../services/interviewService');

// POST /api/session — create a new interview session
router.post('/session', (req, res) => {
  try {
    const { name, role, level, resumeText } = req.body;
    if (!name || !role || !level) {
      return res.status(400).json({ error: 'name, role, and level are required.' });
    }
    const session = sessionStore.createSession({ name, role, level, resumeText });
    res.status(201).json({ sessionId: session.id, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions?role=&level=&type=
router.get('/questions', (req, res) => {
  try {
    const { role, level, type = 'technical' } = req.query;
    if (!role || !level) {
      return res.status(400).json({ error: 'role and level query params are required.' });
    }
    const questions = interviewService.getQuestions(role, level, type);
    res.json({ questions, total: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/answer — evaluate a user's answer
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, questionId, question, userAnswer, modelAnswer, role, level } = req.body;
    if (!question || !userAnswer) {
      return res.status(400).json({ error: 'question and userAnswer are required.' });
    }

    const evaluation = await interviewService.evaluateAnswer(question, userAnswer, modelAnswer || '', role, level);

    // Persist to session if sessionId provided
    if (sessionId) {
      try {
        sessionStore.addAnswer(sessionId, {
          questionId,
          question,
          userAnswer,
          ...evaluation,
        });
      } catch (storeErr) {
        console.warn('[POST /answer] Could not persist to session:', storeErr.message);
      }
    }

    res.json(evaluation);
  } catch (err) {
    console.error('[POST /answer] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/summary/:sessionId
router.get('/summary/:sessionId', (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const summary = interviewService.generateSummary(session.answers);
    sessionStore.completeSession(req.params.sessionId);

    res.json({
      session: {
        id: session.id,
        name: session.name,
        role: session.role,
        level: session.level,
        startedAt: session.startedAt,
        completedAt: new Date().toISOString(),
      },
      summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/roles — return available roles and levels
router.get('/roles', (req, res) => {
  const knowledgeBase = require('../data/knowledgeBase.json');
  res.json({ roles: knowledgeBase.roles, levels: knowledgeBase.levels });
});

// GET /api/benchmark?role=&level= — return ideal rubric scores for role/level
router.get('/benchmark', (req, res) => {
  const { role, level } = req.query;
  const benchmarks = {
    'Software Engineer': { Entry:{clarity:7,confidence:6,specificity:7,ownership:7,relevance:8}, Mid:{clarity:8,confidence:7.5,specificity:8.5,ownership:8,relevance:9}, Senior:{clarity:9,confidence:9,specificity:9,ownership:9,relevance:9.5} },
    'Data Analyst':      { Entry:{clarity:7,confidence:6,specificity:8,ownership:6.5,relevance:8}, Mid:{clarity:8,confidence:7,specificity:9,ownership:7,relevance:8.5}, Senior:{clarity:9,confidence:8,specificity:9.5,ownership:8,relevance:9} },
    'Product Manager':   { Entry:{clarity:8,confidence:7,specificity:7.5,ownership:7,relevance:8}, Mid:{clarity:9,confidence:8,specificity:8,ownership:8,relevance:8.5}, Senior:{clarity:9.5,confidence:9,specificity:8.5,ownership:9,relevance:9} },
    'HR/Business':       { Entry:{clarity:8,confidence:7.5,specificity:7,ownership:7.5,relevance:8}, Mid:{clarity:9,confidence:8.5,specificity:7.5,ownership:8.5,relevance:8.5}, Senior:{clarity:9.5,confidence:9,specificity:8,ownership:9,relevance:9} },
  };
  const fallback = { clarity:8, confidence:7.5, specificity:8, ownership:8, relevance:8.5 };
  const roleData = benchmarks[role] || {};
  res.json({ benchmark: roleData[level] || fallback, role, level });
});

// POST /api/jd-parse — extract key requirements from a job description text
router.post('/jd-parse', async (req, res) => {
  const { jdText } = req.body;
  if (!jdText || jdText.trim().length < 20) {
    return res.status(400).json({ error: 'jdText is required (min 20 chars).' });
  }

  // Heuristic extraction — extracts role signals without LLM call
  const lower = jdText.toLowerCase();
  const detectedRole = lower.includes('data') ? 'Data Analyst'
    : lower.includes('product') ? 'Product Manager'
    : lower.includes('hr') || lower.includes('people') ? 'HR/Business'
    : 'Software Engineer';

  const keywords = [];
  const kwPatterns = [/required skills?:([^\n]+)/gi, /you (?:will|should|must)\s+([^.\n]{10,60})/gi,
    /\d\+?\s*years?\s+(?:of\s+)?experience\s+(?:in\s+)?([^.\n]{5,40})/gi,
    /profici(?:ent|ency)\s+(?:in|with)\s+([^.,\n]{5,40})/gi,
    /experience\s+(?:in|with)\s+([^.,\n]{5,40})/gi];

  kwPatterns.forEach(pat => {
    let m;
    while ((m = pat.exec(jdText)) !== null) {
      const kw = m[1].trim().replace(/[,;].*/, '').trim();
      if (kw.length > 3 && kw.length < 60 && !keywords.includes(kw)) keywords.push(kw);
    }
  });

  const knowledgeBase = require('../data/knowledgeBase.json');
  const baseQuestions = interviewService.getQuestions(detectedRole, 'Mid', 'technical');
  const bonusQuestions = keywords.slice(0, 3).map((kw, i) => ({
    id: `jd-${i}`,
    question: `Tell me about your experience with ${kw}. How have you applied it in a professional context?`,
    topic: 'JD-Specific',
    model_answer: `Describe a concrete project or role where you used ${kw}, the impact you delivered, and what you learned.`,
    tips: ['Be specific about your role', 'Quantify impact if possible', 'Mention what you would do differently'],
  }));

  res.json({
    detectedRole,
    keywords: keywords.slice(0, 8),
    questions: [...bonusQuestions, ...baseQuestions].slice(0, 8),
  });
});

// GET /api/persona-questions?role=&level=&persona=
router.get('/persona-questions', (req, res) => {
  const { role, level, persona } = req.query;
  const baseQs = interviewService.getQuestions(role || 'Software Engineer', level || 'Mid', 'technical');

  const personaIntros = {
    friendly_hr:   { prefix: '👋 Thanks for joining us today! ', suffix: ' (Take your time — we just want to understand you better.)' },
    strict_tech:   { prefix: '⚡ No preamble — ', suffix: ' Be precise. No padding.' },
    startup_ceo:   { prefix: '🚀 Quick one — ', suffix: ' What would you do in your first 30 days?' },
  };

  const meta = personaIntros[persona] || personaIntros['friendly_hr'];
  const questions = baseQs.map(q => ({
    ...q,
    question: `${meta.prefix}${q.question}${persona === 'startup_ceo' ? meta.suffix : ''}`,
    persona,
  }));

  res.json({ questions, total: questions.length, persona });
});

module.exports = router;
