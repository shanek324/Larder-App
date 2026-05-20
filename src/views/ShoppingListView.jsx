import { useState, useEffect, useRef, useMemo } from "react";
import { DUNNES_AISLES } from "../constants";
import { callClaude, matchesPantry, estimateRecipeCost, categoriseIngredient } from "../utils";
import { toast } from "../toast";

export default function ShoppingListView({ recipes, pantryItems, onSaveList, savedList, onClearList, selectedRecipes, setSelectedRecipes, consolidated, setConsolidated, crossedOff, setCrossedOff }) {

  const [expandedSources, setExpandedSources] = useState({});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [totalCost, setTotalCost] = useState(null);
  const [addingMore, setAddingMore] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [manualItem, setManualItem] = useState("");

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");
  const allTags = useMemo(() => [...new Set(recipes.flatMap(r => r.tags))].sort(), [recipes]);

  function toggleRecipe(id) {
    setSelectedRecipes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    if (!addingMore) {
      setConsolidated(null);
      setCrossedOff({});
      setExpandedSources({});
    }
  }

  function toggleCross(key) {
    setCrossedOff(c => ({ ...c, [key]: !c[key] }));
  }

  function toggleSources(key) {
    setExpandedSources(s => ({ ...s, [key]: !s[key] }));
  }

  const filteredRecipes = useMemo(() => {
    const q = search.toLowerCase();
    return recipes.filter(r => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
      const matchTag = !filterTag || r.tags.includes(filterTag);
      return matchSearch && matchTag;
    });
  }, [recipes, search, filterTag]);

  const selectedRecipeObjects = useMemo(
    () => recipes.filter(r => selectedRecipes.includes(r.id)),
    [recipes, selectedRecipes]
  );
  const rawIngredients = useMemo(
    () => selectedRecipeObjects.flatMap(r => r.ingredients),
    [selectedRecipeObjects]
  );

  useEffect(() => {
    if (selectedRecipes.length === 0) { setTotalCost(null); return; }
    let cancelled = false;
    async function calcCost() {
      const result = await estimateRecipeCost(rawIngredients);
      if (!cancelled) setTotalCost(result.hasData ? result.total : null);
    }
    calcCost();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipes, recipes]);

  const saveTimerRef = useRef(null);
  function updateAmount(itemKey, newAmount) {
    const updated = consolidated.map(i => i.key === itemKey ? { ...i, amounts: [newAmount] } : i);
    setConsolidated(updated);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSaveList(updated, false, crossedOff, selectedRecipes);
    }, 800);
  }

  function removeConsolidatedItem(key) {
    setConsolidated(prev => prev.filter(i => i.key !== key));
  }

  async function handleGenerate() {
    setGenerating(true);

    // When adding more, include existing consolidated items as context
    const existingLines = (addingMore && consolidated)
      ? consolidated.map(i => (i.amounts || []).join(" + ") + " " + i.name + " [existing]").join("\n") + "\n"
      : "";

    const ingredientLines = selectedRecipeObjects.flatMap(r =>
      r.ingredients.map(i => (i.amount ? i.amount + " " : "") + i.name + " [" + r.title + "]")
    ).join("\n");

    const messages = [{
      role: "user",
      content: "Consolidate these shopping ingredients into a clean list. Each line ends with [Recipe Name] showing the source. Items marked [existing] are already on the list — merge new items into them where appropriate. Rules: 1) Combine duplicates and similar items. 2) Use short clean names only - no descriptors like minced, sliced, grated. 3) Assign aisle from: " + aisleNames + ", Other. 4) Include a sources array listing which recipes need each item.\n\n" + existingLines + ingredientLines + "\n\nReply ONLY with a JSON array. Each item: name (string), amounts (string array), aisle (string), key (con- prefixed slug), sources (string array of recipe names)."
    }];

    try {
      const res = await callClaude(messages, "", 4000, "claude-haiku-4-5-20251001");
      const cleaned = res.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const filtered = parsed.filter(item => !matchesPantry(item.name, pantryItems));
      setConsolidated(filtered);
      setAddingMore(false);
      // Save with recipe_ids so we can restore selected recipes
      await onSaveList(filtered, false, {}, selectedRecipes);
    } catch(e) {
      console.error("Generate error:", e);
      toast.error(e.message || "Couldn't generate shopping list. Please try again.");
    }
    setGenerating(false);
  }

  function addManualItem() {
    if (!manualItem.trim()) return;
    const name = manualItem.trim();
    const key = "manual-" + name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newItem = { key, name, amounts: [], aisle: categoriseIngredient(name), sources: [] };
    const updated = [...consolidated, newItem];
    setConsolidated(updated);
    onSaveList(updated, false, {}, selectedRecipes);
    setManualItem("");
  }

  async function handleGoToShop() {
    setSaving(true);
    // Remove crossed-off items and mark as prepared (in-shop phase)
    const finalItems = consolidated.filter(i => !crossedOff[i.key]);
    await onSaveList(finalItems, true, {}, selectedRecipes);
    setSaving(false);
  }

  const { grouped, sortedAisles } = useMemo(() => {
    const g = {};
    (consolidated || []).forEach(item => {
      const a = item.aisle || "Other";
      if (!g[a]) g[a] = [];
      g[a].push(item);
    });
    const s = Object.keys(g).sort((a, b) => aisleOrder.indexOf(a) - aisleOrder.indexOf(b));
    return { grouped: g, sortedAisles: s };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidated]);

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
          {consolidated && !addingMore && (
            <button onClick={() => setAddingMore(true)} className="btn btn-secondary">
              + Add recipes
            </button>
          )}
          {(selectedRecipes.length > 0 && !consolidated) || (addingMore && selectedRecipes.length > 0) ? (
            <button onClick={handleGenerate} disabled={generating} className="btn btn-gold btn-lg">
              {generating ? "Generating..." : addingMore ? "✦ Merge into list" : "✦ Generate List"}
            </button>
          ) : null}
          {consolidated && consolidated.length > 0 && !addingMore && (
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
          <button onClick={() => { setConsolidated(savedList.items); setSelectedRecipes(savedList.recipe_ids || []); }} className="btn btn-gold">Resume →</button>
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

      {(!consolidated || addingMore) && (
        <>
          {addingMore && (
            <div className="card-note" style={{ marginBottom: 16, borderLeft: "3px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted-dark)", margin: 0 }}>
                Pick more recipes to merge into your existing list
              </p>
              <button onClick={() => { setAddingMore(false); setSelectedRecipes(savedList?.recipe_ids || []); }} className="btn btn-secondary">Cancel</button>
            </div>
          )}
          {selectedRecipes.length > 0 && (
            <div className="shopping-selected-bar">
              <p className="shopping-selected-label">Selected:</p>
              <div className="shopping-selected-pills">
                {selectedRecipes.map(id => {
                  const r = recipes.find(x => x.id === id);
                  return r ? (
                    <button type="button" key={id} onClick={() => toggleRecipe(id)} className="shopping-selected-pill" aria-label="Remove from shopping list">
                      {r.title} ×
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="shopping-search-bar">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…" aria-label="Search recipes…"
              className="input"
            />
          </div>

          <div className="home-tags" style={{ marginBottom: 16 }}>
            <button type="button" onClick={() => setFilterTag(null)} className={"pill" + (!filterTag ? " active" : "")}>All</button>
            {allTags.map(t => (
              <button type="button" key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} className={"pill" + (filterTag === t ? " active" : "")}>{t}</button>
            ))}
          </div>

          <div className="shopping-recipe-grid">
            {filteredRecipes.map(r => {
              const selected = selectedRecipes.includes(r.id);
              return (
                <button type="button" key={r.id} onClick={() => toggleRecipe(r.id)} className={"shopping-recipe-card" + (selected ? " selected" : "")} aria-pressed={selected} aria-label={(selected ? "Remove " : "Add ") + r.title}>
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
                </button>
              );
            })}
          </div>
        </>
      )}

      {consolidated && consolidated.length === 0 && !addingMore && (
        <div className="empty-state">
          <p className="empty-state-emoji">✅</p>
          <p className="empty-state-title">Everything is already in your pantry!</p>
        </div>
      )}

      {consolidated && consolidated.length > 0 && !addingMore && (
        <>
          <div className="shopping-list-header">
            <p className="shopping-list-subtitle">Cross off anything you already have</p>
            <button onClick={() => setShowClearConfirm(true)} className="btn btn-danger" style={{ fontSize: 12 }}>🗑 Clear list</button>
          </div>
          <div className="pantry-add-row" style={{ marginBottom: 12 }}>
            <input
              value={manualItem}
              onChange={e => setManualItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addManualItem()}
              placeholder="Add item to list…" aria-label="Add item to list…"
              className="input"
            />
            <button onClick={addManualItem} className="btn btn-gold">Add</button>
          </div>

          {showClearConfirm && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400, textAlign: "center" }}>
                <p style={{ fontSize: 40, marginBottom: 8 }}>🗑️</p>
                <h2 className="section-title" style={{ textAlign: "center" }}>Clear your list?</h2>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
                  This will permanently delete your shopping list.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={async () => { if (onClearList) await onClearList(); setConsolidated(null); setCrossedOff({}); setExpandedSources({}); setShowClearConfirm(false); }} className="btn btn-danger btn-lg" style={{ flex: 1 }}>Yes, clear it</button>
                  <button onClick={() => setShowClearConfirm(false)} className="btn btn-secondary btn-lg">Cancel</button>
                </div>
              </div>
            </div>
          )}
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
                          value={(item.amounts || []).join(" + ")}
                          onChange={e => updateAmount(item.key, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="shopping-item-amount-input"
                          placeholder="amount" aria-label="amount"
                        />
                        {item.sources && item.sources.length > 0 && (
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSources(item.key); }}
                            className="shopping-source-toggle"
                          >
                            {expandedSources[item.key] ? "▲" : "▼"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); removeConsolidatedItem(item.key); }}
                          className="shopping-item-remove"
                          aria-label={`Remove ${item.name}`}
                        >×</button>
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
