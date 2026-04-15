const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getTokens() {
  try {
    return JSON.parse(localStorage.getItem('delta_tokens'));
  } catch {
    return null;
  }
}

function setTokens(tokens) {
  localStorage.setItem('delta_tokens', JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem('delta_tokens');
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const tokens = getTokens();

  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && tokens?.refresh) {
    const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (refreshRes.ok) {
      const newTokens = await refreshRes.json();
      setTokens({ access: newTokens.access, refresh: newTokens.refresh || tokens.refresh });
      headers['Authorization'] = `Bearer ${newTokens.access}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      throw new Error('Session expired');
    }
  }

  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  if (res.status === 204) return null;
  return res.json();
}

// ── Public ──

export function fetchSubjects() {
  return apiFetch('/subjects/');
}

export function fetchSubjectDetail(slug) {
  return apiFetch(`/subjects/${slug}/`);
}

export function fetchChapter(slug, chapterNumber) {
  return apiFetch(`/subjects/${slug}/chapters/${chapterNumber}/`);
}

// ── Auth ──

export async function register(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(Object.values(err).flat().join(' '));
  }
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid username or password');
  const tokens = await res.json();
  setTokens(tokens);
  return tokens;
}

export function logout() {
  clearTokens();
}

export function fetchMe() {
  return apiFetch('/auth/me/');
}

export function isLoggedIn() {
  return !!getTokens()?.access;
}

// ── Highlights ──

export function fetchHighlights(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/highlights/${qs ? '?' + qs : ''}`);
}

export function createHighlight(data) {
  return apiFetch('/highlights/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateHighlight(id, data) {
  return apiFetch(`/highlights/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteHighlight(id) {
  return apiFetch(`/highlights/${id}/`, { method: 'DELETE' });
}

// ── Notes ──

export function fetchNotes(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/notes/${qs ? '?' + qs : ''}`);
}

export function createNote(data) {
  return apiFetch('/notes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateNote(id, data) {
  return apiFetch(`/notes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteNote(id) {
  return apiFetch(`/notes/${id}/`, { method: 'DELETE' });
}

export function analyzeNote(id) {
  return apiFetch(`/notes/${id}/analyze/`, { method: 'POST' });
}

// ── DeltaMails ──

export function fetchSubscriptions() {
  return apiFetch('/deltamails/');
}

export function subscribeDeltaMails(data) {
  return apiFetch('/deltamails/subscribe/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSubscriptionPreferences(id, data) {
  return apiFetch(`/deltamails/${id}/preferences/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function unsubscribeDeltaMails(data) {
  return apiFetch('/deltamails/unsubscribe/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
