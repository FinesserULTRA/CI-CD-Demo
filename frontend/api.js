/**
 * API base URL from env. Vite injects VITE_* at build time.
 * Development: .env.development → http://localhost:5000
 * Production:  .env.production  → https://api.lifedashboard.fit
 */
const API_URL = import.meta.env.VITE_API_URL ?? '';

export function getApiUrl() {
  return API_URL.replace(/\/$/, '');
}

/** Full URL for an API path (e.g. /health → https://api.lifedashboard.fit/health) */
export function apiUrl(path) {
  const base = getApiUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

/** Fetch API health (for demo; use apiUrl() for your own endpoints) */
export async function fetchHealth() {
  const url = apiUrl('/health');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
