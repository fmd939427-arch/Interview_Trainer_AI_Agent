import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: BASE });

export const createSession = (data) => api.post('/api/session', data).then(r => r.data);
export const getRoles = () => api.get('/api/roles').then(r => r.data);
export const getQuestions = (role, level, type) =>
  api.get('/api/questions', { params: { role, level, type } }).then(r => r.data);
export const submitAnswer = (data) => api.post('/api/answer', data).then(r => r.data);
export const getSummary = (sessionId) => api.get(`/api/summary/${sessionId}`).then(r => r.data);

export default api;
