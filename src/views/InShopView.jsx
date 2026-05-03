import { useState } from "react";
import { DUNNES_AISLES } from "../constants";

export default function InShopView({ savedList, pantryItems, onClearList, onUpdatePantry }) {
  const [checked, setChecked] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const items = savedList?.items || [];
  const allChecked = items.length > 0 && items.every(i => checked[i.key]);

  function toggleItem(key) {
    setChecked(c => ({ ...c, [key]: !c[key] }));
  }

  async function handleFinished() {
    const boughtItems = items.filter(i => checked[i.key]);
    const existing = pantryItems.map(p => p.name.toLowerCase());
    const newPantryItems = boughtItems
      .filter(i => !existing.includes(i.name.toLowerCase()))
      .map(i => ({ id: "pantry-" + Date.now() + Math.random(), name: i.name, aisle: i.aisle, addedAt: Date.now() }));
    if (newPantryItems.length > 0) {
      await onUpdatePantry([...pantryItems, ...newPantryItems]);
    }
    await onClearList();
    setShowConfirm(false);
  }

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const grouped = {};
  items.forEach(item => {
    const a = item.aisle || "Other";
    if (!grouped[a]) grouped[a] = [];
    grouped[a].push(item);
  });
  const sortedAisles = Object.keys(grouped).sort((a, b) => aisleOrder.indexOf(a) - aisleOrder.indexOf(b));

  return (
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", margin: "0 0 4px", fontWeight: 700 }}>Shopping</h1>
          <p style={{ margin: 0, color: "#9e8a73", fontSize: 14 }}>{items.filter(i => checked[i.key]).length} of {items.length} items ticked</p>
        </div>
        {allChecked && (
          <button onClick={() => setShowConfirm(true)} style={{ background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
            Finished Shopping
          </button>
        )}
      </div>

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
                <label key={item.key} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: checked[item.key] ? "#f5f0e8" : "#fffdf8",
                  border: "1px solid", borderColor: checked[item.key] ? "#e8d5a0" : "#e8e0d5",
                }}>
                  <input type="checkbox" checked={!!checked[item.key]} onChange={() => toggleItem(item.key)} style={{ accentColor: "#c8a96e", width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: checked[item.key] ? "#9e8a73" : "#2c1810", textDecoration: checked[item.key] ? "line-through" : "none" }}>
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

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fffdf8", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🛒</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2c1810", marginBottom: 8 }}>All done?</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#7a6651", marginBottom: 24 }}>This will add your bought items to the pantry and clear your shopping list.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleFinished} style={{ flex: 1, background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>Yes, finish up</button>
              <button onClick={() => setShowConfirm(false)} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 10, padding: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
