import { TAG_COLORS } from "../constants";

export default function Tag({ label, color = "default", onRemove }) {
  const c = TAG_COLORS[label] || TAG_COLORS.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    }}>
      {label}
      {onRemove && (
        <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.6, marginLeft: 2 }}>×</span>
      )}
    </span>
  );
}
