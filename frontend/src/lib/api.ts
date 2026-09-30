import axios from 'axios';

// In dev, VITE_API_URL is empty -> relative '/api' uses Vite proxy.
// In production (Cloudflare Pages / Vercel), set VITE_API_URL to the
// Render backend origin, e.g. https://pos-translator-api.onrender.com
export const API_ORIGIN = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '')
  : '';

export const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
