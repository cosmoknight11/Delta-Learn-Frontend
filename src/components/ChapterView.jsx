import MermaidDiagram from './MermaidDiagram';

export default function ChapterView({ chapter }) {
  if (!chapter) {
    return (
      <div className="chapter-container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <h2 style={{ color: 'var(--text-tertiary)' }}>Select a chapter</h2>
      </div>
    );
  }

  const total = chapter.questions?.length || 0;

  return (
    <div className="chapter-container">
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

      {chapter.questions?.map((q, i) => (
        <QASection key={i} q={q} index={i} total={total} />
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
    </div>
  );
}

function QASection({ q, index, total }) {
  return (
    <section className="qa">
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
