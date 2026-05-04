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

  function toggleCross(key) {
    setCrossedOff(c => ({ ...c, [key]: !c[key] }));
  }

  const rawIngredients = recipes
    .filter(r => selectedRecipes.includes(r.id))
    .flatMap(r => r.ingredients);

  async function handleGenerate() {
    setGenerating(true);
    const ingredientList = rawIngredients.map(i => (i.amount ? i.amount + " " : "") + i.name).join("\n");
    const messages = [{
      role: "user",
      content: "Consolidate these shopping ingredients into a clean list. Rules: 1) Combine duplicates and similar items (e.g. chicken breast, chicken breasts, 500g chicken = one item called Chicken Breast). 2) Use short clean names only - no descriptors like minced, sliced, grated, cubed. 3) Assign aisle from: " + aisleNames + ", Other.\n\n" + ingredientList + "\n\nReply ONLY with a JSON array. Each item: name (short clean string), amounts (string array), aisle (string), key (con- prefixed slug of name)."
    }];
    try {
      const res = await callClaude(messages, "", 2000, "claude-haiku-4-5-20251001");
      const cleaned = res.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
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
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Shopping List</h1>
          <p className="page-subtitle">Select recipes, generate your list, cross off what you have</p>
        </div>
        {consolidated && consolidated.length > 0 && (
          <button onClick={handleFinalise} disabled={saving} className="btn btn-primary btn-lg">
            {saving ? "Saving..." : "Finalise List →"}
          </button>
        )}
      </div>

      <div className="shopping-recipe-select">
        <p className="shopping-select-label">Select recipes:</p>
        <div className="shopping-recipe-pills">
          {recipes.map(r => (
            <span
              key={r.id}
              onClick={() => toggleRecipe(r.id)}
              className={"pill" + (selectedRecipes.includes(r.id) ? " active" : "")}
            >
              {r.title}
            </span>
          ))}
        </div>
      </div>

      {selectedRecipes.length > 0 && !consolidated && (
        <div className="shopping-generate">
          <p className="shopping-generate-info">
            {rawIngredients.length} ingredients across {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? "s" : ""}
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn btn-gold btn-lg">
            {generating ? "Generating..." : "✦ Generate List"}
          </button>
        </div>
      )}

      {consolidated && consolidated.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-emoji">✅</p>
          <p className="empty-state-title">Everything is already in your pantry!</p>
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
                <label
                  key={item.key}
                  onClick={() => toggleCross(item.key)}
                  className={"shopping-item" + (crossedOff[item.key] ? " crossed" : "")}
                >
                  <input
                    type="checkbox"
                    checked={!!crossedOff[item.key]}
                    onChange={() => toggleCross(item.key)}
                    className="shopping-item-check"
                  />
                  <span className="shopping-item-name">{item.name}</span>
                  {item.amounts && item.amounts.length > 0 && (
                    <span className="shopping-item-amount">{item.amounts.join(" + ")}</span>
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
