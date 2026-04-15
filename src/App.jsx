import { useEffect, useRef, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChapterView from './components/ChapterView';
import HomePage from './components/HomePage';
import AuthModal from './components/AuthModal';
import NotesDrawer from './components/NotesDrawer';
import { fetchSubjectDetail, fetchChapter, fetchHighlights } from './api/client';
import './App.css';

function UserButton() {
  const { user, logoutUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <>
        <button className="topbar-btn topbar-signin" onClick={() => setShowAuth(true)}>
          Sign In
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <div className="user-menu-wrap">
      <button className="topbar-btn topbar-user" onClick={() => setMenuOpen(!menuOpen)}>
        {user.username.charAt(0).toUpperCase()}
      </button>
      {menuOpen && (
        <>
          <div className="user-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="user-menu">
            <div className="user-menu-name">{user.username}</div>
            <div className="user-menu-email">{user.email}</div>
            <hr className="user-menu-divider" />
            <button className="user-menu-item" onClick={() => { logoutUser(); setMenuOpen(false); }}>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SubjectPage() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const { subject: subjectSlug, id } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const mainRef = useRef(null);

  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [highlights, setHighlights] = useState([]);
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

  const refreshHighlights = useCallback(() => {
    if (!user) { setHighlights([]); return; }
    fetchHighlights({ subject: subjectSlug, chapter: activeId })
      .then(setHighlights)
      .catch(() => setHighlights([]));
  }, [user, subjectSlug, activeId]);

  useEffect(() => { refreshHighlights(); }, [refreshHighlights]);

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
            {user && (
              <button
                className="topbar-btn"
                onClick={() => setNotesOpen(true)}
                title="Notes"
              >
                Notes
              </button>
            )}
            <button className="topbar-btn" onClick={toggle} title="Toggle theme">
              {dark ? '☀' : '☽'}
            </button>
            <UserButton />
          </div>
        </div>

        {chapterLoading ? (
          <div className="chapter-container" style={{ textAlign: 'center', paddingTop: 120 }}>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading chapter…</p>
          </div>
        ) : (
          <ChapterView
            chapter={activeChapter}
            highlights={highlights}
            onHighlightsChange={refreshHighlights}
          />
        )}
      </div>

      {notesOpen && subject && (
        <NotesDrawer
          subjectSlug={subjectSlug}
          chapterNumber={activeId}
          onClose={() => setNotesOpen(false)}
        />
      )}
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
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:subject/chapter/:id" element={<SubjectPage />} />
          <Route path="/:subject" element={<SubjectRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
