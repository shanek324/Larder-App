import { useState } from "react";
import { callClaude, slugify, validateRecipeShape } from "../utils";
import Tag from "../components/Tag";
import { toast } from "../toast";

export default function GenerateModal({ onClose, onAdd }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const system = `You are a recipe generator for an Irish household. Respond ONLY with valid JSON (no markdown, no preamble):
{"title":"...","description":"...","servings":4,"prepTime":"... min","cookTime":"... min","tags":["..."],"ingredients":[{"name":"...","amount":"..."}],"method":["..."],"notes":"..."}

Rules:
- Use metric measurements always (g, ml, kg, tsp, tbsp)
- Include approx cost in euro in the description e.g. "About €10 for 4 portions."
- Ingredient name in Title Case with descriptor after comma e.g. "Chicken breast, diced"
- Tags from this list only: Baking, Dessert, Dinner, Quick, Vegetarian, Fish, Chicken, Pasta, Breakfast, Soup, Italian, Portuguese
- Each method step is a complete sentence
- notes: 1-2 practical tips`;

    try {
      const reply = await callClaude([{ role: "user", content: prompt }], system, 2000);
      setResult(validateRecipeShape(JSON.parse(reply.replace(/```json|```/g, "").trim())));
    } catch (e) {
      toast.error(e.message || "Couldn't generate a recipe. Try a more specific description.");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">✦ Generate a Recipe</h2>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && generate()}
          rows={4}
          placeholder="e.g. A quick weeknight pasta using chorizo and cherry tomatoes." aria-label="e.g. A quick weeknight pasta using chorizo and cherry tomatoes."
          className="input generate-textarea"
        />

        <button onClick={generate} disabled={loading} className="btn btn-gold btn-full generate-btn">
          {loading ? "Generating…" : "Generate Recipe"}
        </button>

        {result && (
          <div className="generate-result">
            <h3 className="generate-result-title">{result.title}</h3>
            <p className="generate-result-desc">{result.description}</p>
            <div className="generate-result-tags">
              {(result.tags || []).map(t => <Tag key={t} label={t} />)}
            </div>
            <div className="generate-result-meta">
              <span>⏱ {result.prepTime}</span>
              <span>🔥 {result.cookTime}</span>
              <span>🍽 {result.servings} servings</span>
            </div>

            <div style={{ marginTop: 16 }}>
              <p className="label-uppercase" style={{ marginBottom: 6 }}>Ingredients</p>
              <ul style={{ fontFamily: "var(--font-sans)", fontSize: 14, margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                {(result.ingredients || []).map((ing, i) => (
                  <li key={i}>{ing.amount ? ing.amount + " " : ""}{ing.name}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: 14 }}>
              <p className="label-uppercase" style={{ marginBottom: 6 }}>Method</p>
              <ol style={{ fontFamily: "var(--font-sans)", fontSize: 14, margin: 0, paddingLeft: 20, lineHeight: 1.5 }}>
                {(result.method || []).map((step, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{step}</li>
                ))}
              </ol>
            </div>

            {result.notes && (
              <div style={{ marginTop: 14 }}>
                <p className="label-uppercase" style={{ marginBottom: 6 }}>Notes</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontStyle: "italic", color: "var(--color-text-secondary)", margin: 0 }}>{result.notes}</p>
              </div>
            )}

            <button
              onClick={() => {
                onAdd({ ...result, id: slugify(result.title) + "-" + Date.now(), createdAt: Date.now() });
                onClose();
              }}
              className="btn btn-primary btn-full generate-add-btn"
            >
              Add to Larder →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
