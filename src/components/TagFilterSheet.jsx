import { useState, useEffect } from "react";

export default function TagFilterSheet({ tags, value, onChange, onClose }) {
  const [search, setSearch] = useState("");

  // Lock body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const filtered = tags.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  function pick(tag) {
    onChange(tag);
    onClose();
  }

  function clear() {
    onChange(null);
    onClose();
  }

  return (
    <div className="tag-sheet-backdrop" onClick={onClose}>
      <div className="tag-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="Filter by tag">
        <div className="tag-sheet-handle" aria-hidden="true" />
        <div className="tag-sheet-header">
          <h2 className="tag-sheet-title">Filter by tag</h2>
          <button onClick={onClose} className="tag-sheet-close" aria-label="Close">×</button>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tags…"
          className="input tag-sheet-search"
          autoFocus
        />

        <div className="tag-sheet-pills">
          {filtered.length === 0 ? (
            <p className="tag-sheet-empty">No tags match.</p>
          ) : (
            filtered.map(t => (
              <span
                key={t}
                onClick={() => pick(t)}
                className={"pill" + (value === t ? " active" : "")}
              >{t}</span>
            ))
          )}
        </div>

        {value && (
          <button onClick={clear} className="tag-sheet-clear">Clear filter</button>
        )}
      </div>
    </div>
  );
}
