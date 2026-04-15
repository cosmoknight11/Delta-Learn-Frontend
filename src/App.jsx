import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import ChapterView from './components/ChapterView';
import HomePage from './components/HomePage';
import { fetchSubjectDetail, fetchChapter } from './api/client';
import './App.css';

function SubjectPage() {
  const { dark, toggle } = useTheme();
  const { subject: subjectSlug, id } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);

  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeId = Number(id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSubjectDetail(subjectSlug)
      .then((data) => {
        if (cancelled) return;
        setSubject(data);
        setChapters(data.chapters || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Subject not found');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [subjectSlug]);

  useEffect(() => {
    if (!subjectSlug || !activeId) return;
    let cancelled = false;
    setChapterLoading(true);
    fetchChapter(subjectSlug, activeId)
      .then((data) => {
        if (cancelled) return;
        setActiveChapter(data);
        setChapterLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setActiveChapter(null);
        setChapterLoading(false);
      });
    return () => { cancelled = true; };
  }, [subjectSlug, activeId]);

  useEffect(() => {
    if (subject) {
      document.documentElement.style.setProperty('--accent', subject.accentColor);
      return () => document.documentElement.style.setProperty('--accent', '#0a84ff');
    }
  }, [subject]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeId]);

  if (error) return <Navigate to="/" replace />;
  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading…</p>
      </div>
    );
  }

  const navTo = (chId) => navigate(`/${subjectSlug}/chapter/${chId}`);
  const navPrev = () => navTo(Math.max(1, activeId - 1));
  const navNext = () => navTo(Math.min(chapters.length, activeId + 1));

  return (
    <div className="app-shell">
      <Sidebar chapters={chapters} activeId={activeId} subject={subject} />

      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <Sidebar
            className="mobile-sidebar"
            chapters={chapters}
            activeId={activeId}
            subject={subject}
            onClose={() => setMobileOpen(false)}
          />
        </>
      )}

      <div className="main-content" ref={mainRef}>
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="topbar-btn mobile-only"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <span className="topbar-meta">
              {String(activeId).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="topbar-btn" onClick={navPrev} disabled={activeId <= 1}>
              ← Prev
            </button>
            <button className="topbar-btn" onClick={navNext} disabled={activeId >= chapters.length}>
              Next →
            </button>
            <button className="topbar-btn" onClick={toggle} title="Toggle theme">
              {dark ? '☀' : '☽'}
            </button>
          </div>
        </div>

        {chapterLoading ? (
          <div className="chapter-container" style={{ textAlign: 'center', paddingTop: 120 }}>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading chapter…</p>
          </div>
        ) : (
          <ChapterView chapter={activeChapter} />
        )}
      </div>
    </div>
  );
}

function SubjectRedirect() {
  const { subject } = useParams();
  const [valid, setValid] = useState(null);

  useEffect(() => {
    fetchSubjectDetail(subject)
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [subject]);

  if (valid === null) return null;
  if (!valid) return <Navigate to="/" replace />;
  return <Navigate to={`/${subject}/chapter/1`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:subject/chapter/:id" element={<SubjectPage />} />
        <Route path="/:subject" element={<SubjectRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
