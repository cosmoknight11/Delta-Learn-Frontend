import { useCallback, useEffect, useRef, useState } from 'react';
import MermaidDiagram from './MermaidDiagram';
import HighlightPopup from './HighlightPopup';
import { useAuth } from '../context/AuthContext';
import { createHighlight, deleteHighlight } from '../api/client';

const HIGHLIGHT_COLORS = {
  yellow: 'rgba(255,214,0,0.28)',
  green: 'rgba(48,209,88,0.25)',
  blue: 'rgba(10,132,255,0.22)',
  pink: 'rgba(255,55,95,0.22)',
};

export default function ChapterView({ chapter, highlights = [], onHighlightsChange }) {
  const { user } = useAuth();
  const [popup, setPopup] = useState(null);
  const containerRef = useRef(null);

  const handleTextSelect = useCallback((questionIndex) => {
    if (!user) return;
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 3) { setPopup(null); return; }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setPopup({
      text,
      questionIndex,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
    });
  }, [user]);

  useEffect(() => {
    function onClickOutside() { setPopup(null); }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  async function handleSaveHighlight(color) {
    if (!popup || !chapter) return;
    await createHighlight({
      chapter: chapter._dbId,
      question_index: popup.questionIndex,
      text: popup.text,
      color,
    });
    setPopup(null);
    window.getSelection()?.removeAllRanges();
    onHighlightsChange?.();
  }

  async function handleDeleteHighlight(id) {
    await deleteHighlight(id);
    onHighlightsChange?.();
  }

  if (!chapter) {
    return (
      <div className="chapter-container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <h2 style={{ color: 'var(--text-tertiary)' }}>Select a chapter</h2>
      </div>
    );
  }

  const total = chapter.questions?.length || 0;
  const chapterHighlights = highlights.filter(h => h.chapter_number === chapter.id);

  return (
    <div className="chapter-container" ref={containerRef} style={{ position: 'relative' }}>
      <header className="chapter-header">
        {chapter.part && (
          <span className="chapter-part-badge">{chapter.part}</span>
        )}
        <h1 className="chapter-title">{chapter.title}</h1>
        {chapter.subtitle && (
          <p className="chapter-subtitle">{chapter.subtitle}</p>
        )}
        {total > 0 && (
          <div className="chapter-count">{total} questions covering the full topic</div>
        )}
      </header>

      {user && chapterHighlights.length > 0 && (
        <div className="highlights-bar">
          <div className="highlights-bar-title">Your Highlights ({chapterHighlights.length})</div>
          <div className="highlights-list">
            {chapterHighlights.map((h) => (
              <div key={h.id} className="highlight-chip" style={{ borderLeftColor: HIGHLIGHT_COLORS[h.color]?.replace(/[\d.]+\)$/, '1)') }}>
                <span className="highlight-chip-text">{h.text}</span>
                <button
                  className="highlight-chip-delete"
                  onClick={() => handleDeleteHighlight(h.id)}
                  title="Remove highlight"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {chapter.questions?.map((q, i) => (
        <QASection
          key={i}
          q={q}
          index={i}
          total={total}
          onMouseUp={() => handleTextSelect(i)}
        />
      ))}

      {chapter.takeaways?.length > 0 && (
        <div className="takeaways">
          <div className="takeaways-title">Rapid Recall</div>
          <div className="takeaways-grid">
            {chapter.takeaways.map((t, i) => (
              <div key={i} className="takeaway-item" dangerouslySetInnerHTML={{ __html: t }} />
            ))}
          </div>
        </div>
      )}

      {popup && (
        <HighlightPopup
          x={popup.x}
          y={popup.y}
          onSave={handleSaveHighlight}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

function QASection({ q, index, total, onMouseUp }) {
  return (
    <section className="qa" onMouseUp={onMouseUp}>
      <div className="qa-header">
        <span className="qa-num">{String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
        {q.difficulty && (
          <span className={`qa-diff qa-diff-${q.difficulty}`}>{q.difficulty}</span>
        )}
      </div>

      <h2 className="qa-question">{q.question}</h2>

      {q.tldr && <div className="qa-tldr">{q.tldr}</div>}

      {q.answer && (
        <div className="qa-answer" dangerouslySetInnerHTML={{ __html: q.answer }} />
      )}

      {q.diagram && (
        <MermaidDiagram chart={q.diagram} caption={q.diagramCaption} />
      )}

      {q.points && (
        <div className="qa-points">
          {q.points.map((p, i) => (
            <div key={i} className="qa-point">
              <span className="qa-point-marker" />
              <div dangerouslySetInnerHTML={{ __html: p }} />
            </div>
          ))}
        </div>
      )}

      {q.table && (
        <div className="qa-table-wrap">
          <table className="qa-table">
            <thead>
              <tr>{q.table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {q.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} dangerouslySetInnerHTML={{ __html: cell }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {q.diagram2 && (
        <MermaidDiagram chart={q.diagram2} caption={q.diagram2Caption} />
      )}

      {q.followup && (
        <div className="qa-followup">
          <div className="qa-followup-label">Follow-up the interviewer will ask</div>
          <div dangerouslySetInnerHTML={{ __html: q.followup }} />
        </div>
      )}
    </section>
  );
}
