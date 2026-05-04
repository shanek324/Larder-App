import { useState } from "react";
import { supabase } from "../supabase";
import { callClaude } from "../utils";

export default function CookingMode({ recipe, pantryItems, onExit, onUpdateRecipe, onUpdatePantry, session }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepNotes, setStepNotes] = useState(recipe.step_notes || {});
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [phase, setPhase] = useState("cooking"); // cooking | review | pantry
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [generatingTips, setGeneratingTips] = useState(false);
  const [tips, setTips] = useState(null);
  const [removedPantryIds, setRemovedPantryIds] = useState([]);

  const ingredients = recipe.ingredients || [];
  const steps = ["__ingredients__", ...(recipe.method || [])];
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isIngredientCard = currentStep === 0;

  function goNext() {
    if (isLastStep) {
      setPhase("review");
    } else {
      setCurrentStep(s => s + 1);
    }
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }

  function saveNote() {
    const updated = { ...stepNotes, [currentStep]: noteText };
    setStepNotes(updated);
    onUpdateRecipe({ ...recipe, step_notes: updated });
    setShowNoteInput(false);
    setNoteText("");
  }

  function openNote() {
    setNoteText(stepNotes[currentStep] || "");
    setShowNoteInput(true);
  }

  async function handleFinishReview() {
    setGeneratingTips(true);
    try {
      const messages = [{
        role: "user",
        content: "A cook just made: " + recipe.title + ". They rated it " + rating + "/5 and said: \"" + feedback + "\". Give 2-3 specific, practical cooking tips for next time based on their feedback. Be concise and actionable. Format as plain text, no bullet points."
      }];
      const aiTips = await callClaude(messages, "", 500, "claude-haiku-4-5-20251001");
      setTips(aiTips);

      // Save cook log
      await supabase.from("cook_logs").insert({
        user_id: session?.user?.id,
        recipe_id: recipe.id,
        cooked_at: Date.now(),
        rating,
        feedback,
        ai_tips: aiTips,
      });

      // Update recipe cook count and last cooked
      const newCount = (recipe.cook_count || 0) + 1;
      await onUpdateRecipe({ ...recipe, cook_count: newCount, lastCooked: Date.now() });

    } catch(e) {
      console.error("Review error:", e);
    }
    setGeneratingTips(false);
    setPhase("pantry");
  }

  function togglePantryRemove(id) {
    setRemovedPantryIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  async function handleFinishPantry() {
    if (removedPantryIds.length > 0) {
      await onUpdatePantry(pantryItems.filter(i => !removedPantryIds.includes(i.id)));
    }
    onExit();
  }

  // COOKING PHASE
  if (phase === "cooking") {
    const step = steps[currentStep];
    const note = stepNotes[currentStep];

    return (
      <div style={{ position: "fixed", inset: 0, background: "#1a0f0a", zIndex: 300, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={onExit} style={{ background: "none", border: "none", color: "#c8a96e", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer" }}>← Exit</button>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e8a73" }}>{isIngredientCard ? "Ingredients" : "Step " + currentStep + " of " + (totalSteps - 1)}</span>
          {!isIngredientCard && <button onClick={openNote} style={{ background: "none", border: "1px solid #c8a96e", color: "#c8a96e", borderRadius: 8, padding: "6px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer" }}>
            {note ? "✎ Edit note" : "+ Note"}
          </button>}
        </div>

        {/* Recipe title */}
        <div style={{ padding: "12px 20px 0", textAlign: "center" }}>
          <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#c8a96e" }}>{recipe.title}</p>
        </div>

        {/* Step card */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div style={{
            background: "#fffdf8",
            borderRadius: 24,
            padding: "40px 36px",
            maxWidth: 600,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            {isIngredientCard ? (
              <>
                <p style={{ margin: "0 0 16px", fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2c1810", fontWeight: 700 }}>Ingredients</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ingredients.map((ing, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e8e0d5" }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#2c1810" }}>{ing.name}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#c8a96e" }}>{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 36, height: 36, background: "#c8a96e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 20 }}>
                  {currentStep}
                </div>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 20, color: "#2c1810", lineHeight: 1.7 }}>{step}</p>
              </>
            )}

            {note && (
              <div style={{ marginTop: 20, background: "#fdf6e8", border: "1px solid #e8d5a0", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Your note</p>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#5c4a2a", lineHeight: 1.5 }}>{note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating ingredients button */}
        {!isIngredientCard && (
          <button onClick={() => setCurrentStep(0)} style={{ position: "fixed", bottom: 100, right: 20, background: "#c8a96e", color: "#2c1810", border: "none", borderRadius: 50, width: 48, height: 48, fontSize: 20, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 10 }}>🥘</button>
        )}

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "8px 20px" }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setCurrentStep(i)} style={{ width: i === currentStep ? 20 : 8, height: 8, borderRadius: 4, background: i === currentStep ? "#c8a96e" : i < currentStep ? "#5c4a2a" : "#3a2e22", cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12, padding: "16px 20px 32px" }}>
          {currentStep > 0 && (
            <button onClick={goPrev} style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "#f5e6c8", border: "none", borderRadius: 14, padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 16, cursor: "pointer", fontWeight: 600 }}>← Back</button>
          )}
          <button onClick={goNext} style={{ flex: 2, background: "#c8a96e", color: "#2c1810", border: "none", borderRadius: 14, padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>
            {isLastStep ? "Finished Cooking 🍽" : "Next Step →"}
          </button>
        </div>

        {/* Note input modal */}
        {showNoteInput && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 400 }}>
            <div style={{ background: "#fffdf8", borderRadius: "20px 20px 0 0", padding: 24, width: "100%" }}>
              <h3 style={{ margin: "0 0 12px", fontFamily: "'Playfair Display', serif", color: "#2c1810" }}>Note for step {currentStep + 1}</h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="e.g. Added extra garlic, kept sauce on longer..."
                autoFocus
                rows={3}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd5c8", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "none", boxSizing: "border-box", marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveNote} style={{ flex: 1, background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Save Note</button>
                <button onClick={() => setShowNoteInput(false)} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
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
      <div style={{ position: "fixed", inset: 0, background: "#1a0f0a", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fffdf8", borderRadius: 24, padding: 36, maxWidth: 500, width: "100%" }}>
          <p style={{ fontSize: 48, textAlign: "center", marginBottom: 8 }}>🍽</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2c1810", textAlign: "center", margin: "0 0 6px" }}>How did it go?</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9e8a73", textAlign: "center", marginBottom: 24 }}>{recipe.title}</p>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#5c4a2a", marginBottom: 10 }}>Rating</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)} style={{ flex: 1, fontSize: 28, background: rating >= n ? "#fdf6e8" : "#f0ebe3", border: rating >= n ? "2px solid #c8a96e" : "2px solid transparent", borderRadius: 10, padding: "10px 0", cursor: "pointer" }}>⭐</button>
            ))}
          </div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#5c4a2a", marginBottom: 8 }}>Any feedback?</p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="e.g. Needed more seasoning, sauce was too thick..."
            rows={3}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd5c8", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "none", boxSizing: "border-box", marginBottom: 20 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleFinishReview} disabled={rating === 0 || generatingTips} style={{ flex: 1, background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15 }}>
              {generatingTips ? "Generating tips..." : "Done →"}
            </button>
            <button onClick={handleFinishPantry} style={{ background: "#f0ebe3", color: "#5c4a2a", border: "none", borderRadius: 10, padding: "14px 16px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  // PANTRY PHASE
  return (
    <div style={{ position: "fixed", inset: 0, background: "#1a0f0a", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
      <div style={{ background: "#fffdf8", borderRadius: 24, padding: 36, maxWidth: 500, width: "100%" }}>
        {tips && (
          <div style={{ background: "#fdf6e8", border: "1px solid #e8d5a0", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Tips for next time</p>
            <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#5c4a2a", lineHeight: 1.6 }}>{tips}</p>
          </div>
        )}

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2c1810", margin: "0 0 6px" }}>Update Pantry?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9e8a73", marginBottom: 20 }}>Tick anything you used up while cooking</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, maxHeight: 300, overflowY: "auto" }}>
          {pantryItems.map(item => (
            <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: removedPantryIds.includes(item.id) ? "#fce4e4" : "#f7f3ec", border: removedPantryIds.includes(item.id) ? "1px solid #f5a0a0" : "1px solid transparent" }}>
              <input type="checkbox" checked={removedPantryIds.includes(item.id)} onChange={() => togglePantryRemove(item.id)} style={{ accentColor: "#c0392b", width: 16, height: 16 }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#2c1810" }}>{item.name}</span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleFinishPantry} style={{ flex: 1, background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15 }}>
            {removedPantryIds.length > 0 ? "Update & Finish" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
