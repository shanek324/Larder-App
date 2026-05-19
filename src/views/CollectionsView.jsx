import { useState } from "react";
import RecipeCard from "../components/RecipeCard";

const EMOJIS = ["📁","🇵🇹","🇮🇹","🇫🇷","🇯🇵","🇲🇽","🧁","🍝","🐟","🥩","🥗","🍲","⚡","❤️","🌿","🎉"];

export default function CollectionsView({ collections, recipes, onUpdateCollections, onViewRecipe }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [activeCol, setActiveCol] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function createCollection() {
    if (!newName.trim()) return;
    onUpdateCollections([...collections, {
      id: "col-" + Date.now(),
      name: newName.trim(),
      emoji: newEmoji,
      recipeIds: [],
      createdAt: Date.now()
    }]);
    setNewName("");
    setNewEmoji("📁");
    setShowCreate(false);
  }

  function deleteCollection(id) {
    onUpdateCollections(collections.filter(c => c.id !== id));
    if (activeCol === id) setActiveCol(null);
  }

  const active = collections.find(c => c.id === activeCol);
  const activeRecipes = active ? recipes.filter(r => active.recipeIds.includes(r.id)) : [];

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} className="btn btn-gold btn-lg">
          + New Collection
        </button>
      </div>

      {showCreate && (
        <div className="collections-create-form">
          <p className="collections-create-label">New Collection</p>
          <div className="collections-emoji-picker">
            {EMOJIS.map(e => (
              <span
                key={e}
                onClick={() => setNewEmoji(e)}
                className={"collections-emoji" + (newEmoji === e ? " active" : "")}
              >{e}</span>
            ))}
          </div>
          <div className="collections-create-row">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createCollection()}
              placeholder="Collection name…" aria-label="Collection name…"
              className="input"
            />
            <button onClick={createCollection} className="btn btn-primary btn-lg">Create</button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-emoji">📁</p>
          <p className="empty-state-title">No collections yet</p>
          <p className="empty-state-text">Create a collection to group your favourite recipes.</p>
        </div>
      ) : (
        <div className="collections-layout">
          <div className="collections-list">
            {collections.map(col => (
              <div
                key={col.id}
                onClick={() => setActiveCol(activeCol === col.id ? null : col.id)}
                className={"collections-item" + (activeCol === col.id ? " active" : "")}
              >
                <div>
                  <div className="collections-item-name">{col.emoji} {col.name}</div>
                  <div className="collections-item-count">{col.recipeIds.length} recipe{col.recipeIds.length !== 1 ? "s" : ""}</div>
                </div>
                <span
                  onClick={e => { e.stopPropagation(); setConfirmDelete(col); }}
                  className="collections-item-delete"
                >×</span>
              </div>
            ))}
          </div>

          <div className="collections-recipes">
            {active ? (
              activeRecipes.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-emoji">📭</p>
                  <p className="empty-state-title">No recipes in "{active.name}"</p>
                  <p className="empty-state-text">Add recipes to this collection from the recipe detail view.</p>
                </div>
              ) : (
                <div className="collections-recipe-stack">
                  {activeRecipes.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => onViewRecipe(r.id)} compact />)}
                </div>
              )
            ) : (
              <div className="collections-placeholder">Tap a collection to view its recipes</div>
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🗑️</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>Delete this collection?</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
              "{confirmDelete.emoji} {confirmDelete.name}" — recipes inside will not be deleted.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { deleteCollection(confirmDelete.id); setConfirmDelete(null); }}
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
