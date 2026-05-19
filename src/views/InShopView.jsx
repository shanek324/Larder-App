import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { supabase } from "../supabase";
import { DUNNES_AISLES } from "../constants";
import { categoriseIngredient } from "../utils";
import { toast } from "../toast";
const ReceiptScanner = lazy(() => import("../components/ReceiptScanner"));

export default function InShopView({ savedList, pantryItems, onClearList, onUpdatePantry, onSavePrices, onSaveTicked, onUpdateItems }) {
  const [checked, setChecked] = useState(savedList?.ticked || {});
  const debounceRef = useRef(null);
  const pendingCheckedRef = useRef(savedList?.ticked || {});
  const hasPendingRef = useRef(false);

  useEffect(() => {
    setChecked(savedList?.ticked || {});
    pendingCheckedRef.current = savedList?.ticked || {};
    hasPendingRef.current = false;
  }, [savedList?.id]);

  const debouncedSave = useCallback((newChecked) => {
    pendingCheckedRef.current = newChecked;
    hasPendingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSaveTicked(pendingCheckedRef.current);
      hasPendingRef.current = false;
    }, 2000);
  }, [onSaveTicked]);

  // Flush pending ticks immediately when the app goes to background, the page
  // is about to unload, or this view unmounts. Protects against the user
  // switching apps mid-shop and losing 2s of unticked progress.
  useEffect(() => {
    function flush() {
      if (!hasPendingRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onSaveTicked(pendingCheckedRef.current);
      hasPendingRef.current = false;
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush); // iOS Safari fires this, not always beforeunload
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush(); // also flush on unmount
    };
  }, [onSaveTicked]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStartOver, setShowStartOver] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [manualItem, setManualItem] = useState("");
  const [persistedScanItems, setPersistedScanItems] = useState(savedList?.scanned_items || []);

  async function handleScanComplete(scannedItems) {
    setPersistedScanItems(scannedItems);
    if (savedList) {
      await supabase.from("shopping_list").update({ scanned_items: scannedItems }).eq("id", savedList.id);
    }
    await handleReceiptConfirm(scannedItems);
  }

  const items = savedList?.items || [];
  const tickedCount = items.filter(i => checked[i.key]).length;
  const allChecked = items.length > 0 && tickedCount === items.length;

  async function addManualItem() {
    if (!manualItem.trim()) return;
    const name = manualItem.trim();
    const key = "manual-" + name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newItem = { key, name, amounts: [], aisle: categoriseIngredient(name) };
    await onUpdateItems([...items, newItem]);
    setManualItem("");
    setShowAddItem(false);
  }

  function toggleItem(key) {
    setChecked(c => {
      const newChecked = { ...c, [key]: !c[key] };
      debouncedSave(newChecked);
      return newChecked;
    });
  }

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
      const norm = (s) => (s || "").trim().toLowerCase();
      const existingIdx = updatedPantry.findIndex(p => norm(p.name) === norm(scanned.name));
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

    // Auto-tick shopping-list items that match what we just scanned.
    // The user is free to untick/edit before finishing.
    const norm = (s) => (s || "").trim().toLowerCase();
    const scannedNorms = scannedItems.map(s => norm(s.name));
    let autoTicked = 0;
    setChecked(prev => {
      const next = { ...prev };
      items.forEach(item => {
        if (next[item.key]) return; // already ticked
        const itemNorm = norm(item.name);
        const match = scannedNorms.some(sn => sn.includes(itemNorm) || itemNorm.includes(sn));
        if (match) { next[item.key] = true; autoTicked++; }
      });
      debouncedSave(next);
      return next;
    });

    setShowScanner(false);
    if (autoTicked > 0) {
      toast.success(`Receipt scanned. ${autoTicked} item${autoTicked === 1 ? "" : "s"} auto-ticked.`);
    } else {
      toast.success("Receipt added to your pantry.");
    }
  }

  async function handleFinished(currentPantry = pantryItems) {
    const boughtItems = items.filter(i => checked[i.key]);
    const updatedPantry = [...currentPantry];
    boughtItems.forEach(bought => {
      const normF = (s) => (s || "").trim().toLowerCase();
      const existingIdx = updatedPantry.findIndex(p => normF(p.name) === normF(bought.name));
      if (existingIdx >= 0) {
        updatedPantry[existingIdx] = { ...updatedPantry[existingIdx], stockLevel: "high" };
      } else {
        updatedPantry.push({
          id: crypto.randomUUID(),
          name: bought.name,
          aisle: bought.aisle,
          addedAt: Date.now(),
          stockLevel: "high",
        });
      }
    });
    await onUpdatePantry(updatedPantry);
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
        <button onClick={() => setShowScanner(true)} className="btn btn-gold" style={{ fontSize: 12 }}>
          🧾 Scan
        </button>
        {tickedCount > 0 && (
          <button onClick={() => setShowConfirm(true)} className="btn btn-primary btn-lg">
            {allChecked ? "Finished Shopping ✓" : `Finish (${tickedCount} of ${items.length})`}
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

      <button
        onClick={() => setShowAddItem(true)}
        className="shopping-fab"
        aria-label="Add item"
      >+</button>

      {showAddItem && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Add item</h2>
              <button type="button" className="modal-close" onClick={() => setShowAddItem(false)} aria-label="Close">×</button>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "8px 0" }}>
              <input
                value={manualItem}
                onChange={e => setManualItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addManualItem()}
                placeholder="e.g. Milk, Bread…" aria-label="e.g. Milk, Bread…"
                className="input"
                style={{ flex: 1 }}
                autoFocus
              />
              <button onClick={addManualItem} className="btn btn-gold">Add</button>
            </div>
          </div>
        </div>
      )}

      {showStartOver && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400, textAlign: "center" }}>
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
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🛒</p>
            <h2 className="section-title" style={{ textAlign: "center" }}>All done?</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", marginBottom: 24 }}>
              {allChecked
                ? "This will add your bought items to the pantry and clear your shopping list."
                : `You've ticked ${tickedCount} of ${items.length} items. The ${items.length - tickedCount} unticked items will be discarded — only ticked items will be added to your pantry.`}
            </p>
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <button onClick={handleFinished} className="btn btn-primary btn-lg">Yes, finish up</button>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary btn-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showScanner && (
        <Suspense fallback={<div className="modal-overlay"><div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 360, textAlign: "center" }}><p className="loading-emoji">🧾</p><p className="loading-text">Loading scanner…</p></div></div>}>
        <ReceiptScanner
          onConfirm={handleScanComplete}
          onClose={() => setShowScanner(false)}
         
          shoppingItems={items}
        />
        </Suspense>
      )}
    </div>
  );
}
