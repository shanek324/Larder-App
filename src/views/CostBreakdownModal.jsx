import { useState } from "react";
import { toast } from "../toast";

const COMMON_UNITS = ["g", "kg", "ml", "l", "each", "pack", "bunch", "tin", "jar"];

function formatPrice(value) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return "€" + value.toFixed(2);
}

function formatPerUnit(avg, unit) {
  // For very small per-unit values (per gram, per ml) it's friendlier to show per-100 or per-1000.
  if (!unit) return formatPrice(avg);
  if (unit === "g" || unit === "ml") {
    return "€" + (avg * 100).toFixed(2) + "/100" + unit;
  }
  if (unit === "kg" || unit === "l") {
    return "€" + avg.toFixed(2) + "/" + unit;
  }
  // each, pack, bunch, etc.
  return "€" + avg.toFixed(2) + "/" + unit;
}

function CostRow({ row, onAddPrice, ratio }) {
  const [adding, setAdding] = useState(false);
  const [totalPrice, setTotalPrice] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("g");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const tp = parseFloat(totalPrice);
    const q = parseFloat(qty);
    if (!tp || tp <= 0) { toast.error("Enter a valid price"); return; }
    if (!q || q <= 0) { toast.error("Enter a valid quantity"); return; }
    setSaving(true);
    try {
      await onAddPrice({
        ingredient_name: row.name,
        total_price: tp,
        quantity: q,
        unit,
      });
      toast.success("Price saved");
      setAdding(false);
      setTotalPrice("");
      setQty("");
    } catch (e) {
      toast.error(e.message || "Couldn\'t save price");
    }
    setSaving(false);
  }

  const scaledEstimate = row.estimate !== null ? row.estimate * ratio : null;

  return (
    <div className="cost-row">
      <div className="cost-row-head">
        <span className="cost-row-name">{row.name}</span>
        <span className="cost-row-amount">{row.amount || ""}</span>
      </div>

      {row.estimate !== null ? (
        <div className="cost-row-body">
          <p className="cost-row-math">
            {row.qty} × {formatPerUnit(row.avgPricePerUnit, row.unit)} avg = <strong>{formatPrice(scaledEstimate)}</strong>
          </p>
          <p className="cost-row-source">Based on {row.sourceCount} past purchase{row.sourceCount === 1 ? "" : "s"}</p>
        </div>
      ) : (
        <div className="cost-row-body">
          {!adding ? (
            <div className="cost-row-empty">
              <span className="cost-row-noprice">No price data yet</span>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="btn btn-gold"
                style={{ fontSize: 12, padding: "4px 10px" }}
              >+ Add price</button>
            </div>
          ) : (
            <div className="cost-row-form">
              <div className="cost-row-form-fields">
                <label className="cost-row-form-field">
                  <span className="cost-row-form-label">Total €</span>
                  <input
                    type="number"
                    step="0.01"
                    value={totalPrice}
                    onChange={e => setTotalPrice(e.target.value)}
                    placeholder="0.00"
                    aria-label="Total price"
                    className="input"
                    autoFocus
                  />
                </label>
                <label className="cost-row-form-field">
                  <span className="cost-row-form-label">Qty</span>
                  <input
                    type="number"
                    step="0.01"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    placeholder="0"
                    aria-label="Quantity"
                    className="input"
                  />
                </label>
                <label className="cost-row-form-field">
                  <span className="cost-row-form-label">Unit</span>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    aria-label="Unit"
                    className="input"
                  >
                    {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </label>
              </div>
              <div className="cost-row-form-actions">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ fontSize: 13 }}
                >{saving ? "Saving…" : "Save"}</button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setTotalPrice(""); setQty(""); }}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CostBreakdownModal({ breakdown, total, ratio = 1, recipeTitle, onClose, onAddPrice }) {
  const priced = breakdown.filter(b => b.estimate !== null).length;
  const totalScaled = total * ratio;

  return (
    <div className="modal-overlay">
      <div
        className="modal cost-breakdown-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Cost breakdown"
        style={{ maxWidth: 540, maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Cost breakdown</h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >×</button>
        </div>

        <p className="cost-breakdown-subtitle">{recipeTitle}</p>

        <div className="cost-breakdown-list">
          {breakdown.map((row, i) => (
            <CostRow key={i} row={row} onAddPrice={onAddPrice} ratio={ratio} />
          ))}
        </div>

        <div className="cost-breakdown-footer">
          <p className="cost-breakdown-total">
            Total estimate: <strong>{formatPrice(totalScaled)}</strong>
          </p>
          <p className="cost-breakdown-meta">
            Based on {priced} of {breakdown.length} ingredient{breakdown.length === 1 ? "" : "s"} priced.
            {priced < breakdown.length && " Add prices for more accuracy."}
          </p>
        </div>
      </div>
    </div>
  );
}
