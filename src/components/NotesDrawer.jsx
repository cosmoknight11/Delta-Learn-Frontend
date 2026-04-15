import { useEffect, useState } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote, analyzeNote } from '../api/client';

export default function NotesDrawer({ subjectSlug, chapterNumber, onClose }) {
  const [scope, setScope] = useState('chapter');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  function loadNotes() {
    setLoading(true);
    const params = { subject: subjectSlug };
    if (scope === 'chapter') params.chapter = chapterNumber;
    fetchNotes(params)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadNotes(); }, [scope, subjectSlug, chapterNumber]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const data = { subject_slug: subjectSlug, content: draft };
    if (scope === 'chapter') data.chapter_number = chapterNumber;
    await createNote(data);
    setDraft('');
    loadNotes();
  }

  async function handleUpdate(id) {
    if (!editText.trim()) return;
    await updateNote(id, { content: editText });
    setEditId(null);
    loadNotes();
  }

  async function handleDelete(id) {
    await deleteNote(id);
    loadNotes();
  }

  async function handleAnalyze(id) {
    const updated = await analyzeNote(id);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }

  return (
    <>
      <div className="notes-backdrop" onClick={onClose} />
      <aside className="notes-drawer">
        <div className="notes-header">
          <h3 className="notes-title">Notes</h3>
          <button className="notes-close" onClick={onClose}>&times;</button>
        </div>

        <div className="notes-scope-toggle">
          <button
            className={`notes-scope-btn ${scope === 'chapter' ? 'active' : ''}`}
            onClick={() => setScope('chapter')}
          >
            This Chapter
          </button>
          <button
            className={`notes-scope-btn ${scope === 'subject' ? 'active' : ''}`}
            onClick={() => setScope('subject')}
          >
            All {subjectSlug.replace('-', ' ')}
          </button>
        </div>

        <form className="notes-add-form" onSubmit={handleAdd}>
          <textarea
            className="notes-textarea"
            placeholder="Write a note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <button type="submit" className="notes-add-btn" disabled={!draft.trim()}>
            Add Note
          </button>
        </form>

        <div className="notes-list">
          {loading && <p className="notes-empty">Loading…</p>}
          {!loading && notes.length === 0 && (
            <p className="notes-empty">No notes yet. Start writing!</p>
          )}
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              {editId === note.id ? (
                <div className="note-edit">
                  <textarea
                    className="notes-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="note-edit-actions">
                    <button className="note-action-btn save" onClick={() => handleUpdate(note.id)}>Save</button>
                    <button className="note-action-btn" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="note-content">{note.content}</p>
                  {note.ai_summary && (
                    <div className="note-ai-summary">
                      <span className="note-ai-badge">AI</span>
                      {note.ai_summary}
                    </div>
                  )}
                  <div className="note-meta">
                    <span className="note-date">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    <div className="note-actions">
                      <button
                        className="note-action-btn analyze"
                        onClick={() => handleAnalyze(note.id)}
                        title="Analyze with AI"
                      >
                        Analyze
                      </button>
                      <button
                        className="note-action-btn"
                        onClick={() => { setEditId(note.id); setEditText(note.content); }}
                      >
                        Edit
                      </button>
                      <button
                        className="note-action-btn delete"
                        onClick={() => handleDelete(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
