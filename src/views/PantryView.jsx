import { useState } from "react";
import ReceiptScanner from "../components/ReceiptScanner";
import { categoriseIngredient, callClaude } from "../utils";
import { DUNNES_AISLES } from "../constants";

const STOCK_LEVELS = [
  { key: "high", label: "High" },
  { key: "med",  label: "Med" },
  { key: "low",  label: "Low" },
];

export default function PantryView({ pantryItems, onUpdatePantry, onSavePrices, session }) {
  const [newItem, setNewItem] = useState("");
  const [search, setSearch] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");

  async function handleReceiptConfirm(scannedItems) {
    // Save prices to prices table
    const priceEntries = scannedItems.map(i => ({
      ingredient_name: i.name,
      price_per_unit: i.price,
      unit: i.unit,
    }));
    await onSavePrices(priceEntries);

    // Add to pantry if not already there
    const existing = pantryItems.map(p => p.name.toLowerCase());
    const newItems = scannedItems
      .filter(i => !existing.includes(i.name.toLowerCase()))
      .map(i => ({
        id: "pantry-" + Date.now() + Math.random(),
        name: i.name,
        aisle: i.aisle,
        addedAt: Date.now(),
        stockLevel: "high",
        price: i.price,
      }));
    if (newItems.length > 0) {
      onUpdatePantry([...pantryItems, ...newItems]);
    }
    setShowScanner(false);
  }

  function addItem() {
    if (!newItem.trim()) return;
    const item = {
      id: "pantry-" + Date.now(),
      name: newItem.trim(),
      aisle: categoriseIngredient(newItem.trim()),
      addedAt: Date.now(),
      stockLevel: "high",
    };
    onUpdatePantry([...pantryItems, item]);
    setNewItem("");
  }

  function removeItem(id) {
    onUpdatePantry(pantryItems.filter(i => i.id !== id));
  }

  function setStockLevel(id, level) {
    onUpdatePantry(pantryItems.map(i => i.id === id ? { ...i, stockLevel: level } : i));
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
        stockLevel: "high",
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
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Pantry</h1>
          <p className="page-subtitle">{pantryItems.length} item{pantryItems.length !== 1 ? "s" : ""} in stock</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowScanner(true)} className="btn btn-primary">🧾 Scan Receipt</button>
          {pantryItems.length > 0 && (
            <button onClick={handleCleanup} disabled={cleaning} className="btn btn-gold">
              {cleaning ? "Cleaning..." : "✦ Clean up"}
            </button>
          )}
        </div>
      </div>

      <div className="pantry-add-row">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="Add item to pantry…"
          className="input"
        />
        <button onClick={addItem} className="btn btn-gold btn-lg">Add</button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search pantry…"
        className="input pantry-search"
      />

      {pantryItems.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-emoji">🥫</p>
          <p className="empty-state-title">Your pantry is empty</p>
          <p className="empty-state-text">Add items you always have in stock — they will be excluded from your shopping list.</p>
        </div>
      ) : (
        sortedAisles.map(aisle => {
          const aisleInfo = DUNNES_AISLES.find(a => a.name === aisle) || { icon: "🛒" };
          return (
            <div key={aisle} className="aisle-section">
              <div className="aisle-header">
                <span>{aisleInfo.icon}</span>
                <span className="aisle-name">{aisle}</span>
                <span className="aisle-count">({grouped[aisle].length})</span>
              </div>
              <div className="pantry-items">
                {grouped[aisle].map(item => (
                  <div key={item.id} className="pantry-item">
                    <span className="pantry-item-name">{item.name}</span>
                    <div className="stock-toggle">
                      {STOCK_LEVELS.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setStockLevel(item.id, key)}
                          className={"stock-btn" + (item.stockLevel === key ? " active-" + key : "")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <span onClick={() => removeItem(item.id)} className="pantry-item-remove">×</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
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
