const axios = require('axios');

const WATSONX_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
const MODEL_ID = process.env.WATSONX_MODEL_ID || 'ibm/granite-3-3-8b-instruct';
const PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const API_KEY = process.env.WATSONX_API_KEY;

let cachedToken = null;
let tokenExpiry = 0;

async function getIAMToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: API_KEY,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken;
}

async function evaluateWithGranite({ question, userAnswer, modelAnswer, role, level }) {
  const token = await getIAMToken();

  const prompt = `You are an expert interview coach evaluating a job candidate's answer.

Role: ${role} (${level} level)
Question: ${question}
Candidate's Answer: ${userAnswer}
Model Answer (for reference): ${modelAnswer}

Evaluate the candidate's answer on these 5 dimensions, scoring each from 1-10:
- Clarity: How clearly structured and communicated
- Confidence: Shows conviction and ownership
- Specificity: Uses concrete examples and data
- Ownership: Uses first-person, shows personal accountability
- Relevance: Directly addresses the question

Also provide:
1. Three specific, actionable improvement tips (be concrete and constructive)
2. A one-sentence overall feedback summary

Respond ONLY in this exact JSON format:
{
  "scores": {
    "clarity": <number>,
    "confidence": <number>,
    "specificity": <number>,
    "ownership": <number>,
    "relevance": <number>,
    "overall": <number>
  },
  "tips": ["tip1", "tip2", "tip3"],
  "feedback": "one sentence overall feedback"
}`;

  const response = await axios.post(
    WATSONX_URL,
    {
      model_id: MODEL_ID,
      project_id: PROJECT_ID,
      input: prompt,
      parameters: {
        decoding_method: 'greedy',
        max_new_tokens: 500,
        min_new_tokens: 50,
        stop_sequences: ['}'],
        repetition_penalty: 1.1,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const rawText = response.data?.results?.[0]?.generated_text || '';
  const jsonText = rawText.trim() + '}';

  let parsed;
  try {
    // Extract JSON from the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : jsonText);
  } catch {
    throw new Error('Failed to parse LLM response as JSON');
  }

  // Validate and normalise scores
  const scores = parsed.scores || {};
  const normalize = (v) => Math.min(10, Math.max(1, Math.round(Number(v) || 5)));

  return {
    scores: {
      clarity: normalize(scores.clarity),
      confidence: normalize(scores.confidence),
      specificity: normalize(scores.specificity),
      ownership: normalize(scores.ownership),
      relevance: normalize(scores.relevance),
      overall: normalize(scores.overall),
    },
    modelAnswer,
    tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
    feedback: parsed.feedback || 'Keep practicing and refining your answers.',
  };
}

module.exports = { evaluateWithGranite };
