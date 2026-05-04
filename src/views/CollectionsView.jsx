import { useState } from "react";
import RecipeCard from "../components/RecipeCard";

const EMOJIS = ["📁","🇵🇹","🇮🇹","🇫🇷","🇯🇵","🇲🇽","🧁","🍝","🐟","🥩","🥗","🍲","⚡","❤️","🌿","🎉"];

export default function CollectionsView({ collections, recipes, onUpdateCollections, onViewRecipe }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [activeCol, setActiveCol] = useState(null);

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
              placeholder="Collection name…"
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
                  onClick={e => { e.stopPropagation(); deleteCollection(col.id); }}
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
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeRecipes.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => onViewRecipe(r.id)} compact />)}
                </div>
              )
            ) : (
              <div className="collections-placeholder">← Select a collection to view its recipes</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
