import { useState, useMemo } from "react";

// Helper: format a Date as YYYY-MM-DD in local time (NOT UTC).
function toIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Helper: get Monday of the week containing the given date
function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0 = Sun, 1 = Mon
  const diff = (dow === 0 ? -6 : 1 - dow);
  x.setDate(x.getDate() + diff);
  return x;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MealPlanView({ mealPlans, recipes, onAddPlan, onRemovePlan, onClearWeek, onViewRecipe, onPlanToShopping }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [pickerDate, setPickerDate] = useState(null); // YYYY-MM-DD that user is adding to, null = closed
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Build the 7 days of the current week
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekStartIso = toIsoLocal(days[0]);
  const weekEndIso = toIsoLocal(days[6]);

  // Group plans by date
  const plansByDate = useMemo(() => {
    const map = {};
    mealPlans.forEach(p => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, [mealPlans]);

  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();
  const filteredRecipes = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    const matchTag = !filterTag || r.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function thisWeek() {
    setWeekStart(startOfWeek(new Date()));
  }

  async function handlePickRecipe(recipeId) {
    if (!pickerDate) return;
    await onAddPlan(pickerDate, recipeId);
    setPickerDate(null);
    setSearch("");
    setFilterTag(null);
  }

  function recipeTitleById(id) {
    const r = recipes.find(x => x.id === id);
    return r ? r.title : "Unknown recipe";
  }

  // Build list of unique recipe ids planned for this week, in date order
  const weekRecipeIds = useMemo(() => {
    const ids = [];
    const seen = new Set();
    days.forEach(d => {
      const iso = toIsoLocal(d);
      (plansByDate[iso] || []).forEach(p => {
        if (!seen.has(p.recipe_id)) {
          seen.add(p.recipe_id);
          ids.push(p.recipe_id);
        }
      });
    });
    return ids;
  }, [days, plansByDate]);

  const todayIso = toIsoLocal(new Date());

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Meal Plan</h1>
          <p className="page-subtitle">
            Week of {days[0].toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
            {" – "}
            {days[6].toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {weekRecipeIds.length > 0 && (
            <button onClick={() => onPlanToShopping(weekRecipeIds)} className="btn btn-gold btn-lg">
              🛒 Shopping list
            </button>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <button onClick={prevWeek} className="btn btn-secondary">← Prev</button>
        <button onClick={thisWeek} className="btn btn-secondary">Today</button>
        <button onClick={nextWeek} className="btn btn-secondary">Next →</button>
        {weekRecipeIds.length > 0 && (
          <button onClick={() => setShowClearConfirm(true)} className="btn btn-danger" style={{ marginLeft: "auto", fontSize: 12 }}>
            🗑 Clear week
          </button>
        )}
      </div>

      {/* Day grid */}
      <div className="meal-plan-grid">
        {days.map((d, i) => {
          const iso = toIsoLocal(d);
          const plans = plansByDate[iso] || [];
          const isToday = iso === todayIso;
          return (
            <div key={iso} className={"meal-plan-day" + (isToday ? " meal-plan-day-today" : "")}>
              <div className="meal-plan-day-header">
                <span className="meal-plan-day-name">{WEEKDAYS[i]}</span>
                <span className="meal-plan-day-date">{d.getDate()}</span>
              </div>
              <div className="meal-plan-day-body">
                {plans.map(p => (
                  <div key={p.id} className="meal-plan-entry">
                    <span onClick={() => onViewRecipe(p.recipe_id)} className="meal-plan-entry-title">
                      {recipeTitleById(p.recipe_id)}
                    </span>
                    <span onClick={() => onRemovePlan(p.id)} className="meal-plan-entry-remove">×</span>
                  </div>
                ))}
                <button onClick={() => setPickerDate(iso)} className="meal-plan-add-btn">
                  + Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe picker modal */}
      {pickerDate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header">
              <h2 className="modal-title">
                Add recipe for {new Date(pickerDate).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "short" })}
              </h2>
              <span className="modal-close" onClick={() => setPickerDate(null)}>×</span>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="input"
              style={{ marginBottom: 8 }}
              autoFocus
            />
            <div className="home-tags" style={{ marginBottom: 12 }}>
              <span onClick={() => setFilterTag(null)} className={"pill" + (!filterTag ? " active" : "")}>All</span>
              {allTags.map(t => (
                <span key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} className={"pill" + (filterTag === t ? " active" : "")}>{t}</span>
              ))}
            </div>
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredRecipes.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 24 }}>No recipes match</p>
              ) : (
                filteredRecipes.map(r => (
                  <div key={r.id} onClick={() => handlePickRecipe(r.id)} className="meal-plan-picker-item">
                    <span className="meal-plan-picker-title">{r.title}</span>
                    <span className="meal-plan-picker-meta">⏱ {r.prepTime} · 🔥 {r.cookTime}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear week confirm */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🗑️</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>Clear this week's plan?</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
              This will remove all planned meals between {days[0].toLocaleDateString("en-IE", { day: "numeric", month: "short" })} and {days[6].toLocaleDateString("en-IE", { day: "numeric", month: "short" })}.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={async () => { await onClearWeek(weekStartIso, weekEndIso); setShowClearConfirm(false); }} className="btn btn-danger btn-lg" style={{ flex: 1 }}>
                Yes, clear it
              </button>
              <button onClick={() => setShowClearConfirm(false)} className="btn btn-secondary btn-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
