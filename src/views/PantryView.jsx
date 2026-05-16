import { useState } from "react";
import ReceiptScanner from "../components/ReceiptScanner";
import { categoriseIngredient, callClaude } from "../utils";
import { DUNNES_AISLES } from "../constants";

export default function PantryView({ pantryItems, onUpdatePantry, onSavePrices, session, checkCredits }) {
  const [newItem, setNewItem] = useState("");
  const [search, setSearch] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const aisleOrder = DUNNES_AISLES.map(a => a.name).concat(["Other"]);
  const aisleNames = DUNNES_AISLES.map(a => a.name).join(", ");

  async function handleReceiptConfirm(scannedItems) {
    const priceEntries = scannedItems.map(i => ({
      ingredient_name: i.name,
      total_price: i.total_price,
      quantity: i.quantity,
      unit: i.unit,
    }));
    await onSavePrices(priceEntries);

    // Update existing items or add new ones, always set stock to high
    const updatedPantry = [...pantryItems];
    scannedItems.forEach(scanned => {
      const existingIdx = updatedPantry.findIndex(p => p.name.toLowerCase() === scanned.name.toLowerCase());
      if (existingIdx >= 0) {
        updatedPantry[existingIdx] = {
          ...updatedPantry[existingIdx],
          quantity: scanned.quantity || null,
          unit: scanned.unit || null,
          price: scanned.total_price || null,
          stockLevel: "high",
        };
      } else {
        updatedPantry.push({
          id: crypto.randomUUID(),
          name: scanned.name,
          aisle: scanned.aisle,
          addedAt: Date.now(),
          quantity: scanned.quantity || null,
          unit: scanned.unit || null,
          price: scanned.total_price || null,
          stockLevel: "high",
        });
      }
    });
    await onUpdatePantry(updatedPantry);
    setShowScanner(false);
  }

  function addItem() {
    if (!newItem.trim()) return;
    const item = {
      id: crypto.randomUUID(),
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

  function updateItemField(id, field, value) {
    onUpdatePantry(pantryItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  async function handleCleanup() {
    if (checkCredits && !(await checkCredits())) return;
    setCleaning(true);
    try {
      const itemList = pantryItems.map(i => i.name + (i.quantity ? " [" + i.quantity + (i.unit ? " " + i.unit : "") + "]" : "")).join("\n");
      const messages = [{
        role: "user",
        content: "Deduplicate and clean this pantry list. Combine similar items (e.g. Garlic, Garlic cloves, Garlic minced = Garlic). Use short clean names only. When combining items with quantities, sum the quantities if units match. Preserve quantity and unit from the original items. Aisles: " + aisleNames + ", Other.\n\n" + itemList + "\n\nReply ONLY with a JSON array. Each item: name (short clean string), aisle (string), key (con- prefixed slug), quantity (number or null), unit (string or null)."
      }];
      const res = await callClaude(messages, "", 2000, "claude-haiku-4-5-20251001");
      const cleaned = res.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const newItems = parsed.map((i, idx) => {
        // Find all pantry items that match this cleaned name and keep the highest stock level
        const matches = pantryItems.filter(p =>
          p.name.toLowerCase().includes(i.name.toLowerCase()) ||
          i.name.toLowerCase().includes(p.name.toLowerCase())
        );
        const stockLevels = ["high", "medium", "low"];
        const bestStock = matches.length > 0
          ? stockLevels.find(level => matches.some(m => (m.stockLevel || "high") === level)) || "high"
          : "high";
        return {
          id: crypto.randomUUID(),
          name: i.name,
          aisle: i.aisle || "Other",
          addedAt: Date.now(),
          stockLevel: bestStock,
          quantity: i.quantity || null,
          unit: i.unit || null,
        };
      });
      await onUpdatePantry(newItems);
    } catch(e) {
      console.error("Cleanup error:", e);
      alert("Cleanup failed, please try again.");
    }
    setCleaning(false);
  }

  const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "each", "pack", "bunch", "loaf", "tin", "bottle", "bag"];

  function saveEdit() {
    onUpdatePantry(pantryItems.map(i => i.id === editingItem.id ? editingItem : i));
    setEditingItem(null);
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
                  <div key={item.id} className="pantry-item" onClick={() => setEditingItem({ ...item })}>
                    <span className="pantry-item-name">{item.name}</span>
                    <div className="pantry-item-qty">
                      <span className="pantry-item-qty-display">{item.quantity ? item.quantity + " " + (item.unit || "") : "tap to edit"}</span>
                    </div>
                    <span className={"pantry-stock-badge pantry-stock-" + (item.stockLevel || "high")}>{item.stockLevel === "low" ? "🔴" : item.stockLevel === "medium" ? "🟡" : "🟢"}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit Item</h2>
              <span className="modal-close" onClick={() => setEditingItem(null)}>×</span>
            </div>
            <div className="add-recipe-form">
              <label className="add-recipe-label">Name</label>
              <input className="input add-recipe-input" value={editingItem.name} onChange={e => setEditingItem(i => ({ ...i, name: e.target.value }))} />
              <div className="add-recipe-row">
                <div style={{ flex: 1 }}>
                  <label className="add-recipe-label">Quantity</label>
                  <input className="input" type="number" min="0" step="0.1" value={editingItem.quantity || ""} onChange={e => setEditingItem(i => ({ ...i, quantity: parseFloat(e.target.value) || null }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="add-recipe-label">Unit</label>
                  <select className="input" value={editingItem.unit || ""} onChange={e => setEditingItem(i => ({ ...i, unit: e.target.value }))}>
                    <option value="">—</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <label className="add-recipe-label">Aisle</label>
              <select className="input add-recipe-input" value={editingItem.aisle || "Other"} onChange={e => setEditingItem(i => ({ ...i, aisle: e.target.value }))}>
                {DUNNES_AISLES.map(a => <option key={a.name} value={a.name}>{a.icon} {a.name}</option>)}
                <option value="Other">🛒 Other</option>
              </select>
              <label className="add-recipe-label">Stock Level</label>
              <select className="input add-recipe-input" value={editingItem.stockLevel || "high"} onChange={e => setEditingItem(i => ({ ...i, stockLevel: e.target.value }))}>
                <option value="high">🟢 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔴 Low</option>
              </select>
              <button className="btn btn-primary btn-full" onClick={saveEdit}>Save</button>
              <button className="btn btn-danger btn-full" style={{ marginTop: 8 }} onClick={() => { removeItem(editingItem.id); setEditingItem(null); }}>Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <ReceiptScanner
          onConfirm={handleReceiptConfirm}
          onClose={() => setShowScanner(false)}
          checkCredits={checkCredits}
        />
      )}
    </div>
  );
}
