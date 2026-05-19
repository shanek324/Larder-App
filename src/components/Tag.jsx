import { TAG_COLORS } from "../constants";

export default function Tag({ label, onRemove }) {
  const c = TAG_COLORS[label] || TAG_COLORS.default;
  return (
    <span
      className="tag-pill"
      style={{ background: c.bg, color: c.text }}
    >
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="tag-remove" aria-label="Remove tag">×</button>
      )}
    </span>
  );
}
