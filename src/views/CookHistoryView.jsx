import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { SkeletonHistoryEntry } from "../components/Skeleton";

export default function CookHistoryView({ recipes, onLogDeleted }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from("cook_logs")
        .select("*")
        .order("cooked_at", { ascending: false });
      if (data) setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, []);

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  }

  function getRecipeTitle(id) {
    const r = recipes.find(r => r.id === id);
    return r ? r.title : "Unknown recipe";
  }

  async function deleteLog(id) {
    const log = logs.find(l => l.id === id);
    const { error } = await supabase.from("cook_logs").delete().eq("id", id);
    if (error) {
      console.error("deleteLog error", error);
      return;
    }
    setLogs(logs => logs.filter(l => l.id !== id));
    if (log && onLogDeleted) onLogDeleted(log.recipe_id);
  }

  if (loading) {
    return (
      <div className="view">
        <div className="view-header">
          <div>
            <h1 className="page-title">Cook History</h1>
            <p className="page-subtitle">Loading your cooks…</p>
          </div>
        </div>
        <div className="cook-history-list">
          <SkeletonHistoryEntry />
          <SkeletonHistoryEntry />
          <SkeletonHistoryEntry />
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Cook History</h1>
          <p className="page-subtitle">{logs.length} cook{logs.length !== 1 ? "s" : ""} logged</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-emoji">🍽</p>
          <p className="empty-state-title">No cooks logged yet</p>
          <p className="empty-state-text">After cooking a recipe, rate it and your history will appear here.</p>
        </div>
      ) : (
        <div className="cook-history-list">
          {logs.map((log, i) => (
            <div key={i} className="cook-history-entry">
              <div className="cook-history-entry-header">
                <span className="cook-history-recipe">{getRecipeTitle(log.recipe_id)}</span>
                <span className="cook-history-date">{formatDate(log.cooked_at)}</span>
                <span onClick={() => setConfirmDelete(log)} className="cook-history-delete">×</span>
              </div>
              <div className="cook-history-rating">{"⭐".repeat(log.rating)}</div>
              {log.feedback && (
                <p className="cook-history-feedback">"{log.feedback}"</p>
              )}
              {log.ai_tips && (
                <div className="card-note cook-history-tips">
                  <p className="label-uppercase" style={{ marginBottom: 4 }}>Tips</p>
                  <p className="cook-history-tips-text">{log.ai_tips}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🗑️</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>Delete this cook log?</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
              "{getRecipeTitle(confirmDelete.recipe_id)}" — {formatDate(confirmDelete.cooked_at)}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={async () => { await deleteLog(confirmDelete.id); setConfirmDelete(null); }}
                className="btn btn-danger btn-lg"
                style={{ flex: 1 }}
              >Yes, delete</button>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary btn-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
