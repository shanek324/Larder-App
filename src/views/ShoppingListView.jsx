import { useState } from "react";
import { DUNNES_AISLES } from "../constants";
import { callClaude, matchesPantry } from "../utils";

export default function ShoppingListView({ recipes, pantryItems, onSaveList }) {
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [consolidated, setConsolidated] = useState(null);
  const [crossedOff, setCrossedOff] = useState({});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");
  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();

  function toggleRecipe(id) {
    setSelectedRecipes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setConsolidated(null);
    setCrossedOff({});
  }

  function toggleCross(key) {
    setCrossedOff(c => ({ ...c, [key]: !c[key] }));
  }

  const filteredRecipes = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    const matchTag = !filterTag || r.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const rawIngredients = recipes
    .filter(r => selectedRecipes.includes(r.id))
    .flatMap(r => r.ingredients);

  async function handleGenerate() {
    setGenerating(true);
    const ingredientList = rawIngredients.map(i => (i.amount ? i.amount + " " : "") + i.name).join("\n");
    const messages = [{
      role: "user",
      content: "Consolidate these shopping ingredients into a clean list. Rules: 1) Combine duplicates and similar items (e.g. chicken breast, chicken breasts, 500g chicken = one item called Chicken Breast). 2) Use short clean names only - no descriptors like minced, sliced, grated, cubed. 3) Assign aisle from: " + aisleNames + ", Other.\n\n" + ingredientList + "\n\nReply ONLY with a JSON array. Each item: name (short clean string), amounts (string array), aisle (string), key (con- prefixed slug of name)."
    }];
    try {
      const res = await callClaude(messages, "", 4000, "claude-haiku-4-5-20251001");
      const cleaned = res.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const filtered = parsed.filter(item => !matchesPantry(item.name, pantryItems));
      setConsolidated(filtered);
    } catch(e) {
      console.error("Generate error:", e);
      alert("Failed to generate list: " + e.message);
    }
    setGenerating(false);
  }

  async function handleFinalise() {
    setSaving(true);
    const finalItems = consolidated.filter(i => !crossedOff[i.key]);
    await onSaveList(finalItems);
    setSaving(false);
  }

  const grouped = {};
  (consolidated || []).forEach(item => {
    const a = item.aisle || "Other";
    if (!grouped[a]) grouped[a] = [];
    grouped[a].push(item);
  });
  const sortedAisles = Object.keys(grouped).sort((a, b) => aisleOrder.indexOf(a) - aisleOrder.indexOf(b));

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Shopping List</h1>
          <p className="page-subtitle">
            {selectedRecipes.length === 0
              ? "Select recipes to build your list"
              : `${selectedRecipes.length} recipe${selectedRecipes.length !== 1 ? "s" : ""} selected · ${rawIngredients.length} ingredients`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedRecipes.length > 0 && !consolidated && (
            <button onClick={handleGenerate} disabled={generating} className="btn btn-gold btn-lg">
              {generating ? "Generating..." : "✦ Generate List"}
            </button>
          )}
          {consolidated && consolidated.length > 0 && (
            <button onClick={handleFinalise} disabled={saving} className="btn btn-primary btn-lg">
              {saving ? "Saving..." : "Finalise →"}
            </button>
          )}
        </div>
      </div>

      {!consolidated && (
        <>
          {selectedRecipes.length > 0 && (
            <div className="shopping-selected-bar">
              <p className="shopping-selected-label">Selected:</p>
              <div className="shopping-selected-pills">
                {selectedRecipes.map(id => {
                  const r = recipes.find(x => x.id === id);
                  return r ? (
                    <span key={id} onClick={() => toggleRecipe(id)} className="shopping-selected-pill">
                      {r.title} ×
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="shopping-search-bar">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="input"
            />
          </div>

          <div className="home-tags" style={{ marginBottom: 16 }}>
            <span onClick={() => setFilterTag(null)} className={"pill" + (!filterTag ? " active" : "")}>All</span>
            {allTags.map(t => (
              <span key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} className={"pill" + (filterTag === t ? " active" : "")}>{t}</span>
            ))}
          </div>

          <div className="shopping-recipe-grid">
            {filteredRecipes.map(r => {
              const selected = selectedRecipes.includes(r.id);
              return (
                <div key={r.id} onClick={() => toggleRecipe(r.id)} className={"shopping-recipe-card" + (selected ? " selected" : "")}>
                  {selected && <div className="shopping-recipe-check">✓</div>}
                  <h3 className="shopping-recipe-title">{r.title}</h3>
                  <div className="shopping-recipe-meta">
                    <span>⏱ {r.prepTime}</span>
                    <span>🔥 {r.cookTime}</span>
                    <span>🍽 {r.servings}</span>
                  </div>
                  <div className="shopping-recipe-tags">
                    {r.tags.slice(0, 3).map(t => (
                      <span key={t} className="shopping-recipe-tag">{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {consolidated && consolidated.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-emoji">✅</p>
          <p className="empty-state-title">Everything is already in your pantry!</p>
        </div>
      )}

      {consolidated && consolidated.length > 0 && (
        <>
          <div className="shopping-list-header">
            <p className="shopping-list-subtitle">Cross off anything you already have</p>
            <button onClick={() => { setConsolidated(null); setCrossedOff({}); }} className="btn btn-secondary">← Back to recipes</button>
          </div>
          {sortedAisles.map(aisle => {
            const aisleInfo = DUNNES_AISLES.find(a => a.name === aisle) || { icon: "🛒" };
            return (
              <div key={aisle} className="aisle-section">
                <div className="aisle-header">
                  <span>{aisleInfo.icon}</span>
                  <span className="aisle-name">{aisle}</span>
                  <span className="aisle-count">({grouped[aisle].length})</span>
                </div>
                <div className="shopping-items">
                  {grouped[aisle].map(item => (
                    <label key={item.key} onClick={() => toggleCross(item.key)} className={"shopping-item" + (crossedOff[item.key] ? " crossed" : "")}>
                      <input type="checkbox" checked={!!crossedOff[item.key]} onChange={() => toggleCross(item.key)} className="shopping-item-check" />
                      <span className="shopping-item-name">{item.name}</span>
                      {item.amounts && item.amounts.length > 0 && (
                        <span className="shopping-item-amount">{item.amounts.join(" + ")}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
