import { useState, useRef } from "react";
import { categoriseIngredient, callClaude } from "../utils";
import CameraCapture from "./CameraCapture";
import { DUNNES_AISLES, API_MODEL } from "../constants";
import { toast } from "../toast";

const COMMON_UNITS = ["each", "g", "kg", "ml", "l", "pack", "6 pack", "dozen", "bunch", "bag", "loaf", "tin", "jar", "box", "bottle"];

function UnitPickerModal({ currentUnit, onSelect, onClose }) {
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h2 className="modal-title">Select Unit</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 0" }}>
          {COMMON_UNITS.map(u => (
            <button
              key={u}
              onClick={() => onSelect(u)}
              className={"btn " + (currentUnit === u ? "btn-gold" : "btn-secondary")}
              style={{ fontSize: 14, padding: "10px 4px" }}
            >
              {u}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            className="btn btn-secondary"
            style={{ fontSize: 14, padding: "10px 4px" }}
          >
            other…
          </button>
        </div>
        {showCustom && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="input"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Type unit…" aria-label="Type unit…"
              autoFocus
              style={{ flex: 1 }}
            />
            <button onClick={() => custom.trim() && onSelect(custom.trim())} className="btn btn-gold">OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

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

export default function ReceiptScanner({ onConfirm, onClose, shoppingItems = [] }) {
  const shoppingContext = shoppingItems.length > 0
    ? "\nThe user was shopping for these items: " + shoppingItems.map(i => i.name).join(", ") + ". Use this as context to help identify ambiguous receipt items."
    : "";
  const [stage, setStage] = useState("upload");
  const [unitPicker, setUnitPicker] = useState(null); // { id, currentUnit }
  const [showCamera, setShowCamera] = useState(false);
  const [items, setItems] = useState([]);

  async function handleCameraCapture({ base64, mediaType }) {
    setShowCamera(false);
    setStage("scanning");
    try {
      const messages = [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: `Extract all food and grocery items from this receipt.
For each item: remove brand names and descriptors, keep the core ingredient name and move the pack size into the unit field.
Examples: "Chicken Breast Fillet 500g" -> name: "Chicken", unit: "500g". "Dunnes Free Range Eggs 6pk" -> name: "Eggs", unit: "6 pack". "Kerrygold Butter 250g" -> name: "Butter", unit: "250g". "BRENNANS 800g" -> name: "Bread", unit: "800g". "ISHKA 6X2L" -> name: "Water", unit: "6x2L".
Return ONLY a JSON array, no markdown, no explanation.
Each item: { "name": string, "price": number, "unit": string, "confident": boolean }
Set confident: false if the item name is an abbreviation, brand name, or unclear.
Set confident: true only if the ingredient is clearly identifiable.
Price should be the total line price as a number.
Exclude: deposits, loyalty points, saver deals, discounts, subtotals, totals, non-food items.` + shoppingContext }
        ]
      }];
      const raw = await callClaude(messages, "", 1500, API_MODEL);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const withMeta = parsed.map((item, i) => {
        const { quantity, unit } = parseUnit(item.unit);
        return { id: i, name: item.name, total_price: item.price, quantity, unit, aisle: categoriseIngredient(item.name), selected: true, confident: item.confident !== false };
      });
      setItems(withMeta);
      setStage("confirm");
    } catch(err) {
      toast.error(err.message || "Could not read receipt");
      setStage("upload");
    }
  }

  async function handleImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      console.warn("No file selected");
      return;
    }
    setStage("scanning");

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
For each item: remove brand names and descriptors, keep the core ingredient name and move the pack size into the unit field.
Examples: "Chicken Breast Fillet 500g" -> name: "Chicken", unit: "500g". "Dunnes Free Range Eggs 6pk" -> name: "Eggs", unit: "6 pack". "Kerrygold Butter 250g" -> name: "Butter", unit: "250g". "BRENNANS 800g" -> name: "Bread", unit: "800g". "ISHKA 6X2L" -> name: "Water", unit: "6x2L".
Return ONLY a JSON array, no markdown, no explanation.
Each item: { "name": string, "price": number, "unit": string, "confident": boolean }
Set confident: false if the item name is an abbreviation, brand name, or unclear (e.g. "KNORR", "DS SFRIED FILLET", "SB DICED", "MAGNUM") — anything you had to guess at.
Set confident: true only if the ingredient is clearly identifiable.
Price should be the total line price as a number.
Exclude: deposits, loyalty points, saver deals, discounts, subtotals, totals, non-food items, bottle return fees.`,
            },
          ],
        },
      ];

      const raw = await callClaude(messages, "", 1500, API_MODEL);
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
      toast.error(err.message || "Could not read receipt");
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
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">🧾 Scan Receipt</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {stage === "upload" && (
          <div className="receipt-upload">
            <div className="receipt-upload-icon">🧾</div>
            <p className="receipt-hint">Upload a photo of your supermarket receipt. Larder will extract the items and prices automatically.</p>
            <div className="receipt-upload-buttons">
              <button onClick={() => setShowCamera(true)} className="receipt-upload-label">
                📷 Take Photo
              </button>
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
                      onFocus={e => e.target.select()}
                    />
                    <button
                      className="receipt-unit-btn"
                      onClick={() => setUnitPicker({ id: item.id, currentUnit: item.unit })}
                    >
                      {item.unit || "unit"} ▾
                    </button>
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
      {unitPicker && (
        <UnitPickerModal
          currentUnit={unitPicker.currentUnit}
          onSelect={unit => { updateItem(unitPicker.id, "unit", unit); setUnitPicker(null); }}
          onClose={() => setUnitPicker(null)}
        />
      )}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
