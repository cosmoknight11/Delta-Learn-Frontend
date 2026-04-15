export default function DeltaSpinner({ text, small }) {
  return (
    <div className={`delta-loader${small ? ' delta-loader-sm' : ''}`}>
      <svg className="delta-spinner" viewBox="0 0 40 40">
        <polygon className="delta-spinner-triangle" points="20,4 36,34 4,34" />
      </svg>
      {text && <span className="delta-loader-text">{text}</span>}
    </div>
  );
}
