import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSubjects, subscribeDeltaMails } from '../api/client';
import AuthModal from './AuthModal';
import DeltaSpinner from './DeltaSpinner';

export default function SubscribePage() {
  const { user, logoutUser } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [difficulty, setDifficulty] = useState('mixed');
  const [customPrompt, setCustomPrompt] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchSubjects()
      .then((data) => {
        setSubjects(data);
        setSelectedSlugs(data.map((s) => s.slug));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const toggleSlug = (slug) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubError('');
    if (!email.trim() || selectedSlugs.length === 0) {
      setSubError('Enter your email and pick at least one subject.');
      return;
    }
    try {
      await subscribeDeltaMails({
        email: email.trim(),
        subjects: selectedSlugs,
        difficulty,
        custom_prompt: customPrompt,
      });
      setSubscribed(true);
    } catch {
      setSubError('Subscription failed. Please try again.');
    }
  };

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
            <button className="topbar-btn" onClick={logoutUser}>{user.username}</button>
          ) : (
            <button className="topbar-btn topbar-signin" onClick={() => setShowAuth(true)}>
              Sign In
            </button>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <section className="subscribe-page-hero">
        <div className="subscribe-page-icon">&#9993;</div>
        <h1 className="subscribe-page-title">DeltaMails</h1>
        <p className="subscribe-page-tagline">
          Daily AI-personalized interview prep, straight to your inbox.
        </p>
      </section>

      <section className="subscribe-page-form-section">
        {subscribed ? (
          <div className="subscribe-page-success">
            <div className="subscribe-page-success-icon">&#10003;</div>
            <h2>You're subscribed!</h2>
            <p>Check your inbox tomorrow at 9 AM UTC for your first DeltaMail.</p>
            <Link to="/" className="subscribe-btn" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
              Back to Delta Learn
            </Link>
          </div>
        ) : loading ? (
          <DeltaSpinner text="Loading…" />
        ) : (
          <form className="subscribe-page-form" onSubmit={handleSubscribe}>
            <div className="subscribe-page-field">
              <label className="subscribe-page-label">Email</label>
              <input
                type="email"
                className="subscribe-page-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="subscribe-page-field">
              <label className="subscribe-page-label">Subjects</label>
              <div className="deltamail-subjects">
                {subjects.map((s) => (
                  <label
                    key={s.slug}
                    className={`deltamail-chip ${selectedSlugs.includes(s.slug) ? 'active' : ''}`}
                    style={{
                      '--chip-accent': s.accentColor,
                      borderColor: selectedSlugs.includes(s.slug) ? s.accentColor : undefined,
                      background: selectedSlugs.includes(s.slug) ? s.accentColor + '22' : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSlugs.includes(s.slug)}
                      onChange={() => toggleSlug(s.slug)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ color: selectedSlugs.includes(s.slug) ? s.accentColor : undefined }}>
                      {s.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="subscribe-page-field">
              <label className="subscribe-page-label">Difficulty</label>
              <select
                className="subscribe-page-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="mixed">Mixed — a bit of everything</option>
                <option value="easy">Easy — beginner-friendly</option>
                <option value="medium">Medium — working knowledge assumed</option>
                <option value="hard">Hard — deep trade-offs & edge cases</option>
              </select>
            </div>

            <div className="subscribe-page-field">
              <label className="subscribe-page-label">
                Custom instructions <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                className="subscribe-page-input"
                placeholder='"explain like I am 5", "focus on trade-offs", "include code examples"'
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>

            {subError && <p className="subscribe-error">{subError}</p>}
            <button type="submit" className="subscribe-btn subscribe-page-btn">
              Subscribe to DeltaMails
            </button>
          </form>
        )}
      </section>

      <footer className="home-footer">
        <p>Built by <a href="https://in.linkedin.com/in/dev-kumar-seth" target="_blank" rel="noopener noreferrer">cosmoknight11 Dev Seth</a></p>
      </footer>
    </div>
  );
}
