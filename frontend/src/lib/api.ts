import axios from 'axios';

// In dev, VITE_API_URL is empty -> relative '/api' uses Vite proxy.
// In production (Cloudflare Pages / Vercel), set VITE_API_URL to the
// Render backend origin, e.g. https://pos-translator-api.onrender.com
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
