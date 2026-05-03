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
    setLoading(true); setError(""); setResult(null);

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: "#fffdf8", borderRadius: 20, padding: 32, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(44,24,16,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2c1810" }}>✦ Generate a Recipe</h2>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: "#9e8a73" }}>×</span>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. A quick weeknight pasta using chorizo and cherry tomatoes."
          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #ddd5c8", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#faf7f2", outline: "none", resize: "none", boxSizing: "border-box", color: "#3a2e22", lineHeight: 1.6 }}
        />
        <button onClick={generate} disabled={loading} style={{ marginTop: 12, width: "100%", background: "#c8a96e", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Generating…" : "Generate Recipe"}
        </button>
        {error && <p style={{ color: "#c0392b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 10 }}>{error}</p>}
        {result && (
          <div style={{ marginTop: 20, background: "#f5f0e8", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2c1810" }}>{result.title}</h3>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#7a6651", fontFamily: "'DM Sans', sans-serif" }}>{result.description}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {(result.tags || []).map(t => <Tag key={t} label={t} />)}
            </div>
            <button
              onClick={() => {
                onAdd({ ...result, id: slugify(result.title) + "-" + Date.now(), createdAt: Date.now() });
                onClose();
              }}
              style={{ width: "100%", background: "#2c1810", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Add to Larder →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
