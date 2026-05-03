import { useState } from "react";
import { DUNNES_AISLES } from "../constants";
import { autoConsolidate, matchesPantry } from "../utils";
import FinaliseModal from "./FinaliseModal";

export default function ShoppingListView({ recipes, pantryItems, shoppingList, onUpdateShoppingList }) {
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [showFinalise, setShowFinalise] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);

  function toggleRecipe(id) {
    setSelectedRecipes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  const rawIngredients = recipes
    .filter(r => selectedRecipes.includes(r.id))
    .flatMap(r => r.ingredients.map(ing => ({ ...ing, recipeTitle: r.title })));

  const consolidated = autoConsolidate(rawIngredients).filter(item => !matchesPantry(item.name, pantryItems));

  const grouped = {};
  consolidated.forEach(item => {
    const a = item.aisle || "Other";
    if (!grouped[a]) grouped[a] = [];
    grouped[a].push(item);
  });
  const sortedAisles = Object.keys(grouped).sort((a, b) => aisleOrder.indexOf(a) - aisleOrder.indexOf(b));

  function handleFinalise({ removeKeys, addToPantry }) {
    const updatedList = shoppingList.filter(i => !removeKeys.includes(i.key));
    onUpdateShoppingList(updatedList, addToPantry);
    setShowFinalise(false);
  }

  return (
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", margin: "0 0 4px", fontWeight: 700 }}>Shopping List</h1>
          <p style={{ margin: 0, color: "#9e8a73", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Select recipes to build your list</p>
        </div>
        {consolidated.length > 0 && (
          <button onClick={() => setShowFinalise(true)} style={{ background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
            Finalise List →
          </button>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#5c4a2a" }}>Select recipes:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {recipes.map(r => (
            <span
              key={r.id}
              onClick={() => toggleRecipe(r.id)}
              style={{
                padding: "7px 14px", borderRadius: 20, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                background: selectedRecipes.includes(r.id) ? "#2c1810" : "#f0ebe3",
                color: selectedRecipes.includes(r.id) ? "#f5e6c8" : "#5c4a2a",
                border: "1.5px solid", borderColor: selectedRecipes.includes(r.id) ? "#2c1810" : "#e8e0d5",
                transition: "all 0.15s ease",
              }}
            >
              {r.title}
            </span>
          ))}
        </div>
      </div>

      {selectedRecipes.length > 0 && consolidated.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#9e8a73" }}>
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
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9e8a73", marginLeft: 4 }}>({grouped[aisle].length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {grouped[aisle].map(item => (
                <label key={item.key} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: checkedItems[item.key] ? "#f5f0e8" : "#fffdf8",
                  border: "1px solid", borderColor: checkedItems[item.key] ? "#e8d5a0" : "#e8e0d5",
                  transition: "all 0.12s",
                }}>
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.key]}
                    onChange={e => setCheckedItems(c => ({ ...c, [item.key]: e.target.checked }))}
                    style={{ accentColor: "#c8a96e", width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: checkedItems[item.key] ? "#9e8a73" : "#2c1810", textDecoration: checkedItems[item.key] ? "line-through" : "none" }}>
                    {item.name}
                  </span>
                  {item.amounts?.length > 0 && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#c8a96e", fontWeight: 600 }}>
                      {item.amounts.join(" + ")}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {showFinalise && (
        <FinaliseModal
          items={consolidated}
          onConfirm={handleFinalise}
          onClose={() => setShowFinalise(false)}
        />
      )}
    </div>
  );
}
