import { useState, useEffect } from "react";
import { DUNNES_AISLES } from "../constants";
import { callClaude, matchesPantry, estimateRecipeCost } from "../utils";

export default function ShoppingListView({ recipes, pantryItems, onSaveList, savedList, onClearList }) {
  const [selectedRecipes, setSelectedRecipes] = useState(() => {
    try { return []; } catch { return []; }
  });
  const [consolidated, setConsolidated] = useState(savedList ? savedList.items : null);
  const [crossedOff, setCrossedOff] = useState({});
  const [expandedSources, setExpandedSources] = useState({});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [totalCost, setTotalCost] = useState(null);
  const [editedAmounts, setEditedAmounts] = useState({});

  useEffect(() => {
    if (selectedRecipes.length === 0) { setTotalCost(null); return; }
    async function calcCost() {
      const allIngredients = selectedRecipeObjects.flatMap(r => r.ingredients);
      const result = await estimateRecipeCost(allIngredients);
      setTotalCost(result.hasData ? result.total : null);
    }
    calcCost();
  }, [selectedRecipes]);

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");
  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();

  function toggleRecipe(id) {
    setSelectedRecipes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setConsolidated(null);
    setCrossedOff({});
    setExpandedSources({});
  }

  function toggleCross(key) {
    setCrossedOff(c => ({ ...c, [key]: !c[key] }));
  }

  function toggleSources(key) {
    setExpandedSources(s => ({ ...s, [key]: !s[key] }));
  }

  const filteredRecipes = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    const matchTag = !filterTag || r.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const selectedRecipeObjects = recipes.filter(r => selectedRecipes.includes(r.id));
  const rawIngredients = selectedRecipeObjects.flatMap(r => r.ingredients);

  async function handleGenerate() {
    localStorage.setItem("lastSelectedRecipes", JSON.stringify(selectedRecipes));
    setGenerating(true);

    const ingredientLines = selectedRecipeObjects.flatMap(r =>
      r.ingredients.map(i => (i.amount ? i.amount + " " : "") + i.name + " [" + r.title + "]")
    ).join("\n");

    const messages = [{
      role: "user",
      content: "Consolidate these shopping ingredients into a clean list. Each line ends with [Recipe Name] showing the source. Rules: 1) Combine duplicates and similar items. 2) Use short clean names only - no descriptors like minced, sliced, grated. 3) Assign aisle from: " + aisleNames + ", Other. 4) Include a sources array listing which recipes need each item.\n\n" + ingredientLines + "\n\nReply ONLY with a JSON array. Each item: name (string), amounts (string array), aisle (string), key (con- prefixed slug), sources (string array of recipe names)."
    }];

    try {
      const res = await callClaude(messages, "", 4000, "claude-haiku-4-5-20251001");
      const cleaned = res.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const filtered = parsed.filter(item => !matchesPantry(item.name, pantryItems));
      setConsolidated(filtered);
      setEditedAmounts({});
      // Save immediately so navigating away and back restores the list
      await onSaveList(filtered, false);
    } catch(e) {
      console.error("Generate error:", e);
      alert("Failed to generate list: " + e.message);
    }
    setGenerating(false);
  }

  async function handleGoToShop() {
    setSaving(true);
    // Remove crossed-off items and mark as prepared (in-shop phase)
    const finalItems = consolidated.filter(i => !crossedOff[i.key]);
    await onSaveList(finalItems, true);
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
              : selectedRecipes.length + " recipe" + (selectedRecipes.length !== 1 ? "s" : "") + " · " + rawIngredients.length + " ingredients" + (totalCost !== null ? " · est. €" + totalCost.toFixed(2) : "")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedRecipes.length > 0 && !consolidated && (
            <button onClick={handleGenerate} disabled={generating} className="btn btn-gold btn-lg">
              {generating ? "Generating..." : "✦ Generate List"}
            </button>
          )}
          {consolidated && consolidated.length > 0 && (
            <button onClick={handleGoToShop} disabled={saving} className="btn btn-primary btn-lg">
              {saving ? "Saving..." : "Go to Shop →"}
            </button>
          )}
        </div>
      </div>

      {!consolidated && savedList && savedList.items && (
        <div className="card-note" style={{ marginBottom: 16, borderLeft: "3px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="label-uppercase" style={{ marginBottom: 2 }}>📋 Saved list</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted-dark)", margin: 0 }}>{savedList.items.length} items ready</p>
          </div>
          <button onClick={() => setConsolidated(savedList.items)} className="btn btn-gold">Resume →</button>
        </div>
      )}

      {!consolidated && pantryItems.filter(i => i.stockLevel === "low").length > 0 && (
        <div className="card-note" style={{ marginBottom: 16, borderLeft: "3px solid #c62828" }}>
          <p className="label-uppercase" style={{ marginBottom: 8, color: "#c62828" }}>⚠️ Low Stock</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pantryItems.filter(i => i.stockLevel === "low").map(item => (
              <span key={item.id} className="shopping-recipe-tag" style={{ background: "#fce4ec", color: "#c62828" }}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

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
            <button onClick={async () => { if (onClearList) await onClearList(); setConsolidated(null); setCrossedOff({}); setExpandedSources({}); }} className="btn btn-secondary">← Back to recipes</button>
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
                    <div key={item.key} className="shopping-item-wrapper">
                      <label className={"shopping-item" + (crossedOff[item.key] ? " crossed" : "")}
                        onClick={() => toggleCross(item.key)}>
                        <input
                          type="checkbox"
                          checked={!!crossedOff[item.key]}
                          onChange={() => toggleCross(item.key)}
                          className="shopping-item-check"
                        />
                        <span className="shopping-item-name">{item.name}</span>
                        <input
                          type="text"
                          value={editedAmounts[item.key] !== undefined ? editedAmounts[item.key] : (item.amounts || []).join(" + ")}
                          onChange={e => setEditedAmounts(a => ({ ...a, [item.key]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                          className="shopping-item-amount-input"
                          placeholder="amount"
                        />
                        {item.sources && item.sources.length > 0 && (
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSources(item.key); }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-muted)", padding: "0 4px", flexShrink: 0 }}
                          >
                            {expandedSources[item.key] ? "▲" : "▼"}
                          </button>
                        )}
                      </label>
                      {item.sources && item.sources.length > 0 && expandedSources[item.key] && (
                        <div className="shopping-item-sources">
                          {item.sources.map((src, i) => (
                            <div key={i} className="shopping-item-source">
                              <span className="shopping-item-source-recipe">{typeof src === "object" ? src.recipe : src}</span>
                              {typeof src === "object" && src.original && (
                                <span className="shopping-item-source-original">{src.original}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
