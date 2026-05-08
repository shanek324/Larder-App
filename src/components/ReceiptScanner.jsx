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

      const withMeta = parsed.map((item, i) => ({
        id: i,
        name: item.name,
        price: item.price,
        unit: item.unit || "each",
        aisle: categoriseIngredient(item.name),
        selected: true,
      }));

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
    const selected = items.filter(i => i.selected);
    onConfirm(selected);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">🧾 Scan Receipt</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {stage === "upload" && (
          <div className="receipt-upload">
            {error && <p className="receipt-error">{error}</p>}
            <p className="receipt-hint">Take a photo of your supermarket receipt or upload an image.</p>
            <label className="receipt-upload-label">
              <span>📷 Choose Photo</span>
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
                      value={item.price}
                      onChange={e => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
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
