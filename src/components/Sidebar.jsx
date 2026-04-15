import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchSubscriptions,
  subscribeDeltaMails,
  unsubscribeDeltaMails,
} from '../api/client';

export default function Sidebar({ chapters, activeId, subject, onClose, className }) {
  const { user } = useAuth();
  const [mailActive, setMailActive] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailEmail, setMailEmail] = useState('');

  useEffect(() => {
    if (!user) { setMailActive(false); return; }
    fetchSubscriptions()
      .then((subs) => {
        const match = subs.find((s) => s.subject_slug === subject?.slug);
        setMailActive(!!match);
        if (match) setMailEmail(match.email || '');
      })
      .catch(() => {});
  }, [user, subject?.slug]);

  const toggleMail = async () => {
    if (!user) return;
    setMailLoading(true);
    try {
      if (mailActive) {
        await unsubscribeDeltaMails({ email: user.email, subject: subject.slug });
        setMailActive(false);
      } else {
        await subscribeDeltaMails({
          email: user.email,
          subjects: [subject.slug],
          difficulty: 'mixed',
        });
        setMailActive(true);
      }
    } catch { /* silently fail */ }
    setMailLoading(false);
  };
  const grouped = useMemo(() => {
    const items = [];
    let lastPart = '';
    for (const ch of chapters) {
      const newPart = ch.part && ch.part !== lastPart;
      if (newPart) lastPart = ch.part;
      items.push({ ch, showPart: newPart });
    }
    return items;
  }, [chapters]);

  return (
    <nav className={className || 'sidebar'}>
      <div className="sidebar-brand">
        <Link to="/" className="sidebar-home-link" title="Back to Delta Learn">
          <img src="/favicon.svg" alt="Delta" className="sidebar-logo" />
        </Link>
        <Link
          to={`/${subject.slug}/chapter/1`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <span className="sidebar-brand-name">{subject.name}</span>
        </Link>
      </div>

      {user && (
        <div className="sidebar-deltamail">
          <span className="sidebar-deltamail-label">DeltaMails</span>
          <button
            className={`sidebar-deltamail-toggle ${mailActive ? 'active' : ''}`}
            onClick={toggleMail}
            disabled={mailLoading}
            title={mailActive ? 'Unsubscribe from DeltaMails' : 'Subscribe to DeltaMails'}
          >
            <span className="sidebar-toggle-knob" />
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {grouped.map(({ ch, showPart }) => (
          <div key={ch.id}>
            {showPart && <div className="sidebar-part">{ch.part}</div>}
            <Link
              to={`/${subject.slug}/chapter/${ch.id}`}
              onClick={() => onClose?.()}
              className={`sidebar-link ${activeId === ch.id ? 'active' : ''}`}
            >
              <span className="ch-num">{String(ch.id).padStart(2, '0')}</span>
              {ch.title}
            </Link>
          </div>
        ))}
      </div>
    </nav>
  );
}
