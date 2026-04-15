const COLORS = [
  { key: 'yellow', bg: '#ffd600' },
  { key: 'green', bg: '#30d158' },
  { key: 'blue', bg: '#0a84ff' },
  { key: 'pink', bg: '#ff375f' },
];

export default function HighlightPopup({ x, y, onSave, onClose }) {
  return (
    <div
      className="hl-popup"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="hl-popup-label">Highlight:</span>
      {COLORS.map((c) => (
        <button
          key={c.key}
          className="hl-popup-dot"
          style={{ background: c.bg }}
          title={c.key}
          onClick={() => onSave(c.key)}
        />
      ))}
      <button className="hl-popup-cancel" onClick={onClose}>&times;</button>
    </div>
  );
}
