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

module.exports = router;
