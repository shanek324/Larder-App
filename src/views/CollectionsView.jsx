import { useState } from "react";
import RecipeCard from "../components/RecipeCard";

export default function CollectionsView({ collections, recipes, onUpdateCollections, onViewRecipe }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [activeCol, setActiveCol] = useState(null);

  const EMOJIS = ["📁","🇵🇹","🇮🇹","🇫🇷","🇯🇵","🇲🇽","🧁","🍝","🐟","🥩","🥗","🍲","⚡","❤️","🌿","🎉"];

  function createCollection() {
    if (!newName.trim()) return;
    onUpdateCollections([...collections, {
      id: "col-" + Date.now(),
      name: newName.trim(),
      emoji: newEmoji,
      recipeIds: [],
      createdAt: Date.now()
    }]);
    setNewName(""); setNewEmoji("📁"); setShowCreate(false);
  }

  function deleteCollection(id) {
    onUpdateCollections(collections.filter(c => c.id !== id));
    if (activeCol === id) setActiveCol(null);
  }

  const active = collections.find(c => c.id === activeCol);
  const activeRecipes = active ? recipes.filter(r => active.recipeIds.includes(r.id)) : [];

  return (
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", margin: "0 0 4px", fontWeight: 700 }}>Collections</h1>
          <p style={{ margin: 0, color: "#9e8a73", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} style={{ background: "#c8a96e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>+ New Collection</button>
      </div>

      {showCreate && (
        <div style={{ background: "#fffdf8", border: "1.5px solid #e8e0d5", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#5c4a2a" }}>New Collection</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {EMOJIS.map(e => (
              <span key={e} onClick={() => setNewEmoji(e)} style={{ cursor: "pointer", fontSize: 20, padding: 4, borderRadius: 8, background: newEmoji === e ? "#f5e6c8" : "transparent", border: newEmoji === e ? "1.5px solid #c8a96e" : "1.5px solid transparent" }}>{e}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createCollection()}
              placeholder="Collection name…"
              style={{ flex: 1, padding: "9px 14px", border: "1.5px solid #ddd5c8", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#faf7f2", outline: "none", color: "#3a2e22" }}
            />
            <button onClick={createCollection} style={{ background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Create</button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e8a73" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📁</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#5c4a2a", marginBottom: 8 }}>No collections yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,220px) minmax(0,1fr)", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {collections.map(col => (
              <div key={col.id} onClick={() => setActiveCol(activeCol === col.id ? null : col.id)} style={{ background: activeCol === col.id ? "#2c1810" : "#fffdf8", border: "1.5px solid", borderColor: activeCol === col.id ? "#2c1810" : "#e8e0d5", borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s ease", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: activeCol === col.id ? "#f5e6c8" : "#2c1810" }}>{col.emoji} {col.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9e8a73", marginTop: 2 }}>{col.recipeIds.length} recipe{col.recipeIds.length !== 1 ? "s" : ""}</div>
                </div>
                <span onClick={e => { e.stopPropagation(); deleteCollection(col.id); }} style={{ color: "#c0392b", opacity: 0.6, cursor: "pointer", fontSize: 16 }}>×</span>
              </div>
            ))}
          </div>

          <div>
            {active ? (
              activeRecipes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9e8a73", background: "#fffdf8", borderRadius: 14, border: "1.5px solid #e8e0d5" }}>
                  <p style={{ fontSize: 30, marginBottom: 8 }}>📭</p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#5c4a2a", marginBottom: 6 }}>No recipes in "{active.name}"</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeRecipes.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => onViewRecipe(r.id)} compact />)}
                </div>
              )
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#b5a48e", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontStyle: "italic" }}>← Select a collection to view its recipes</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
