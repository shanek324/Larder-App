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
        <span onClick={onRemove} className="tag-remove">×</span>
      )}
    </span>
  );
}
