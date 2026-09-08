const { v4: uuidv4 } = require('uuid');

// In-memory session store (swap for SQLite/Postgres in production)
const sessions = new Map();

function createSession({ name, role, level, resumeText }) {
  const id = uuidv4();
  const session = {
    id,
    name,
    role,
    level,
    resumeText: resumeText || '',
    answers: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id) || null;
}

function addAnswer(sessionId, answerData) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.answers.push({ ...answerData, answeredAt: new Date().toISOString() });
  return session;
}

function completeSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.completedAt = new Date().toISOString();
  return session;
}

function getAllSessions() {
  return Array.from(sessions.values());
}

module.exports = { createSession, getSession, addAnswer, completeSession, getAllSessions };
