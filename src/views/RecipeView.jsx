import { useState, useEffect, useMemo } from "react";
import { toast } from "../toast";
import CostBreakdownModal from "./CostBreakdownModal";
import Tag from "../components/Tag";
import ServingScaler from "../components/ServingScaler";
import AIChat from "../components/AIChat";
import { scaleAmount, computeRecipeCost } from "../utils";
import Skeleton from "../components/Skeleton";

export default function RecipeView({ recipe, onBack, onUpdate, onDelete, collections, onUpdateCollections, onStartCooking, onDuplicate, onAddToLibrary, session, authorName, priceMap, onSavePrices }) {
  const [editMode, setEditMode] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [draft, setDraft] = useState(recipe);
  const [tab, setTab] = useState("recipe");
  const [newIngredient, setNewIngredient] = useState({ name: "", amount: "" });
  const [newTag, setNewTag] = useState("");
  const [scaledServings, setScaledServings] = useState(recipe.servings);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPublic, setConfirmPublic] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  useEffect(() => { setDraft(recipe); setScaledServings(recipe.servings); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [recipe.id]);

  // Cost estimate is computed synchronously against a priceMap loaded once
  // in App.jsx (and refreshed when new prices arrive via receipt scan).
  // No fetch here, no loading state.
  const costEstimate = useMemo(() => {
    return computeRecipeCost(recipe.ingredients, priceMap);
  }, [recipe.ingredients, priceMap]);
  const loadingCost = false;

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
    // Snapshot the pre-update recipe so the user can undo.
    const snapshot = { ...recipe };
    // Only let the AI change content fields. All metadata (cook_count, step_notes,
    // lastCooked, is_public, is_approved, user_id) is preserved.
    const CONTENT_FIELDS = ["title", "description", "ingredients", "method", "tags",
                            "prepTime", "cookTime", "servings", "notes"];
    const safeUpdate = { ...recipe };
    CONTENT_FIELDS.forEach(field => {
      if (updated[field] !== undefined) safeUpdate[field] = updated[field];
    });
    onUpdate(safeUpdate);
    toast.action("Recipe updated by AI", {
      actionLabel: "Undo",
      onAction: () => { onUpdate(snapshot); toast.info("Reverted."); },
    });
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
            {isOwner && recipe.is_public && !recipe.is_approved && (
              <p className="recipe-pending-badge" role="status" aria-label="This recipe is pending admin review">
                🕓 Pending review
              </p>
            )}
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
                          onClick={() => {
                            setShowOverflow(false);
                            if (recipe.is_public) {
                              // Going public → private: no confirm needed.
                              onUpdate({ ...recipe, is_public: false, is_approved: false });
                            } else {
                              setConfirmPublic(true);
                            }
                          }}
                          className="recipe-overflow-item"
                        >
                          <span>
                            {recipe.is_public
                              ? (recipe.is_approved ? "🌍 Public" : "🕓 Pending review")
                              : "🔒 Private"}
                          </span>
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
                          onClick={() => { setShowOverflow(false); setConfirmDelete(true); }}
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
            placeholder="Add tag…" aria-label="Add tag…"
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
        ) : costEstimate.breakdown.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCostBreakdown(true)}
            className="recipe-meta-item recipe-meta-cost-btn"
            aria-label="Show cost breakdown"
          >
            <div className="recipe-meta-label">Est. Cost</div>
            <div className="recipe-meta-value">
              {costEstimate.hasData ? "€" + (costEstimate.total * ratio).toFixed(2) : "—"}
            </div>
            <div className="recipe-meta-label" style={{ marginTop: 2 }}>
              {costEstimate.breakdown.filter(b => b.estimate !== null).length}/{costEstimate.breakdown.length} items ›
            </div>
          </button>
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
                        <button type="button" onClick={() => removeIngredient(i)} className="recipe-remove" aria-label="Remove ingredient">×</button>
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
                    <input value={newIngredient.amount} onChange={e => setNewIngredient(n => ({ ...n, amount: e.target.value }))} placeholder="Amount" aria-label="Amount" className="recipe-ing-amount-input" />
                    <input value={newIngredient.name} onChange={e => setNewIngredient(n => ({ ...n, name: e.target.value }))} placeholder="Ingredient" aria-label="Ingredient" onKeyDown={e => e.key === "Enter" && addIngredient()} className="recipe-ing-name-input" />
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
                        <button type="button" onClick={() => removeStep(i)} className="recipe-remove" aria-label="Remove step">×</button>
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
          <AIChat recipe={recipe} onUpdate={handleAIUpdate} messages={aiMessages} onMessagesChange={setAiMessages} />
        ) : (
          <div className="empty-state">
            <p className="empty-state-emoji">🔒</p>
            <p className="empty-state-title">AI Assistant unavailable</p>
            <p className="empty-state-text">Duplicate this recipe to your library to use the AI assistant.</p>
          </div>
        )}
        </div>
      )}
    {showCostBreakdown && (
      <CostBreakdownModal
        breakdown={costEstimate.breakdown}
        total={costEstimate.total}
        ratio={ratio}
        recipeTitle={recipe.title}
        onClose={() => setShowCostBreakdown(false)}
        onAddPrice={(entry) => onSavePrices([entry])}
      />
    )}
    {confirmDelete && (
      <div className="modal-overlay">
        <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>🗑️</p>
          <h2 className="section-title" style={{ textAlign: "center" }}>Delete this recipe?</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
            "{recipe.title}" will be permanently removed, along with its cook history. This can't be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setConfirmDelete(false); onDelete(); }}
              className="btn btn-danger btn-lg"
              style={{ flex: 1 }}
            >Yes, delete</button>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary btn-lg">Cancel</button>
          </div>
        </div>
      </div>
    )}
    {confirmPublic && (
      <div className="modal-overlay">
        <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>🌍</p>
          <h2 className="section-title" style={{ textAlign: "center" }}>Make this recipe public?</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24, lineHeight: 1.5 }}>
            "{recipe.title}" will be submitted for a quick review. Once approved, anyone using Larder will be able to view it and add it to their library. You can make it private again at any time.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { onUpdate({ ...recipe, is_public: true, is_approved: false }); setConfirmPublic(false); }}
              className="btn btn-gold btn-lg"
              style={{ flex: 1 }}
            >Submit for review</button>
            <button onClick={() => setConfirmPublic(false)} className="btn btn-secondary btn-lg">Cancel</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
