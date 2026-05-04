import { useState, useEffect } from "react";
import Tag from "../components/Tag";
import ServingScaler from "../components/ServingScaler";
import AIChat from "../components/AIChat";
import { scaleAmount } from "../utils";

export default function RecipeView({ recipe, onBack, onUpdate, onDelete, collections, onUpdateCollections, onCookedIt, onStartCooking }) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(recipe);
  const [tab, setTab] = useState("recipe");
  const [newIngredient, setNewIngredient] = useState({ name: "", amount: "" });
  const [newTag, setNewTag] = useState("");
  const [scaledServings, setScaledServings] = useState(recipe.servings);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  useEffect(() => { setDraft(recipe); setScaledServings(recipe.servings); }, [recipe]);

  const ratio = scaledServings / recipe.servings;

  function save() { onUpdate(draft); setEditMode(false); }
  function addIngredient() {
    if (!newIngredient.name) return;
    setDraft(d => ({ ...d, ingredients: [...d.ingredients, { ...newIngredient }] }));
    setNewIngredient({ name: "", amount: "" });
  }
  function removeIngredient(i) { setDraft(d => ({ ...d, ingredients: d.ingredients.filter((_, idx) => idx !== i) })); }
  function updateMethod(i, val) { setDraft(d => { const m = [...d.method]; m[i] = val; return { ...d, method: m }; }); }
  function addStep() { setDraft(d => ({ ...d, method: [...d.method, ""] })); }
  function removeStep(i) { setDraft(d => ({ ...d, method: d.method.filter((_, idx) => idx !== i) })); }
  function handleAIUpdate(updated) { onUpdate({ ...recipe, ...updated, id: recipe.id, createdAt: recipe.createdAt }); }

  const recipeCollections = collections.filter(c => c.recipeIds.includes(recipe.id));

  function toggleCollection(colId) {
    onUpdateCollections(collections.map(c => {
      if (c.id !== colId) return c;
      const has = c.recipeIds.includes(recipe.id);
      return { ...c, recipeIds: has ? c.recipeIds.filter(id => id !== recipe.id) : [...c.recipeIds, recipe.id] };
    }));
  }

  return (
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#c8a96e", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>← Back to Larder</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        {editMode ? (
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#2c1810", border: "none", borderBottom: "2px solid #c8a96e", background: "transparent", outline: "none", flex: 1 }} />
        ) : (
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", fontWeight: 700 }}>{recipe.title}</h1>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowCollectionPicker(v => !v)} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
              📁 Collections {recipeCollections.length > 0 ? `(${recipeCollections.length})` : ""}
            </button>
            {showCollectionPicker && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fffdf8", border: "1.5px solid #e8e0d5", borderRadius: 12, padding: 12, minWidth: 200, zIndex: 50, boxShadow: "0 8px 24px rgba(44,24,16,0.12)" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Add to Collection</p>
                {collections.length === 0 && <p style={{ fontSize: 12, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif" }}>No collections yet</p>}
                {collections.map(c => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#3a2e22" }}>
                    <input type="checkbox" checked={c.recipeIds.includes(recipe.id)} onChange={() => toggleCollection(c.id)} style={{ accentColor: "#c8a96e" }} />
                    {c.emoji} {c.name}
                  </label>
                ))}
                <button onClick={() => setShowCollectionPicker(false)} style={{ marginTop: 8, width: "100%", background: "none", border: "none", color: "#9e8a73", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer" }}>Done</button>
              </div>
            )}
          </div>

          {editMode ? (
            <>
              <button onClick={save} style={{ background: "#c8a96e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Save</button>
              <button onClick={() => { setDraft(recipe); setEditMode(false); }} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={onStartCooking} style={{ background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>👨‍🍳 Cook</button>
              <button onClick={onCookedIt} style={{ background: "#e8f5e9", color: "#2e7d32", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>🍳 Cooked it!</button>
              <button onClick={() => setEditMode(true)} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Edit</button>
              <button onClick={onDelete} style={{ background: "#fce4e4", color: "#c0392b", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
            </>
          )}
        </div>
      </div>

      {editMode ? (
        <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ width: "100%", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#7a6651", border: "1px solid #ddd5c8", borderRadius: 8, padding: "8px 12px", resize: "none", background: "#fffdf8", marginBottom: 12, boxSizing: "border-box" }} />
      ) : (
        <p style={{ margin: "0 0 16px", fontSize: 15, color: "#7a6651", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{recipe.description}</p>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {draft.tags.map(t => (
          <Tag key={t} label={t} onRemove={editMode ? () => setDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) })) : null} />
        ))}
        {editMode && (
          <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newTag.trim()) { setDraft(d => ({ ...d, tags: [...d.tags, newTag.trim()] })); setNewTag(""); } }} placeholder="Add tag…" style={{ padding: "3px 10px", borderRadius: 20, border: "1px dashed #c8a96e", fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: "#fffdf8", width: 90 }} />
        )}
      </div>

      {recipeCollections.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {recipeCollections.map(c => (
            <span key={c.id} style={{ fontSize: 12, color: "#7a6651", background: "#f0ebe3", padding: "3px 12px", borderRadius: 20, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{c.emoji} {c.name}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        {[{ label: "Prep", key: "prepTime" }, { label: "Cook", key: "cookTime" }, { label: "Servings", key: "servings" }].map(({ label, key }) => (
          <div key={key} style={{ background: "#f5f0e8", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
            {editMode ? (
              <input value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} style={{ fontSize: 15, fontWeight: 700, color: "#2c1810", fontFamily: "'DM Sans', sans-serif", border: "none", background: "transparent", outline: "none", textAlign: "center", width: 70 }} />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: key === "servings" && scaledServings !== recipe.servings ? "#c8a96e" : "#2c1810", fontFamily: "'DM Sans', sans-serif" }}>
                {key === "servings" ? scaledServings : recipe[key]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: "2px solid #e8e0d5" }}>
        {["recipe", "ai"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: tab === t ? "#c8a96e" : "#9e8a73", borderBottom: tab === t ? "2px solid #c8a96e" : "2px solid transparent", marginBottom: -2, cursor: "pointer" }}>
            {t === "recipe" ? "Recipe" : "✦ AI Assistant"}
          </button>
        ))}
      </div>

      {tab === "recipe" ? (
        <>
          <div style={{ marginTop: 24 }}>
            <ServingScaler baseServings={recipe.servings} value={scaledServings} onChange={setScaledServings} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr)", gap: 20 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2c1810", margin: "0 0 14px" }}>
                Ingredients {scaledServings !== recipe.servings && <span style={{ fontSize: 13, color: "#c8a96e", fontWeight: 400, marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>scaled ×{ratio.toFixed(2).replace(/\.?0+$/, "")}</span>}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {draft.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fffdf8", border: "1px solid #e8e0d5", borderRadius: 8 }}>
                    {editMode ? (
                      <>
                        <input value={ing.amount} onChange={e => { const arr = [...draft.ingredients]; arr[i] = { ...arr[i], amount: e.target.value }; setDraft(d => ({ ...d, ingredients: arr })); }} style={{ width: 70, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#c8a96e", border: "none", background: "transparent", outline: "none" }} />
                        <input value={ing.name} onChange={e => { const arr = [...draft.ingredients]; arr[i] = { ...arr[i], name: e.target.value }; setDraft(d => ({ ...d, ingredients: arr })); }} style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3a2e22", border: "none", background: "transparent", outline: "none" }} />
                        <span onClick={() => removeIngredient(i)} style={{ cursor: "pointer", color: "#c0392b", fontSize: 16, padding: "0 4px" }}>×</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#c8a96e", minWidth: 70 }}>{scaleAmount(ing.amount, ratio)}</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3a2e22" }}>{ing.name}</span>
                      </>
                    )}
                  </div>
                ))}
                {editMode && (
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <input value={newIngredient.amount} onChange={e => setNewIngredient(n => ({ ...n, amount: e.target.value }))} placeholder="Amount" style={{ width: 70, padding: "7px 10px", border: "1px dashed #c8a96e", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: "#fffdf8" }} />
                    <input value={newIngredient.name} onChange={e => setNewIngredient(n => ({ ...n, name: e.target.value }))} placeholder="Ingredient" onKeyDown={e => e.key === "Enter" && addIngredient()} style={{ flex: 1, padding: "7px 10px", border: "1px dashed #c8a96e", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: "#fffdf8" }} />
                    <button onClick={addIngredient} style={{ background: "#c8a96e", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 16 }}>+</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2c1810", margin: "0 0 14px" }}>Method</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {draft.method.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ minWidth: 26, height: 26, background: "#c8a96e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{i + 1}</span>
                    {editMode ? (
                      <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <textarea value={step} onChange={e => updateMethod(i, e.target.value)} rows={2} style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3a2e22", lineHeight: 1.6, border: "1px solid #ddd5c8", borderRadius: 8, padding: "6px 10px", resize: "none", background: "#fffdf8" }} />
                        <span onClick={() => removeStep(i)} style={{ cursor: "pointer", color: "#c0392b", fontSize: 18, marginTop: 4 }}>×</span>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3a2e22", lineHeight: 1.6 }}>{step}</p>
                    )}
                  </div>
                ))}
                {editMode && (
                  <button onClick={addStep} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "1px dashed #c8a96e", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", alignSelf: "flex-start" }}>+ Add step</button>
                )}
              </div>
              {(draft.notes || editMode) && (
                <div style={{ marginTop: 20, background: "#fdf6e8", border: "1px solid #e8d5a0", borderRadius: 10, padding: "14px 16px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</p>
                  {editMode ? (
                    <textarea value={draft.notes || ""} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={2} style={{ width: "100%", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#5c4a2a", border: "none", background: "transparent", outline: "none", resize: "none", boxSizing: "border-box" }} />
                  ) : (
                    <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#5c4a2a", lineHeight: 1.6 }}>{recipe.notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 24, height: 480 }}>
          <AIChat recipe={recipe} onUpdate={handleAIUpdate} />
        </div>
      )}
    </div>
  );
}
