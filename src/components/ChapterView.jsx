import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MermaidDiagram from './MermaidDiagram';
import HighlightPopup from './HighlightPopup';
import { useAuth } from '../context/AuthContext';
import { createHighlight, updateHighlight, deleteHighlight } from '../api/client';

const INLINE_HL_COLORS = {
  yellow: 'rgba(255,214,0,0.35)',
  green:  'rgba(48,209,88,0.32)',
  blue:   'rgba(10,132,255,0.30)',
  pink:   'rgba(255,55,95,0.30)',
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearInlineMarks(root) {
  root.querySelectorAll('mark.inline-hl').forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  root.normalize();
}

function markTextInDOM(container, searchText, bgColor) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);
  if (!textNodes.length) return;

  let full = '';
  const nodeInfo = [];
  for (const node of textNodes) {
    nodeInfo.push({ node, start: full.length });
    full += node.textContent;
  }

  let matchStart = -1;
  let matchLen = 0;

  const exactIdx = full.indexOf(searchText);
  if (exactIdx !== -1) {
    matchStart = exactIdx;
    matchLen = searchText.length;
  } else {
    const words = searchText.split(/\s+/).filter(Boolean);
    if (!words.length) return;
    try {
      const pattern = words.map(escapeRegExp).join('\\s*');
      const m = new RegExp(pattern).exec(full);
      if (!m) return;
      matchStart = m.index;
      matchLen = m[0].length;
    } catch { return; }
  }

  const matchEnd = matchStart + matchLen;

  const affected = [];
  for (const info of nodeInfo) {
    const nodeEnd = info.start + info.node.textContent.length;
    if (nodeEnd <= matchStart || info.start >= matchEnd) continue;
    affected.push({
      node: info.node,
      localStart: Math.max(0, matchStart - info.start),
      localEnd: Math.min(info.node.textContent.length, matchEnd - info.start),
    });
  }

  for (let i = affected.length - 1; i >= 0; i--) {
    const { node, localStart, localEnd } = affected[i];
    const text = node.textContent;
    const mark = document.createElement('mark');
    mark.className = 'inline-hl';
    mark.style.background = bgColor;

    if (localStart === 0 && localEnd === text.length) {
      node.parentNode.insertBefore(mark, node);
      mark.appendChild(node);
    } else {
      const frag = document.createDocumentFragment();
      if (localStart > 0) frag.appendChild(document.createTextNode(text.slice(0, localStart)));
      mark.textContent = text.slice(localStart, localEnd);
      frag.appendChild(mark);
      if (localEnd < text.length) frag.appendChild(document.createTextNode(text.slice(localEnd)));
      node.parentNode.replaceChild(frag, node);
    }
  }
}

function applyHighlightsToDOM(root, highlights) {
  clearInlineMarks(root);
  if (!highlights.length) return;
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);
  for (const h of sorted) {
    const color = INLINE_HL_COLORS[h.color] || INLINE_HL_COLORS.yellow;
    markTextInDOM(root, h.text, color);
  }
}

export default function ChapterView({ chapter, highlights = [], onHighlightsChange }) {
  const { user } = useAuth();
  const [popup, setPopup] = useState(null);
  const containerRef = useRef(null);

  const chapterRef = useRef(chapter);
  const refreshRef = useRef(onHighlightsChange);
  useEffect(() => { chapterRef.current = chapter; }, [chapter]);
  useEffect(() => { refreshRef.current = onHighlightsChange; }, [onHighlightsChange]);

  const chapterHighlights = useMemo(
    () => highlights.filter(h => h.chapter_number === chapter?.id),
    [highlights, chapter?.id],
  );

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    applyHighlightsToDOM(containerRef.current, chapterHighlights);
  }, [chapterHighlights, chapter]);

  const savingRef = useRef(false);
  const undoStackRef = useRef([]);

  useEffect(() => {
    if (!user) return;
    let timer = null;

    function onSelectionChange() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (savingRef.current) return;
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (!text || text.length < 3) return;

        const anchor = sel.anchorNode;
        if (!anchor) return;
        const container = containerRef.current;
        if (!container || !container.contains(anchor)) return;

        const section = anchor.nodeType === Node.ELEMENT_NODE
          ? anchor.closest('.qa[data-qi]')
          : anchor.parentElement?.closest('.qa[data-qi]');
        if (!section) return;
        const qi = Number(section.dataset.qi);
        if (Number.isNaN(qi)) return;

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top - 8;

        savingRef.current = true;
        try {
          const saved = await createHighlight({
            chapter: chapterRef.current._dbId,
            question_index: qi,
            text,
            color: 'yellow',
          });
          window.getSelection()?.removeAllRanges();
          undoStackRef.current.push(saved.id);
          refreshRef.current?.();
          setPopup({ highlightId: saved.id, x, y });
        } catch { /* ignore */ }
        savingRef.current = false;
      }, 300);
    }

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(timer);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        const id = undoStackRef.current.pop();
        if (!id) return;
        e.preventDefault();
        deleteHighlight(id)
          .then(() => refreshRef.current?.())
          .catch(() => undoStackRef.current.push(id));
        setPopup(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [user]);

  useEffect(() => {
    function onDismiss(e) {
      if (e.target.closest('.hl-popup')) return;
      setPopup(null);
    }
    document.addEventListener('mousedown', onDismiss);
    document.addEventListener('touchstart', onDismiss);
    return () => {
      document.removeEventListener('mousedown', onDismiss);
      document.removeEventListener('touchstart', onDismiss);
    };
  }, []);

  async function handleChangeColor(color) {
    if (!popup?.highlightId) return;
    try {
      await updateHighlight(popup.highlightId, { color });
      refreshRef.current?.();
    } catch { /* ignore */ }
    setPopup(null);
  }

  if (!chapter) {
    return (
      <div className="chapter-container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <h2 style={{ color: 'var(--text-tertiary)' }}>Select a chapter</h2>
      </div>
    );
  }

  const total = chapter.questions?.length || 0;

  return (
    <div className="chapter-container" ref={containerRef} style={{ position: 'relative' }}>
      <header className="chapter-header">
        {chapter.part && <span className="chapter-part-badge">{chapter.part}</span>}
        <h1 className="chapter-title">{chapter.title}</h1>
        {chapter.subtitle && <p className="chapter-subtitle">{chapter.subtitle}</p>}
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

      {popup && (
        <HighlightPopup
          x={popup.x}
          y={popup.y}
          onSave={handleChangeColor}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

function QASection({ q, index, total }) {
  return (
    <section className="qa" data-qi={index}>
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
