import { useState } from "react";
import { categoriseIngredient, callClaude } from "../utils";
import { DUNNES_AISLES } from "../constants";

export default function PantryView({ pantryItems, onUpdatePantry }) {
  const [newItem, setNewItem] = useState("");
  const [search, setSearch] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");

  function addItem() {
    if (!newItem.trim()) return;
    const item = {
      id: "pantry-" + Date.now(),
      name: newItem.trim(),
      aisle: categoriseIngredient(newItem.trim()),
      addedAt: Date.now(),
    };
    onUpdatePantry([...pantryItems, item]);
    setNewItem("");
  }

  function removeItem(id) {
    onUpdatePantry(pantryItems.filter(i => i.id !== id));
  }

  async function handleCleanup() {
    setCleaning(true);
    try {
      const itemList = pantryItems.map(i => i.name).join("\n");
      const messages = [{
        role: "user",
        content: "Deduplicate and clean this pantry list. Combine similar items (e.g. Garlic, Garlic cloves, Garlic minced = Garlic). Use short clean names only. Aisles: " + aisleNames + ", Other.\n\n" + itemList + "\n\nReply ONLY with a JSON array. Each item: name (short clean string), aisle (string), key (con- prefixed slug)."
      }];
      const res = await callClaude(messages, "", 2000, "claude-haiku-4-5-20251001");
      const cleaned = res.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const newItems = parsed.map((i, idx) => ({
        id: "pantry-" + Date.now() + idx,
        name: i.name,
        aisle: i.aisle || "Other",
        addedAt: Date.now(),
      }));
      await onUpdatePantry(newItems);
    } catch(e) {
      console.error("Cleanup error:", e);
      alert("Cleanup failed, please try again.");
    }
    setCleaning(false);
  }

  const filtered = pantryItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const grouped = {};
  filtered.forEach(item => {
    const a = item.aisle || "Other";
    if (!grouped[a]) grouped[a] = [];
    grouped[a].push(item);
  });
  const sortedAisles = Object.keys(grouped).sort((a, b) => aisleOrder.indexOf(a) - aisleOrder.indexOf(b));

  return (
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", margin: "0 0 4px", fontWeight: 700 }}>Pantry</h1>
          <p style={{ margin: 0, color: "#9e8a73", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{pantryItems.length} item{pantryItems.length !== 1 ? "s" : ""} in stock</p>
        </div>
        {pantryItems.length > 0 && (
          <button onClick={handleCleanup} disabled={cleaning} style={{ background: "#f5e6c8", color: "#8b6914", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
            {cleaning ? "Cleaning..." : "✦ Clean up"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="Add item to pantry…"
          style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #ddd5c8", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#fffdf8", outline: "none", color: "#3a2e22" }}
        />
        <button onClick={addItem} style={{ background: "#c8a96e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>Add</button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search pantry…"
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd5c8", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#fffdf8", outline: "none", color: "#3a2e22", marginBottom: 20, boxSizing: "border-box" }}
      />

      {pantryItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e8a73" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🥫</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#5c4a2a", marginBottom: 8 }}>Your pantry is empty</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Add items you always have in stock — they will be excluded from your shopping list.</p>
        </div>
      ) : (
        sortedAisles.map(aisle => {
          const aisleInfo = DUNNES_AISLES.find(a => a.name === aisle) || { icon: "🛒" };
          return (
            <div key={aisle} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #e8e0d5" }}>
                <span style={{ fontSize: 16 }}>{aisleInfo.icon}</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#2c1810" }}>{aisle}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9e8a73", marginLeft: 4 }}>({grouped[aisle].length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {grouped[aisle].map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#fffdf8", border: "1px solid #e8e0d5" }}>
                    <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#2c1810" }}>{item.name}</span>
                    <span onClick={() => removeItem(item.id)} style={{ color: "#c0392b", opacity: 0.5, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
