import { useState } from "react";
import { categoriseIngredient } from "../utils";
import { DUNNES_AISLES } from "../constants";
import { API_MODEL } from "../constants";

function parseUnit(unitStr) {
  if (!unitStr || unitStr === "each") return { quantity: 1, unit: "each" };
  const match = unitStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (match) return { quantity: parseFloat(match[1]), unit: match[2].toLowerCase() };
  return { quantity: 1, unit: unitStr };
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReceiptScanner({ onConfirm, onClose }) {
  const [stage, setStage] = useState("upload");
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function handleImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      console.warn("No file selected");
      return;
    }
    setStage("scanning");
    setError(null);

    try {
      const base64 = await toBase64(file);
      const mediaType = file.type || "image/jpeg";

      const body = {
        model: API_MODEL,
        max_tokens: 1500,
        messages: [
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
Normalise each item name to a short clean ingredient (e.g. "Chicken Breast Fillet 500g" -> "Chicken", "Dunnes Free Range Eggs 6pk" -> "Eggs", "Kerrygold Butter 250g" -> "Butter", "BRENNANS" -> "Bread", "ISHKA 6X2L" -> "Water").
Remove brand names, pack sizes, and descriptors — just the core ingredient.
Return ONLY a JSON array, no markdown, no explanation.
Each item: { "name": string, "price": number, "unit": string, "confident": boolean }
Set confident: false if the item name is an abbreviation, brand name, or unclear (e.g. "KNORR", "DS SFRIED FILLET", "SB DICED", "MAGNUM") — anything you had to guess at.
Set confident: true only if the ingredient is clearly identifiable.
Unit should be the pack size if visible (e.g. "1kg", "500ml", "6 pack") or "each" if not clear.
Price should be the total line price as a number.
Exclude: deposits, loyalty points, saver deals, discounts, subtotals, totals, non-food items, bottle return fees.`,
              },
            ],
          },
        ],
      };

      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error("API error: " + errText);
      }

      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const clean = raw.replace(/```json|```/g, "").trim();

      if (!clean) throw new Error("Empty response from Claude");

      const parsed = JSON.parse(clean);

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
          confident: item.confident !== false,
        };
      });

      setItems(withMeta);
      setStage("confirm");
    } catch (err) {
      console.error("Receipt scan error:", err);
      setError("Could not read receipt: " + err.message);
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
            <p className="receipt-hint">Upload a photo of your supermarket receipt. Larder will extract the items and prices automatically.</p>
            {error && <p className="receipt-error">{error}</p>}
            <div className="receipt-upload-buttons">
              <label className="receipt-upload-label">
                📷 Take Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />
              </label>
              <label className="receipt-upload-label receipt-upload-label--secondary">
                🗂 Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />
              </label>
            </div>
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
                      className={"receipt-item-name" + (!item.confident ? " receipt-item-name--uncertain" : "")}
                      value={item.name}
                      onChange={e => updateItem(item.id, "name", e.target.value)}
                    />
                    <span className="receipt-item-aisle">
                      {!item.confident && <span className="receipt-uncertain-badge">⚠ check</span>}
                      <select
                        value={item.aisle}
                        onChange={e => updateItem(item.id, "aisle", e.target.value)}
                        className="receipt-aisle-select"
                      >
                        {DUNNES_AISLES.map(a => (
                          <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
                        ))}
                        <option value="Other">🛒 Other</option>
                      </select>
                    </span>
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
