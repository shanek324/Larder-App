import { useState, useEffect } from "react";
import Tag from "../components/Tag";
import ServingScaler from "../components/ServingScaler";
import AIChat from "../components/AIChat";
import { scaleAmount, estimateRecipeCost } from "../utils";
import Skeleton from "../components/Skeleton";

export default function RecipeView({ recipe, onBack, onUpdate, onDelete, collections, onUpdateCollections, onStartCooking, onDuplicate, onAddToLibrary, session, checkCredits, authorName }) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(recipe);
  const [tab, setTab] = useState("recipe");
  const [newIngredient, setNewIngredient] = useState({ name: "", amount: "" });
  const [newTag, setNewTag] = useState("");
  const [scaledServings, setScaledServings] = useState(recipe.servings);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [costEstimate, setCostEstimate] = useState(null);
  const [loadingCost, setLoadingCost] = useState(true);

  useEffect(() => { setDraft(recipe); setScaledServings(recipe.servings); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [recipe.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadCost() {
      setCostEstimate(null);
      setLoadingCost(true);
      try {
        const result = await estimateRecipeCost(recipe.ingredients);
        if (!cancelled) {
          if (result.hasData) setCostEstimate(result);
        }
      } catch (e) {
        console.error("loadCost error", e);
      }
      if (!cancelled) setLoadingCost(false);
    }
    loadCost();
    return () => { cancelled = true; };
  }, [recipe.id]);

  const ratio = scaledServings / recipe.servings;
  const isOwner = recipe.user_id === session?.user?.id;

  function save() { onUpdate(draft); setEditMode(false); }

  function addIngredient() {
    if (!newIngredient.name) return;
    setDraft(d => ({ ...d, ingredients: [...d.ingredients, { ...newIngredient }] }));
    setNewIngredient({ name: "", amount: "" });
  }

  function removeIngredient(i) {
    setDraft(d => ({ ...d, ingredients: d.ingredients.filter((_, idx) => idx !== i) }));
  }

  function updateMethod(i, val) {
    setDraft(d => { const m = [...d.method]; m[i] = val; return { ...d, method: m }; });
  }

  function addStep() { setDraft(d => ({ ...d, method: [...d.method, ""] })); }

  function removeStep(i) {
    setDraft(d => ({ ...d, method: d.method.filter((_, idx) => idx !== i) }));
  }

  function handleAIUpdate(updated) {
    onUpdate({ ...recipe, ...updated, id: recipe.id, createdAt: recipe.createdAt });
  }

  const recipeCollections = collections.filter(c => c.recipeIds.includes(recipe.id));

  function toggleCollection(colId) {
    onUpdateCollections(collections.map(c => {
      if (c.id !== colId) return c;
      const has = c.recipeIds.includes(recipe.id);
      return { ...c, recipeIds: has ? c.recipeIds.filter(id => id !== recipe.id) : [...c.recipeIds, recipe.id] };
    }));
  }

  return (
    <div className="view">
      <button onClick={onBack} className="recipe-back-btn">← Back</button>

      <div className="recipe-header">
        {editMode ? (
          <input
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className="recipe-title-input"
          />
        ) : (
          <div>
            <h1 className="page-title recipe-title">{recipe.title}</h1>
            {authorName && <p className="recipe-author-byline">by {authorName}</p>}
          </div>
        )}

        <div className="recipe-actions">
          {editMode ? (
            <>
              <button onClick={save} className="btn btn-gold btn-lg">Save</button>
              <button onClick={() => { setDraft(recipe); setEditMode(false); }} className="btn btn-secondary">Cancel</button>
            </>
          ) : (
            <>
              {onAddToLibrary && (
                <button onClick={onAddToLibrary} className="btn btn-gold btn-lg">+ Add to my library</button>
              )}
              {onStartCooking && (
                <button onClick={onStartCooking} className="btn btn-primary btn-lg">👨‍🍳 Cook</button>
              )}

              <div className="recipe-overflow-wrapper">
                <button
                  onClick={() => setShowOverflow(v => !v)}
                  className="btn btn-secondary recipe-overflow-btn"
                  aria-label="More actions"
                >⋯</button>
                {showOverflow && (
                  <>
                    <div className="recipe-overflow-backdrop" onClick={() => setShowOverflow(false)} />
                    <div className="recipe-overflow-menu">
                      <button
                        onClick={() => { setShowCollectionPicker(true); setShowOverflow(false); }}
                        className="recipe-overflow-item"
                      >
                        <span>📁 Collections</span>
                        {recipeCollections.length > 0 && <span className="recipe-overflow-badge">{recipeCollections.length}</span>}
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => { onUpdate({ ...recipe, is_public: !recipe.is_public }); setShowOverflow(false); }}
                          className="recipe-overflow-item"
                        >
                          <span>{recipe.is_public ? "🌍 Public" : "🔒 Private"}</span>
                          <span className="recipe-overflow-hint">{recipe.is_public ? "tap to hide" : "tap to share"}</span>
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => { setEditMode(true); setShowOverflow(false); }}
                          className="recipe-overflow-item"
                        >✏️ Edit</button>
                      )}
                      <button
                        onClick={() => { onDuplicate(); setShowOverflow(false); }}
                        className="recipe-overflow-item"
                      >⧉ Duplicate</button>
                      {isOwner && (
                        <button
                          onClick={() => { setShowOverflow(false); onDelete(); }}
                          className="recipe-overflow-item recipe-overflow-item-danger"
                        >🗑 Delete recipe</button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {showCollectionPicker && (
                <>
                  <div className="recipe-overflow-backdrop" onClick={() => setShowCollectionPicker(false)} />
                  <div className="recipe-collection-dropdown">
                    <p className="label-uppercase recipe-collection-heading">Add to Collection</p>
                    {collections.length === 0 && <p className="recipe-collection-empty">No collections yet</p>}
                    {collections.map(c => (
                      <label key={c.id} className="recipe-collection-option">
                        <input
                          type="checkbox"
                          checked={c.recipeIds.includes(recipe.id)}
                          onChange={() => toggleCollection(c.id)}
                          className="recipe-collection-checkbox"
                        />
                        {c.emoji} {c.name}
                      </label>
                    ))}
                    <button onClick={() => setShowCollectionPicker(false)} className="recipe-collection-done">Done</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {editMode ? (
        <textarea
          value={draft.description}
          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          rows={2}
          className="input recipe-desc-input"
        />
      ) : (
        <p className="recipe-description">{recipe.description}</p>
      )}

      <div className="recipe-tags">
        {draft.tags.map(t => (
          <Tag key={t} label={t} onRemove={editMode ? () => setDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) })) : null} />
        ))}
        {editMode && (
          <input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newTag.trim()) { setDraft(d => ({ ...d, tags: [...d.tags, newTag.trim()] })); setNewTag(""); }}}
            placeholder="Add tag…"
            className="recipe-tag-input"
          />
        )}
      </div>

      {recipeCollections.length > 0 && (
        <div className="recipe-collection-badges">
          {recipeCollections.map(c => (
            <span key={c.id} className="recipe-collection-badge">{c.emoji} {c.name}</span>
          ))}
        </div>
      )}

      <div className="recipe-meta-row">
        {[{ label: "Prep", key: "prepTime" }, { label: "Cook", key: "cookTime" }, { label: "Servings", key: "servings" }].map(({ label, key }) => (
          <div key={key} className="recipe-meta-item">
            <div className="recipe-meta-label">{label}</div>
            {editMode ? (
              <input
                value={draft[key]}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                className="recipe-meta-input"
              />
            ) : (
              <div className={"recipe-meta-value" + (key === "servings" && scaledServings !== recipe.servings ? " scaled" : "")}>
                {key === "servings" ? scaledServings : recipe[key]}
              </div>
            )}
          </div>
        ))}
        {recipe.cook_count > 0 && (
          <div className="recipe-meta-item">
            <div className="recipe-meta-label">Cooked</div>
            <div className="recipe-meta-value">{recipe.cook_count}x</div>
          </div>
        )}
        {loadingCost ? (
          <div className="recipe-meta-item">
            <div className="recipe-meta-label">Est. Cost</div>
            <Skeleton width="60px" height="22px" style={{ margin: "4px auto 0" }} />
          </div>
        ) : costEstimate !== null && (
          <div className="recipe-meta-item">
            <div className="recipe-meta-label">Est. Cost</div>
            <div className="recipe-meta-value">€{(costEstimate.total * ratio).toFixed(2)}</div>
            <div className="recipe-meta-label" style={{ marginTop: 2 }}>
              {costEstimate.breakdown.filter(b => b.estimate !== null).length}/{costEstimate.breakdown.length} items
            </div>
          </div>
        )}
      </div>

      <div className="recipe-tabs">
        {["recipe", "ai"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={"recipe-tab" + (tab === t ? " active" : "")}>
            {t === "recipe" ? "Recipe" : "✦ AI Assistant"}
          </button>
        ))}
      </div>

      {tab === "recipe" ? (
        <>
          <div style={{ marginTop: 24 }}>
            <ServingScaler baseServings={recipe.servings} value={scaledServings} onChange={setScaledServings} />
          </div>
          <div className="recipe-body">
            <div className="recipe-ingredients">
              <h2 className="section-title">
                Ingredients
                {scaledServings !== recipe.servings && (
                  <span className="recipe-scaled-badge">scaled ×{ratio.toFixed(2).replace(/\.?0+$/, "")}</span>
                )}
              </h2>
              <div className="recipe-ingredient-list">
                {draft.ingredients.map((ing, i) => (
                  <div key={i} className="recipe-ingredient">
                    {editMode ? (
                      <>
                        <input value={ing.amount} onChange={e => { const arr = [...draft.ingredients]; arr[i] = { ...arr[i], amount: e.target.value }; setDraft(d => ({ ...d, ingredients: arr })); }} className="recipe-ing-amount-input" />
                        <input value={ing.name} onChange={e => { const arr = [...draft.ingredients]; arr[i] = { ...arr[i], name: e.target.value }; setDraft(d => ({ ...d, ingredients: arr })); }} className="recipe-ing-name-input" />
                        <span onClick={() => removeIngredient(i)} className="recipe-remove">×</span>
                      </>
                    ) : (
                      <>
                        <span className="recipe-ing-amount">{scaleAmount(ing.amount, ratio)}</span>
                        <span className="recipe-ing-name">{ing.name}</span>
                      </>
                    )}
                  </div>
                ))}
                {editMode && (
                  <div className="recipe-add-ingredient">
                    <input value={newIngredient.amount} onChange={e => setNewIngredient(n => ({ ...n, amount: e.target.value }))} placeholder="Amount" className="recipe-ing-amount-input" />
                    <input value={newIngredient.name} onChange={e => setNewIngredient(n => ({ ...n, name: e.target.value }))} placeholder="Ingredient" onKeyDown={e => e.key === "Enter" && addIngredient()} className="recipe-ing-name-input" />
                    <button onClick={addIngredient} className="btn btn-gold">+</button>
                  </div>
                )}
              </div>
            </div>

            <div className="recipe-method">
              <h2 className="section-title">Method</h2>
              <div className="recipe-steps">
                {draft.method.map((step, i) => (
                  <div key={i} className="recipe-step">
                    <span className="recipe-step-num">{i + 1}</span>
                    {editMode ? (
                      <div className="recipe-step-edit">
                        <textarea value={step} onChange={e => updateMethod(i, e.target.value)} rows={2} className="input" />
                        <span onClick={() => removeStep(i)} className="recipe-remove">×</span>
                      </div>
                    ) : (
                      <p className="recipe-step-text">{step}</p>
                    )}
                  </div>
                ))}
                {editMode && (
                  <button onClick={addStep} className="btn btn-secondary recipe-add-step">+ Add step</button>
                )}
              </div>

              {(draft.notes || editMode) && (
                <div className="card-note recipe-notes">
                  <p className="label-uppercase" style={{ marginBottom: 4 }}>Notes</p>
                  {editMode ? (
                    <textarea value={draft.notes || ""} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={2} className="recipe-notes-input" />
                  ) : (
                    <p className="recipe-notes-text">{recipe.notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="recipe-ai-tab">
          {isOwner ? (
          <AIChat recipe={recipe} onUpdate={handleAIUpdate} checkCredits={checkCredits} />
        ) : (
          <div className="empty-state">
            <p className="empty-state-emoji">🔒</p>
            <p className="empty-state-title">AI Assistant unavailable</p>
            <p className="empty-state-text">Duplicate this recipe to your library to use the AI assistant.</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
