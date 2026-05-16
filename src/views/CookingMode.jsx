import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { supabase } from "../supabase";
import { callClaude } from "../utils";

export default function CookingMode({ recipe, pantryItems, onExit, onUpdateRecipe, onUpdatePantry, session, checkCredits }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepNotes, setStepNotes] = useState(recipe.step_notes || {});
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [phase, setPhase] = useState("cooking");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [generatingTips, setGeneratingTips] = useState(false);
  const [tips, setTips] = useState(null);
  const [removedPantryIds, setRemovedPantryIds] = useState([]);
  const [pantryUpdates, setPantryUpdates] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAddMore, setShowAddMore] = useState(false);
  const [cookLogs, setCookLogs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [stepFontSize, setStepFontSize] = useState(22);
  const stepTextRef = useRef(null);
  const [recipeNotes, setRecipeNotes] = useState(recipe.notes || "");

  const ingredients = recipe.ingredients || [];
  const lastTips = cookLogs.length > 0 ? cookLogs[0].ai_tips : null;
  const steps = ["__ingredients__", ...(lastTips ? ["__tips__"] : []), ...(recipe.method || [])];
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isIngredientCard = currentStep === 0;
  const isTipsCard = steps[currentStep] === "__tips__";
  // Key notes by method step index so they don't shift when tips card is present/absent
  const noteKey = isIngredientCard || isTipsCard ? null : currentStep - (lastTips ? 2 : 1);

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from("cook_logs")
        .select("*")
        .eq("recipe_id", recipe.id)
        .order("cooked_at", { ascending: false })
        .limit(5);
      if (data) setCookLogs(data);
    }
    loadLogs();
  }, [recipe.id]);

  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  }

  function handleTouchEnd(e) {
    if (touchStartX === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    // Ignore if swipe is more vertical than horizontal
    if (Math.abs(diffX) < 50 || Math.abs(diffX) < Math.abs(diffY)) return;
    if (diffX > 0) goNext();
    else goPrev();
    setTouchStartX(null);
    setTouchStartY(null);
  }

  useLayoutEffect(() => {
    const el = stepTextRef.current;
    if (!el) return;
    el.style.fontSize = "22px";
    let size = 22;
    while (el.scrollHeight > el.clientHeight && size > 12) {
      size -= 1;
      el.style.fontSize = size + "px";
    }
    setStepFontSize(size);
  }, [currentStep]);

  // Trigger AI pantry suggestions when entering pantry phase
  useEffect(() => {
    if (phase === "pantry" && pantryUpdates === null && !loadingSuggestions) {
      generatePantrySuggestions();
    }
  }, [phase]);

  function goNext() {
    if (isLastStep) setPhase("review");
    else setCurrentStep(s => s + 1);
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }

  function saveNote() {
    const updated = { ...stepNotes, [noteKey]: noteText };
    setStepNotes(updated);
    onUpdateRecipe({ ...recipe, step_notes: updated });
    setShowNoteInput(false);
    setNoteText("");
  }

  function openNote() {
    setNoteText(stepNotes[noteKey] || "");
    setShowNoteInput(true);
  }

  async function handleFinishReview() {
    if (checkCredits && !(await checkCredits())) { setPhase("pantry"); return; }
    setGeneratingTips(true);
    try {
      const messages = [{
        role: "user",
        content: "A cook just made: " + recipe.title + ". They rated it " + rating + "/5 and said: \"" + feedback + "\". Give 2-3 specific, practical cooking tips for next time based on their feedback. Be concise and actionable. Format as plain text, no bullet points."
      }];
      const aiTips = await callClaude(messages, "", 500, "claude-haiku-4-5-20251001");
      setTips(aiTips);
      await supabase.from("cook_logs").insert({
        user_id: session?.user?.id,
        recipe_id: recipe.id,
        cooked_at: Date.now(),
        rating,
        feedback,
        ai_tips: aiTips,
      });
      const newCount = (recipe.cook_count || 0) + 1;
      await onUpdateRecipe({ ...recipe, cook_count: newCount, lastCooked: Date.now(), notes: recipeNotes });
    } catch(e) {
      console.error("Review error:", e);
    }
    setGeneratingTips(false);
    setPhase("pantry");
  }

  function togglePantryRemove(id) {
    setRemovedPantryIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  async function generatePantrySuggestions() {
    if (checkCredits && !(await checkCredits())) { setLoadingSuggestions(false); return; }
    setLoadingSuggestions(true);
    try {
      const ingredientList = recipe.ingredients.map(i => i.amount + " " + i.name).join(", ");
      const pantryList = pantryItems.map(i => i.name + (i.quantity ? " (" + i.quantity + " " + (i.unit || "") + ")" : "")).join(", ");
      const messages = [{
        role: "user",
        content: "I just cooked " + recipe.title + " for " + recipe.servings + " servings. Ingredients used: " + ingredientList + ". My pantry contains: " + pantryList + ". Which pantry items were likely used and how much? Reply ONLY with a JSON array. Each item: { pantryName (string matching pantry item name exactly), usedAmount (number or null), usedUnit (string or null), fullyUsed (boolean) }"
      }];
      const res = await callClaude(messages, "", 1000, "claude-haiku-4-5-20251001");
      const clean = res.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      // Match to actual pantry items
      const matched = parsed.map(s => {
        const pantryItem = pantryItems.find(p => p.name.toLowerCase() === s.pantryName.toLowerCase());
        if (!pantryItem) return null;
        return { ...pantryItem, usedAmount: s.usedAmount, usedUnit: s.usedUnit, fullyUsed: s.fullyUsed, included: true };
      }).filter(Boolean);
      setPantryUpdates(matched);
    } catch(e) {
      console.error("Pantry suggestion error:", e);
      setPantryUpdates([]);
    }
    setLoadingSuggestions(false);
  }

  async function handleFinishPantry() {
    if (pantryUpdates && pantryUpdates.length > 0) {
      const updatedPantry = pantryItems.map(item => {
        const update = pantryUpdates.find(u => u.id === item.id && u.included);
        if (!update) return item;
        // Only fully remove if explicitly marked as fully used
        if (update.fullyUsed) return null;
        // Subtract quantity if both have quantities
        if (update.usedAmount && item.quantity) {
          const remaining = item.quantity - update.usedAmount;
          if (remaining <= 0) return null;
          return { ...item, quantity: Math.round(remaining * 100) / 100 };
        }
        // No quantity tracking — leave item in pantry unchanged
        return item;
      }).filter(Boolean);
      await onUpdatePantry(updatedPantry);
    } else if (removedPantryIds.length > 0) {
      await onUpdatePantry(pantryItems.filter(i => !removedPantryIds.includes(i.id)));
    }
    onExit();
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  }

  // COOKING PHASE
  if (phase === "cooking") {
    const step = steps[currentStep];
    const note = noteKey !== null ? stepNotes[noteKey] : null;

    return (
      <div className="cooking-screen">
        <div className="cooking-header">
          <button onClick={onExit} className="cooking-exit-btn">← Exit</button>
          <span className="cooking-progress-label">
            {isIngredientCard ? "Ingredients" : isTipsCard ? "Tips" : "Step " + (currentStep - (lastTips ? 1 : 0)) + " of " + (recipe.method || []).length}
          </span>
          {!isIngredientCard && !isTipsCard ? (
            <button onClick={openNote} className="cooking-note-btn">
              {note ? "✎ Edit note" : "+ Note"}
            </button>
          ) : <div style={{ width: 80 }} />}
        </div>

        <div className="cooking-recipe-title">{recipe.title}</div>

        <div className="cooking-card-wrapper" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="cooking-card">
            {isIngredientCard ? (
              <>
                <p className="cooking-card-ingredients-title">Ingredients</p>
                <div className="cooking-ingredients-list">
                  {ingredients.map((ing, i) => (
                    <div key={i} className="cooking-ingredient-row">
                      <span className="cooking-ingredient-name">{ing.name}</span>
                      <span className="cooking-ingredient-amount">{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : isTipsCard ? (
              <>
                <p className="cooking-card-ingredients-title">💡 Tips from last time</p>
                <p className="cooking-step-text" style={{ fontSize: 16, opacity: 0.85 }}>{lastTips}</p>
              </>
            ) : (
              <>
                <div className="cooking-step-num">{currentStep - (lastTips ? 1 : 0)}</div>
                <p className="cooking-step-text" ref={stepTextRef} style={{ fontSize: stepFontSize }}>{step}</p>
              </>
            )}

            {note && (
              <div className="cooking-note">
                <p className="cooking-note-label">Your note</p>
                <p className="cooking-note-text">{note}</p>
              </div>
            )}
          </div>
        </div>

        {!isIngredientCard && (
          <button onClick={() => setCurrentStep(0)} className="cooking-ingredients-fab">🥘</button>
        )}

        <div className="cooking-dots">
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentStep(i)}
              className={"cooking-dot" + (i === currentStep ? " active" : i < currentStep ? " past" : "")}
            />
          ))}
        </div>

        <div className="cooking-nav">
          {currentStep > 0 && (
            <button onClick={goPrev} className="cooking-nav-back">← Back</button>
          )}
          <button onClick={goNext} className="cooking-nav-next">
            {isLastStep ? "Finished Cooking 🍽" : "Next Step →"}
          </button>
        </div>

        {showNoteInput && (
          <div className="cooking-note-overlay">
            <div className="cooking-note-sheet">
              <h3 className="cooking-note-sheet-title">Note for step {currentStep}</h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="e.g. Added extra garlic, kept sauce on longer..."
                autoFocus
                rows={3}
                className="input cooking-note-textarea"
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveNote} className="btn btn-primary" style={{ flex: 1 }}>Save Note</button>
                <button onClick={() => setShowNoteInput(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // REVIEW PHASE
  if (phase === "review") {
    return (
      <div className="cooking-screen cooking-screen-centered">
        <div className="cooking-review-card">
          <button onClick={onExit} className="cooking-exit-btn" style={{ alignSelf: "flex-start", marginBottom: 8 }}>← Back</button>
          <p className="cooking-review-emoji">🍽</p>
          <h2 className="cooking-review-title">How did it go?</h2>
          <p className="cooking-review-subtitle">{recipe.title}</p>

          {cookLogs.length > 0 && (
            <div className="cook-log-history">
              <button
                className="cook-log-history-toggle"
                onClick={() => setShowHistory(h => !h)}
              >
                <span>📋 Previous cook notes ({cookLogs.length})</span>
                <span>{showHistory ? "▲" : "▼"}</span>
              </button>
              {showHistory && (
                <div className="cook-log-entries">
                  {cookLogs.map((log, i) => (
                    <div key={i} className="cook-log-entry">
                      <div className="cook-log-entry-meta">
                        <span className="cook-log-entry-date">{formatDate(log.cooked_at)}</span>
                        <span className="cook-log-entry-rating">{"⭐".repeat(log.rating)}</span>
                      </div>
                      {log.feedback && (
                        <p className="cook-log-entry-feedback">"{log.feedback}"</p>
                      )}
                      {log.ai_tips && (
                        <p className="cook-log-entry-tips">{log.ai_tips}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="cooking-review-label">Rating</p>
          <div className="cooking-stars">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)} className={"cooking-star" + (rating >= n ? " active" : "")}>⭐</button>
            ))}
          </div>

          <p className="cooking-review-label">Any feedback?</p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="e.g. Needed more seasoning, sauce was too thick..."
            rows={3}
            className="input cooking-feedback-input"
          />

          <p className="cooking-review-label" style={{ marginTop: 16 }}>Recipe notes</p>
          <textarea
            value={recipeNotes}
            onChange={e => setRecipeNotes(e.target.value)}
            placeholder="e.g. Add more garlic next time, serve with crusty bread..."
            rows={3}
            className="input cooking-feedback-input"
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleFinishReview} disabled={rating === 0 || generatingTips} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
              {generatingTips ? "Generating tips..." : "Done →"}
            </button>
            <button onClick={handleFinishPantry} className="btn btn-secondary btn-lg">Skip</button>
          </div>
        </div>
      </div>
    );
  }

  // PANTRY PHASE
  return (
    <div className="cooking-screen cooking-screen-centered">
      <div className="cooking-review-card">
        {tips && (
          <div className="card-note cooking-tips">
            <p className="label-uppercase" style={{ marginBottom: 6 }}>Tips for next time</p>
            <p className="cooking-tips-text">{tips}</p>
          </div>
        )}

        <h2 className="cooking-review-title" style={{ textAlign: "left", fontSize: 22 }}>Update Pantry?</h2>
        <p className="cooking-review-subtitle" style={{ textAlign: "left", marginBottom: 20 }}>
          {loadingSuggestions ? "Figuring out what you used…" : "Edit amounts used and confirm"}
        </p>

        {loadingSuggestions ? (
          <p style={{ textAlign: "center", padding: 24, opacity: 0.5 }}>✦ Analysing recipe…</p>
        ) : pantryUpdates && pantryUpdates.length > 0 ? (
          <div className="cooking-pantry-list">
            {pantryUpdates.map((item, i) => (
              <div key={item.id} className={"cooking-pantry-item" + (!item.included ? " removed" : "")}>
                <input type="checkbox" checked={item.included} onChange={() => setPantryUpdates(u => u.map((x, idx) => idx === i ? { ...x, included: !x.included } : x))} style={{ accentColor: "var(--color-gold)", width: 16, height: 16 }} />
                <span className="cooking-pantry-item-name">{item.name}</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: "auto" }}>
                  {item.fullyUsed ? (
                    <span style={{ fontSize: 12, color: "var(--color-danger)", fontFamily: "var(--font-sans)" }}>fully used</span>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={item.usedAmount || ""}
                        onChange={e => setPantryUpdates(u => u.map((x, idx) => idx === i ? { ...x, usedAmount: parseFloat(e.target.value) || null } : x))}
                        className="receipt-price-input"
                        placeholder="amt"
                        style={{ width: 60 }}
                      />
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>{item.usedUnit || item.unit || ""}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", padding: 16, opacity: 0.5, fontFamily: "var(--font-sans)", fontSize: 14 }}>No pantry items matched this recipe</p>
        )}

        {!loadingSuggestions && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowAddMore(v => !v)} className="btn btn-secondary btn-full">
              {showAddMore ? "▲ Hide" : "+ Add other items used"}
            </button>
            {showAddMore && (
              <div className="cooking-pantry-list" style={{ marginTop: 8 }}>
                {pantryItems
                  .filter(p => !pantryUpdates?.find(u => u.id === p.id))
                  .map(item => (
                    <div key={item.id} className="cooking-pantry-item">
                      <input
                        type="checkbox"
                        onChange={e => {
                          if (e.target.checked) {
                            setPantryUpdates(u => [...(u || []), { ...item, included: true, fullyUsed: false, usedAmount: null, usedUnit: item.unit || null }]);
                          }
                        }}
                        style={{ accentColor: "var(--color-gold)", width: 16, height: 16 }}
                      />
                      <span className="cooking-pantry-item-name">{item.name}</span>
                      {item.quantity && <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", marginLeft: "auto" }}>{item.quantity} {item.unit || ""}</span>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        <button onClick={handleFinishPantry} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 16 }}>
          Update & Finish
        </button>
        <button onClick={onExit} className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>
          Skip
        </button>
      </div>
    </div>
  );
}
