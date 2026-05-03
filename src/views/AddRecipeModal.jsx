import { useState } from "react";
import { DUNNES_AISLES } from "../constants";

export default function FinaliseModal({ items, onConfirm, onClose }) {
  const [step, setStep] = useState(1);
  const [removeChecked, setRemoveChecked] = useState({});
  const [pantryChecked, setPantryChecked] = useState({});

  const itemsToRemove = items.filter(i => removeChecked[i.key]);

  function goToStep2() {
    if (itemsToRemove.length === 0) {
      onConfirm({ removeKeys: [], addToPantry: [] });
      return;
    }
    const pre = {};
    itemsToRemove.forEach(i => { pre[i.key] = true; });
    setPantryChecked(pre);
    setStep(2);
  }

  function confirm() {
    const addToPantry = itemsToRemove.filter(i => pantryChecked[i.key]);
    onConfirm({ removeKeys: itemsToRemove.map(i => i.key), addToPantry });
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: "#fffdf8", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(44,24,16,0.25)" }}>

        {step === 1 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 21, color: "#2c1810" }}>Finalise List</h2>
                <p style={{ margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7a6651" }}>Tick anything you already have or aren't getting</p>
              </div>
              <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: "#9e8a73", marginLeft: 12, lineHeight: 1 }}>×</span>
            </div>

            <div style={{ margin: "18px 0 20px", display: "flex", flexDirection: "column", gap: 22 }}>
              {sortedAisles.map(aisle => {
                const aisleInfo = DUNNES_AISLES.find(a => a.name === aisle) || { icon: "🛒" };
                return (
                  <div key={aisle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingBottom: 5, borderBottom: "1px solid #e8e0d5" }}>
                      <span style={{ fontSize: 14 }}>{aisleInfo.icon}</span>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#2c1810" }}>{aisle}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {grouped[aisle].map(item => (
                        <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: removeChecked[item.key] ? "#fdf6e8" : "transparent", border: removeChecked[item.key] ? "1px solid #e8d5a0" : "1px solid transparent", transition: "all 0.12s" }}>
                          <input type="checkbox" checked={!!removeChecked[item.key]} onChange={e => setRemoveChecked(c => ({ ...c, [item.key]: e.target.checked }))} style={{ accentColor: "#c8a96e", width: 16, height: 16, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#2c1810" }}>{item.name}</span>
                          {item.amounts?.length > 0 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#c8a96e", fontWeight: 600 }}>{item.amounts[0]}</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={goToStep2} style={{ flex: 1, background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>
                {itemsToRemove.length > 0 ? `Remove ${itemsToRemove.length} item${itemsToRemove.length !== 1 ? "s" : ""} →` : "Nothing to remove — done"}
              </button>
              <button onClick={onClose} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Cancel</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 21, color: "#2c1810" }}>Save to Pantry?</h2>
                <p style={{ margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7a6651" }}>Which of these do you want to mark as in-stock in your pantry?</p>
              </div>
              <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: "#9e8a73", marginLeft: 12, lineHeight: 1 }}>×</span>
            </div>

            <div style={{ margin: "18px 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
              {itemsToRemove.map(item => (
                <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: pantryChecked[item.key] ? "#e8f5e9" : "#f7f3ec", border: pantryChecked[item.key] ? "1px solid #a5d6a7" : "1px solid transparent", transition: "all 0.12s" }}>
                  <input type="checkbox" checked={!!pantryChecked[item.key]} onChange={e => setPantryChecked(c => ({ ...c, [item.key]: e.target.checked }))} style={{ accentColor: "#2e7d32", width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#2c1810", fontWeight: 500 }}>{item.name}</span>
                  {item.amounts?.length > 0 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#c8a96e", fontWeight: 600 }}>{item.amounts[0]}</span>}
                </label>
              ))}
            </div>

            <div style={{ background: "#fdf6e8", borderRadius: 10, padding: "10px 14px", marginBottom: 18 }}>
              <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#7a6651", lineHeight: 1.5 }}>
                {itemsToRemove.filter(i => pantryChecked[i.key]).length} of {itemsToRemove.length} will be saved to pantry as in-stock. The rest will just be removed from the list.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={confirm} style={{ flex: 1, background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>Confirm & Update List</button>
              <button onClick={() => setStep(1)} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>← Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
