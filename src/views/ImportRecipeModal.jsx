import { useState } from "react";
import { callClaude, slugify } from "../utils";
import { API_MODEL } from "../constants";

export default function ImportRecipeModal({ onClose, onAdd, checkCredits }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  async function handleImport() {
    if (!url.trim()) return;
    if (checkCredits && !(await checkCredits())) return;
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const { text, error: fetchErr } = await res.json();
      if (fetchErr) throw new Error(fetchErr);

      const messages = [{
        role: "user",
        content: `Extract the recipe from this webpage text and return ONLY a JSON object with no markdown or backticks. The JSON must have these exact fields: title (string), description (string), prepTime (string), cookTime (string), servings (number), tags (array of strings), ingredients (array of {name, amount}), method (array of strings), notes (string). Webpage text: ${text}`
      }];

      const raw = await callClaude(messages, "", 2000, API_MODEL);
      const clean = raw.replace(/^```json|^```|```$/gm, "").trim();
      const recipe = JSON.parse(clean);
      setPreview(recipe);
    } catch (e) {
      setError("Could not extract recipe. Try a different URL. (" + e.message + ")");
    }
    setLoading(false);
  }

  function handleSave() {
    if (!preview) return;
    onAdd({
      ...preview,
      id: slugify(preview.title) + "-" + Date.now(),
      createdAt: Date.now(),
      cook_count: 0,
      step_notes: {},
    });
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Import from URL</h2>
          <span onClick={onClose} className="modal-close">×</span>
        </div>

        <div className="add-recipe-form">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste recipe URL..."
            className="input add-recipe-input"
          />
          <button onClick={handleImport} disabled={loading || !url.trim()} className="btn btn-gold btn-full">
            {loading ? "Importing..." : "Import Recipe"}
          </button>

          {error && <p style={{ color: "var(--color-danger)", marginTop: 8 }}>{error}</p>}

          {preview && (
            <div style={{ marginTop: 16 }}>
              <div className="card-note" style={{ marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 4px" }}>{preview.title}</h3>
                <p style={{ margin: 0, opacity: 0.7 }}>{preview.description}</p>
                <p style={{ margin: "8px 0 0", opacity: 0.6 }}>
                  {preview.prepTime && "Prep: " + preview.prepTime + " · "}
                  {preview.cookTime && "Cook: " + preview.cookTime + " · "}
                  Serves {preview.servings}
                </p>
                <p style={{ margin: "8px 0 0", opacity: 0.6 }}>
                  {preview.ingredients?.length} ingredients · {preview.method?.length} steps
                </p>
              </div>
              <button onClick={handleSave} className="btn btn-primary btn-full">
                Save to Larder →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
