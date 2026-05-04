import { useState } from "react";
import { callClaude, slugify } from "../utils";
import Tag from "../components/Tag";

export default function GenerateModal({ onClose, onAdd }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
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
      const reply = await callClaude([{ role: "user", content: prompt }], system);
      setResult(JSON.parse(reply.replace(/```json|```/g, "").trim()));
    } catch (e) {
      setError("Couldn't generate a recipe. Try a more specific description.");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">✦ Generate a Recipe</h2>
          <span onClick={onClose} className="modal-close">×</span>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && generate()}
          rows={4}
          placeholder="e.g. A quick weeknight pasta using chorizo and cherry tomatoes."
          className="input generate-textarea"
        />

        <button onClick={generate} disabled={loading} className="btn btn-gold btn-full generate-btn">
          {loading ? "Generating…" : "Generate Recipe"}
        </button>

        {error && <p className="generate-error">{error}</p>}

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
