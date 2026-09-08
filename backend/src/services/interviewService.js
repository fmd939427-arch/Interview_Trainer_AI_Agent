const knowledgeBase = require('../data/knowledgeBase.json');
const watsonxService = require('./watsonxService');

/**
 * Get tailored questions for a given role, level, and type.
 */
function getQuestions(role, level, type = 'technical') {
  if (type === 'behavioral') {
    return knowledgeBase.behavioral;
  }

  const roleData = knowledgeBase.technical[role];
  if (!roleData) {
    // Fallback to Software Engineer if role not found
    return knowledgeBase.technical['Software Engineer'][level] || [];
  }

  const levelData = roleData[level];
  if (!levelData || levelData.length === 0) {
    // Fallback to Entry level
    return roleData['Entry'] || [];
  }

  return levelData;
}

/**
 * Evaluate a user's answer using IBM Granite via watsonx.ai.
 * Falls back to heuristic scoring if LLM is unavailable.
 */
async function evaluateAnswer(question, userAnswer, modelAnswer, role, level) {
  try {
    const llmResult = await watsonxService.evaluateWithGranite({
      question,
      userAnswer,
      modelAnswer,
      role,
      level,
    });
    return llmResult;
  } catch (err) {
    console.warn('[evaluateAnswer] LLM unavailable, using heuristic fallback:', err.message);
    return heuristicEvaluate(userAnswer, modelAnswer);
  }
}

/**
 * Heuristic fallback scoring when LLM is unavailable.
 */
function heuristicEvaluate(userAnswer, modelAnswer) {
  const wordCount = userAnswer.trim().split(/\s+/).length;
  const modelWords = new Set(modelAnswer.toLowerCase().split(/\W+/));
  const userWords = userAnswer.toLowerCase().split(/\W+/);
  const overlap = userWords.filter(w => w.length > 4 && modelWords.has(w)).length;
  const overlapRatio = Math.min(overlap / Math.max(modelWords.size * 0.2, 1), 1);

  const clarity = Math.min(3 + Math.round(wordCount / 40), 9);
  const specificity = Math.min(2 + Math.round(overlapRatio * 8), 10);
  const confidence = wordCount > 30 ? 7 : 5;
  const ownership = /\bi\b|\bmy\b|\bme\b/i.test(userAnswer) ? 7 : 5;
  const relevance = overlapRatio > 0.3 ? 8 : 5;

  const overall = Math.round((clarity + specificity + confidence + ownership + relevance) / 5);

  return {
    scores: { clarity, confidence, specificity, ownership, relevance, overall },
    modelAnswer,
    tips: [
      wordCount < 50 ? 'Expand your answer with more specific details and examples.' : 'Good length — make sure each sentence adds value.',
      overlapRatio < 0.2 ? 'Try to include more key concepts relevant to the question.' : 'You covered key concepts well.',
      !/\bi\b|\bmy\b|\bme\b/i.test(userAnswer) ? "Use first-person language to show personal ownership ('I led...', 'I built...')." : 'Good use of first-person — shows personal accountability.',
    ],
    feedback: generateFeedbackSummary(overall),
  };
}

function generateFeedbackSummary(score) {
  if (score >= 8) return 'Excellent answer! Clear, specific, and confident.';
  if (score >= 6) return 'Good answer with room to add more specificity and examples.';
  if (score >= 4) return 'Decent start — focus on concrete examples and clearer structure.';
  return 'This answer needs more depth. Review the model answer and try to incorporate key concepts.';
}

/**
 * Generate session summary from all answers.
 */
function generateSummary(answers) {
  if (!answers || answers.length === 0) {
    return { strengths: [], improvements: [], averageScore: 0, totalAnswered: 0 };
  }

  const allScores = answers.map(a => a.scores?.overall || 0);
  const averageScore = Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length);

  const dimensionScores = {};
  const dimensions = ['clarity', 'confidence', 'specificity', 'ownership', 'relevance'];

  dimensions.forEach(dim => {
    const vals = answers.map(a => a.scores?.[dim] || 0);
    dimensionScores[dim] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  });

  const sorted = Object.entries(dimensionScores).sort(([, a], [, b]) => b - a);
  const strengths = sorted.slice(0, 2).map(([k]) => ({
    area: k.charAt(0).toUpperCase() + k.slice(1),
    description: knowledgeBase.rubric[k],
    score: dimensionScores[k],
  }));
  const improvements = sorted.slice(3).map(([k]) => ({
    area: k.charAt(0).toUpperCase() + k.slice(1),
    description: knowledgeBase.rubric[k],
    score: dimensionScores[k],
  }));

  return {
    averageScore,
    totalAnswered: answers.length,
    dimensionScores,
    strengths,
    improvements,
    rating: averageScore >= 8 ? 'Outstanding' : averageScore >= 6 ? 'Strong' : averageScore >= 4 ? 'Developing' : 'Needs Practice',
  };
}

module.exports = { getQuestions, evaluateAnswer, generateSummary };
