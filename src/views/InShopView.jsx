import { useState } from "react";
import { DUNNES_AISLES } from "../constants";
import ReceiptScanner from "../components/ReceiptScanner";

export default function InShopView({ savedList, pantryItems, onClearList, onUpdatePantry, onSavePrices }) {
  const [checked, setChecked] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStartOver, setShowStartOver] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const items = savedList?.items || [];
  const tickedCount = items.filter(i => checked[i.key]).length;
  const allChecked = items.length > 0 && tickedCount === items.length;

  function toggleItem(key) {
    setChecked(c => ({ ...c, [key]: !c[key] }));
  }

  async function handleReceiptConfirm(scannedItems) {
    const priceEntries = scannedItems.map(i => ({
      ingredient_name: i.name,
      total_price: i.total_price,
      quantity: i.quantity,
      unit: i.unit,
    }));
    await onSavePrices(priceEntries);
    const existing = pantryItems.map(p => p.name.toLowerCase());
    const newItems = scannedItems
      .filter(i => !existing.includes(i.name.toLowerCase()))
      .map(i => ({ id: "pantry-" + Date.now() + Math.random(), name: i.name, aisle: i.aisle, addedAt: Date.now() }));
    if (newItems.length > 0) await onUpdatePantry([...pantryItems, ...newItems]);
    setShowScanner(false);
    await handleFinished();
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
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Shopping</h1>
          <p className="page-subtitle">{tickedCount} of {items.length} items ticked</p>
        </div>
        <button onClick={() => setShowStartOver(true)} className="btn btn-secondary" style={{ fontSize: 12 }}>
          Start over
        </button>
        {allChecked && (
          <button onClick={() => setShowConfirm(true)} className="btn btn-primary btn-lg">
            Finished Shopping ✓
          </button>
        )}
      </div>

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
                  onClick={() => toggleItem(item.key)}
                  className={"shopping-item" + (checked[item.key] ? " crossed" : "")}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[item.key]}
                    onChange={() => toggleItem(item.key)}
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

      {showStartOver && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🗑️</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>Start over?</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
              This will clear your shopping list completely.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onClearList(); setShowStartOver(false); }} className="btn btn-danger btn-lg" style={{ flex: 1 }}>Yes, clear it</button>
              <button onClick={() => setShowStartOver(false)} className="btn btn-secondary btn-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🛒</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>All done?</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
              This will add your bought items to the pantry and clear your shopping list.
            </p>
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <button onClick={handleFinished} className="btn btn-primary btn-lg">Yes, finish up</button>
              <button onClick={() => { setShowConfirm(false); setShowScanner(true); }} className="btn btn-gold btn-lg">🧾 Scan Receipt First</button>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary btn-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showScanner && (
        <ReceiptScanner
          onConfirm={handleReceiptConfirm}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
