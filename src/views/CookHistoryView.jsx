import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function CookHistoryView({ recipes }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    await supabase.from("cook_logs").delete().eq("id", id);
    setLogs(logs => logs.filter(l => l.id !== id));
  }

  if (loading) return <div className="view"><p style={{ padding: 24 }}>Loading...</p></div>;

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
                <span onClick={() => deleteLog(log.id)} style={{ cursor: "pointer", color: "var(--color-danger)", fontSize: 18, lineHeight: 1 }}>×</span>
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
    </div>
  );
}
