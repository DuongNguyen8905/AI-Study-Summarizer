import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-study-summarizer-zjvl.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const loginApi = (data) => api.post('/auth/login', data);
export const registerApi = (data) => api.post('/auth/register', data);
export const getMeApi = () => api.get('/auth/me');

// Summarize APIs
export const summarizeYoutubeApi = (url) => api.post('/summarize/youtube', { url });
export const summarizeDocumentApi = (formData) => api.post('/summarize/document', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Chat APIs
export const getChatHistoryApi = (docId) => api.get(`/chat/${docId}`);
export const sendChatMessageApi = (docId, message) => api.post(`/chat/${docId}`, { message });

// History APIs
export const getHistoryApi = () => api.get('/history');
export const getDocumentDetailApi = (docId) => api.get(`/documents/${docId}`);
export const deleteDocumentApi = (docId) => api.delete(`/documents/${docId}`);

export default api;
