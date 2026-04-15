import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchHighlights, deleteHighlight } from '../api/client';
import AuthModal from './AuthModal';
import DeltaSpinner from './DeltaSpinner';

const COLORS = {
  yellow: '#ffd600',
  green: '#30d158',
  blue: '#0a84ff',
  pink: '#ff375f',
};

function groupHighlights(highlights) {
  const subjects = {};
  for (const h of highlights) {
    const sKey = h.chapter_slug;
    if (!subjects[sKey]) {
      subjects[sKey] = { name: h.subject_name, slug: sKey, parts: {} };
    }
    const partKey = h.chapter_part || '(No part)';
    if (!subjects[sKey].parts[partKey]) {
      subjects[sKey].parts[partKey] = {};
    }
    const chKey = h.chapter_number;
    if (!subjects[sKey].parts[partKey][chKey]) {
      subjects[sKey].parts[partKey][chKey] = {
        number: h.chapter_number,
        title: h.chapter_title,
        slug: h.chapter_slug,
        items: [],
      };
    }
    subjects[sKey].parts[partKey][chKey].items.push(h);
  }
  return subjects;
}

export default function HighlightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchHighlights()
      .then((data) => { setHighlights(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleDelete(id) {
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }

  const grouped = groupHighlights(highlights);
  const subjectKeys = Object.keys(grouped);

  return (
    <div className="home-page">
      <div className="home-topbar">
        <div className="home-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
            <img src="/favicon.svg" alt="Delta" className="home-logo-small" />
            <span>Delta Learn</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <button className="topbar-btn" onClick={() => navigate('/')}>{user.username}</button>
          ) : (
            <button className="topbar-btn topbar-signin" onClick={() => setShowAuth(true)}>
              Sign In
            </button>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <section className="hl-page-hero">
        <h1 className="hl-page-title">My Highlights</h1>
        <p className="hl-page-tagline">
          Everything you've highlighted, organized by subject and chapter.
        </p>
      </section>

      <section className="hl-page-content">
        {!user ? (
          <div className="hl-empty">
            <p>Sign in to view your highlights.</p>
            <button className="subscribe-btn" onClick={() => setShowAuth(true)}>Sign In</button>
          </div>
        ) : loading ? (
          <DeltaSpinner text="Loading highlights…" />
        ) : subjectKeys.length === 0 ? (
          <div className="hl-empty">
            <div className="hl-empty-icon">&#9998;</div>
            <h2>No highlights yet</h2>
            <p>Select text in any chapter and pick a color to start highlighting.</p>
            <Link to="/" className="subscribe-btn" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>
              Browse subjects
            </Link>
          </div>
        ) : (
          subjectKeys.map((sKey) => {
            const subj = grouped[sKey];
            const partKeys = Object.keys(subj.parts);
            return (
              <div key={sKey} className="hl-subject-group">
                <h2 className="hl-subject-name">{subj.name}</h2>
                {partKeys.map((partKey) => {
                  const chapters = subj.parts[partKey];
                  const chKeys = Object.keys(chapters).sort((a, b) => a - b);
                  return (
                    <div key={partKey} className="hl-part-group">
                      {partKey !== '(No part)' && (
                        <h3 className="hl-part-name">{partKey}</h3>
                      )}
                      {chKeys.map((chKey) => {
                        const ch = chapters[chKey];
                        return (
                          <div key={chKey} className="hl-chapter-group">
                            <Link
                              to={`/${ch.slug}/chapter/${ch.number}`}
                              className="hl-chapter-header"
                            >
                              <span className="hl-ch-num">
                                {String(ch.number).padStart(2, '0')}
                              </span>
                              {ch.title}
                            </Link>
                            <div className="hl-items">
                              {ch.items.map((h) => (
                                <div
                                  key={h.id}
                                  className="hl-item"
                                  style={{ borderLeftColor: COLORS[h.color] || COLORS.yellow }}
                                >
                                  <Link
                                    to={`/${h.chapter_slug}/chapter/${h.chapter_number}`}
                                    className="hl-item-text"
                                  >
                                    {h.text}
                                  </Link>
                                  <span className="hl-item-q">Q{h.question_index + 1}</span>
                                  <button
                                    className="hl-item-delete"
                                    onClick={() => handleDelete(h.id)}
                                    title="Remove highlight"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </section>

      <footer className="home-footer">
        <p>Built by <a href="https://in.linkedin.com/in/dev-kumar-seth" target="_blank" rel="noopener noreferrer">cosmoknight11 Dev Seth</a></p>
      </footer>
    </div>
  );
}
