export default function Skeleton({ width, height, radius = 8, style = {}, className = "" }) {
  const s = {
    width: width || "100%",
    height: height || "16px",
    borderRadius: radius,
    ...style,
  };
  return <div className={"skeleton " + className} style={s} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-card-image" />
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-line skeleton-line-title" />
        <div className="skeleton skeleton-line skeleton-line-meta" />
      </div>
    </div>
  );
}

export function SkeletonHistoryEntry() {
  return (
    <div className="skeleton-history-entry" aria-hidden="true">
      <div className="skeleton skeleton-line" style={{ width: "60%", height: 16 }} />
      <div className="skeleton skeleton-line" style={{ width: "40%", height: 12, marginTop: 8 }} />
      <div className="skeleton skeleton-line" style={{ width: "90%", height: 12, marginTop: 6 }} />
    </div>
  );
}
