import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ chapters, activeId, subject, onClose, className }) {
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
