import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchSubjects } from '../api/client';
import AuthModal from './AuthModal';

export default function HomePage() {
  const { dark, toggle } = useTheme();
  const { user, logoutUser } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchSubjects()
      .then((data) => { setSubjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="home-page">
      <div className="home-topbar">
        <div className="home-brand">
          <img src="/favicon.svg" alt="Delta" className="home-logo-small" />
          <span>Delta Learn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="topbar-btn" onClick={toggle} title="Toggle theme">
            {dark ? '☀' : '☽'}
          </button>
          {user ? (
            <button className="topbar-btn" onClick={logoutUser}>{user.username}</button>
          ) : (
            <button className="topbar-btn topbar-signin" onClick={() => setShowAuth(true)}>
              Sign In
            </button>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <section className="home-hero">
        <img src="/favicon.svg" alt="Delta" className="home-logo" />
        <h1 className="home-title">Delta Learn</h1>
        <p className="home-tagline">Master tech interviews, one subject at a time.</p>
        <p className="home-subtitle">
          Free interactive guides with Q&A-driven content, diagrams, real interviewer questions, and pattern-based learning.
        </p>
      </section>

      <section className="home-subjects">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1', textAlign: 'center' }}>
            Loading subjects…
          </p>
        ) : (
          subjects.map((s) => (
            <Link
              key={s.slug}
              to={`/${s.slug}/chapter/1`}
              className="subject-card"
              style={{ '--subject-accent': s.accentColor }}
            >
              <div className="subject-card-header">
                <span
                  className="subject-card-badge"
                  style={{ background: s.accentColor + '22', color: s.accentColor }}
                >
                  {s.chapter_count} chapters
                </span>
              </div>
              <h2 className="subject-card-title">{s.name}</h2>
              <p className="subject-card-desc">{s.description}</p>
              <div className="subject-card-progress">
                <div className="subject-card-bar">
                  <div
                    className="subject-card-fill"
                    style={{
                      width: `${s.chapter_count ? (s.written_count / s.chapter_count) * 100 : 0}%`,
                      background: s.accentColor,
                    }}
                  />
                </div>
                <span className="subject-card-stat">
                  {s.written_count} / {s.chapter_count} written
                </span>
              </div>
            </Link>
          ))
        )}
      </section>

      <section className="home-subscribe">
        <h2 className="subscribe-title">Stay Updated</h2>
        <p className="subscribe-desc">Get notified when new chapters are published. No spam, ever.</p>
        {subscribed ? (
          <p className="subscribe-success">Thanks for subscribing!</p>
        ) : (
          <form className="subscribe-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              className="subscribe-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="subscribe-btn">Subscribe</button>
          </form>
        )}
      </section>

      <footer className="home-footer">
        <p>Built by <a href="https://in.linkedin.com/in/dev-kumar-seth" target="_blank" rel="noopener noreferrer">cosmoknight11 Dev Seth</a></p>
      </footer>
    </div>
  );
}
