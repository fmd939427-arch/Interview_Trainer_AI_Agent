# 🎓 Interview Trainer AI

An AI-powered interview preparation agent built with **IBM Granite** (via watsonx.ai), React, and Node.js/Express. Get tailored interview questions, submit your answers, and receive instant AI feedback with scores, model answers, and improvement tips.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- npm 9+

### 1. Clone / open the project
```bash
cd Interview_Trainer_Agent
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` and set your IBM watsonx credentials:
```
PORT=4000
WATSONX_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=97d008c4-bfb5-471a-a1fa-2d0c5f2fadfa
WATSONX_URL=https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29
WATSONX_MODEL_ID=ibm/granite-3-3-8b-instruct
```

### 3. Install & start the backend
```bash
cd backend
npm install
npm start
# API running at http://localhost:4000
```

### 4. Install & start the frontend (new terminal)
```bash
cd frontend
npm install
npm start
# App opens at http://localhost:3000
```

---

## 📁 Project Structure

```
Interview_Trainer_Agent/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── routes/api.js         # REST API routes
│   │   ├── services/
│   │   │   ├── interviewService.js  # Core logic (questions, evaluation, summary)
│   │   │   └── watsonxService.js    # IBM Granite LLM integration
│   │   ├── db/sessionStore.js    # In-memory session storage
│   │   └── data/knowledgeBase.json  # Question bank + rubric
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                # Router + theme context
│   │   ├── index.js/css          # Entry point + Tailwind
│   │   ├── pages/
│   │   │   ├── LandingPage.js    # Hero + features + CTA
│   │   │   ├── OnboardingPage.js # Profile setup form
│   │   │   ├── SessionPage.js    # Chat-style Q&A + feedback
│   │   │   └── SummaryPage.js    # Session results + strengths
│   │   ├── components/
│   │   │   └── ScoreRing.js      # Animated score circle
│   │   └── utils/api.js          # Axios API client
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session` | Create a new interview session |
| GET | `/api/questions?role=&level=&type=` | Get tailored questions |
| POST | `/api/answer` | Submit answer, get AI evaluation |
| GET | `/api/summary/:sessionId` | Get session summary |
| GET | `/api/roles` | Get available roles and levels |
| GET | `/health` | Health check |

### POST `/api/session`
```json
{ "name": "Alex", "role": "Software Engineer", "level": "Mid", "resumeText": "" }
```

### POST `/api/answer`
```json
{ "sessionId": "...", "question": "...", "userAnswer": "...", "modelAnswer": "...", "role": "...", "level": "..." }
```
Returns:
```json
{
  "scores": { "clarity": 8, "confidence": 7, "specificity": 6, "ownership": 8, "relevance": 9, "overall": 8 },
  "modelAnswer": "...",
  "tips": ["tip1", "tip2", "tip3"],
  "feedback": "Overall assessment sentence."
}
```

---

## 🧠 AI Model

- **Model**: IBM Granite 3.3 8B Instruct (`ibm/granite-3-3-8b-instruct`)
- **Platform**: IBM watsonx.ai
- **Fallback**: Heuristic scoring (keyword overlap + length analysis) when LLM is unavailable
- **Rubric**: 5 dimensions — Clarity, Confidence, Specificity, Ownership, Relevance (each 1–10)

---

## 🎯 Supported Roles & Levels

**Roles**: Software Engineer, Data Analyst, Product Manager, HR/Business  
**Levels**: Entry (0–2yr), Mid (2–5yr), Senior (5yr+)  
**Modes**: Technical (role-specific) + Behavioral (STAR framework)

---

## 🔧 Extending the Knowledge Base

Edit `backend/src/data/knowledgeBase.json` to add questions:

```json
{
  "technical": {
    "Your New Role": {
      "Entry": [
        {
          "id": "role-e-1",
          "question": "Your question here",
          "topic": "Topic name",
          "model_answer": "Comprehensive model answer",
          "tips": ["Tip 1", "Tip 2", "Tip 3"]
        }
      ]
    }
  }
}
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router, Framer Motion |
| Backend | Node.js 18, Express 4, Axios |
| AI | IBM Granite via watsonx.ai REST API |
| Storage | In-memory (Map) — swap for SQLite/PostgreSQL |
| Styling | Tailwind CSS (dark/light mode, custom animations) |

---

## 🌙 Features

- ✅ Dark/light mode toggle
- ✅ Responsive (mobile → desktop)
- ✅ IBM Granite AI scoring (5-dimension rubric)
- ✅ Heuristic fallback if LLM unavailable
- ✅ Resume drag & drop upload
- ✅ Technical + Behavioral modes
- ✅ Session progress tracking
- ✅ Animated score rings
- ✅ Model answers side-by-side
- ✅ Session summary with strengths/improvements
