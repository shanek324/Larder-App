import { useState } from "react";
import { DUNNES_AISLES } from "../constants";
import { callClaude, matchesPantry } from "../utils";

export default function ShoppingListView({ recipes, pantryItems, onSaveList }) {
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [consolidated, setConsolidated] = useState(null);
  const [crossedOff, setCrossedOff] = useState({});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");

  function toggleRecipe(id) {
    setSelectedRecipes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setConsolidated(null);
    setCrossedOff({});
  }

  const rawIngredients = recipes
    .filter(r => selectedRecipes.includes(r.id))
    .flatMap(r => r.ingredients);

  async function handleGenerate() {
    setGenerating(true);
    const ingredientList = rawIngredients.map(i => (i.amount ? i.amount + " " : "") + i.name).join("\n");
    const messages = [{
      role: "user",
      content: "You are a shopping list consolidator. Given these raw ingredients from multiple recipes, consolidate them into a clean shopping list. Combine duplicates and similar items intelligently (e.g. 2 chicken breasts and 500g chicken should become one item). For each item return the best combined name, combined amounts, and which aisle it belongs to from this list: " + aisleNames + ", Other.\n\nIngredients:\n" + ingredientList + "\n\nRespond with ONLY a JSON array, no other text. Each item: name (string), amounts (array of strings), aisle (string), key (unique slug prefixed with con-)."
    }];
    try {
      const res = await callClaude(messages);
      const parsed = JSON.parse(res);
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
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", margin: "0 0 4px", fontWeight: 700 }}>Shopping List</h1>
          <p style={{ margin: 0, color: "#9e8a73", fontSize: 14 }}>Select recipes, generate your list, cross off what you have</p>
        </div>
        {consolidated && consolidated.length > 0 && (
          <button onClick={handleFinalise} disabled={saving} style={{ background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
            {saving ? "Saving..." : "Finalise List →"}
          </button>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#5c4a2a" }}>Select recipes:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {recipes.map(r => (
            <span key={r.id} onClick={() => toggleRecipe(r.id)} style={{
              padding: "7px 14px", borderRadius: 20, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              background: selectedRecipes.includes(r.id) ? "#2c1810" : "#f0ebe3",
              color: selectedRecipes.includes(r.id) ? "#f5e6c8" : "#5c4a2a",
              border: "1.5px solid", borderColor: selectedRecipes.includes(r.id) ? "#2c1810" : "#e8e0d5",
            }}>
              {r.title}
            </span>
          ))}
        </div>
      </div>

      {selectedRecipes.length > 0 && !consolidated && (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9e8a73", marginBottom: 16 }}>
            {rawIngredients.length} ingredients across {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? "s" : ""}
          </p>
          <button onClick={handleGenerate} disabled={generating} style={{ background: "#c8a96e", color: "#2c1810", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700 }}>
            {generating ? "Generating..." : "✦ Generate List"}
          </button>
        </div>
      )}

      {consolidated && consolidated.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: 30, marginBottom: 8 }}>✅</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#5c4a2a" }}>Everything is already in your pantry!</p>
        </div>
      )}

      {sortedAisles.map(aisle => {
        const aisleInfo = DUNNES_AISLES.find(a => a.name === aisle) || { icon: "🛒" };
        return (
          <div key={aisle} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #e8e0d5" }}>
              <span style={{ fontSize: 16 }}>{aisleInfo.icon}</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#2c1810" }}>{aisle}</span>
              <span style={{ fontSize: 12, color: "#9e8a73", marginLeft: 4 }}>({grouped[aisle].length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {grouped[aisle].map(item => (
                <label key={item.key} onClick={() => setCrossedOff(c => ({ ...c, [item.key]: !c[item.key] }))} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: crossedOff[item.key] ? "#f5f0e8" : "#fffdf8",
                  border: "1px solid", borderColor: crossedOff[item.key] ? "#e8d5a0" : "#e8e0d5",
                }}>
                  <input type="checkbox" checked={!!crossedOff[item.key]} onChange={() => setCrossedOff(c => ({ ...c, [item.key]: !c[item.key] }))} style={{ accentColor: "#c8a96e", width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: crossedOff[item.key] ? "#9e8a73" : "#2c1810", textDecoration: crossedOff[item.key] ? "line-through" : "none" }}>
                    {item.name}
                  </span>
                  {item.amounts && item.amounts.length > 0 && (
                    <span style={{ fontSize: 12, color: "#c8a96e", fontWeight: 600 }}>{item.amounts.join(" + ")}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
