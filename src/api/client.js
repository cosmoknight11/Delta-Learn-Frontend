const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export function fetchSubjects() {
  return apiFetch('/subjects/');
}

export function fetchSubjectDetail(slug) {
  return apiFetch(`/subjects/${slug}/`);
}

export function fetchChapter(slug, chapterNumber) {
  return apiFetch(`/subjects/${slug}/chapters/${chapterNumber}/`);
}
