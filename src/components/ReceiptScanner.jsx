import { useState } from "react";
import { callClaude } from "../utils";
import { categoriseIngredient } from "../utils";
import { HAIKU_MODEL } from "../constants";

export default function ReceiptScanner({ onConfirm, onClose }) {
  const [stage, setStage] = useState("upload"); // upload | scanning | confirm
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStage("scanning");
    setError(null);

    try {
      const base64 = await toBase64(file);
      const mediaType = file.type || "image/jpeg";

      const messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Extract all food and grocery items from this receipt.
Normalise each item name to a short clean ingredient (e.g. "Chicken Breast Fillet 500g" -> "Chicken", "Dunnes Free Range Eggs 6pk" -> "Eggs", "Kerrygold Butter 250g" -> "Butter").
Remove brand names, pack sizes, and descriptors — just the core ingredient.
Return ONLY a JSON array, no markdown, no explanation.
Each item: { "name": string, "price": number, "unit": string }
Unit should be the pack size if visible (e.g. "1kg", "500ml", "6 pack") or "each" if not clear.
Price should be the total line price as a number.
Only include food/drink/grocery items — skip loyalty points, bags, totals, subtotals, discounts, non-food items.`,
            },
          ],
        },
      ];

      const raw = await callClaude(messages, "", 1500, HAIKU_MODEL);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Parse quantity and unit from pack size string e.g. "500g" -> qty=500, unit="g"
      function parseUnit(unitStr) {
        if (!unitStr || unitStr === "each") return { quantity: 1, unit: "each" };
        const match = unitStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
        if (match) return { quantity: parseFloat(match[1]), unit: match[2].toLowerCase() };
        return { quantity: 1, unit: unitStr };
      }

      const withMeta = parsed.map((item, i) => {
        const { quantity, unit } = parseUnit(item.unit);
        return {
          id: i,
          name: item.name,
          total_price: item.price,
          quantity,
          unit,
          aisle: categoriseIngredient(item.name),
          selected: true,
        };
      });

      setItems(withMeta);
      setStage("confirm");
    } catch (err) {
      console.error(err);
      setError("Could not read receipt. Please try a clearer photo.");
      setStage("upload");
    }
  }

  function toggleItem(id) {
    setItems(items => items.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }

  function updateItem(id, field, value) {
    setItems(items => items.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  function handleConfirm() {
    const selected = items.filter(i => i.selected).map(i => ({
      name: i.name,
      total_price: i.total_price,
      quantity: i.quantity,
      unit: i.unit,
      aisle: i.aisle,
    }));
    onConfirm(selected);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">🧾 Scan Receipt</h2>
          <span className="modal-close" onClick={onClose}>×</span>
        </div>

        {stage === "upload" && (
          <div className="receipt-upload">
            <div className="receipt-upload-icon">🧾</div>
            <p className="receipt-hint">Take a photo of your supermarket receipt or upload an image. Larder will extract the items and prices automatically.</p>
            {error && <p className="receipt-error">{error}</p>}
            <label className="receipt-upload-label">
              📷 Choose Photo / Upload
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                style={{ display: "none" }}
              />
            </label>
          </div>
        )}

        {stage === "scanning" && (
          <div className="receipt-scanning">
            <p className="loading-emoji">🧾</p>
            <p className="loading-text">Reading receipt…</p>
          </div>
        )}

        {stage === "confirm" && (
          <div className="receipt-confirm">
            <p className="receipt-hint">Toggle off anything you don't want to add to your pantry or price history.</p>
            <div className="receipt-items">
              {items.map(item => (
                <div key={item.id} className={"receipt-item" + (item.selected ? "" : " receipt-item--off")}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(item.id)}
                    className="receipt-checkbox"
                  />
                  <div className="receipt-item-details">
                    <input
                      className="receipt-item-name"
                      value={item.name}
                      onChange={e => updateItem(item.id, "name", e.target.value)}
                    />
                    <span className="receipt-item-aisle">{item.aisle}</span>
                  </div>
                  <div className="receipt-item-price">
                    <span className="receipt-currency">€</span>
                    <input
                      className="receipt-price-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.total_price}
                      onChange={e => updateItem(item.id, "total_price", parseFloat(e.target.value) || 0)}
                    />
                    <input
                      className="receipt-qty-input"
                      type="number"
                      step="1"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                    />
                    <input
                      className="receipt-unit-input"
                      value={item.unit}
                      onChange={e => updateItem(item.id, "unit", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="receipt-actions">
              <button className="btn btn-outline" onClick={() => setStage("upload")}>← Rescan</button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Add {items.filter(i => i.selected).length} items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
