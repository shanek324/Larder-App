import { useState } from "react";
import { supabase } from "../supabase";
import { callClaude, slugify } from "../utils";
import { API_MODEL } from "../constants";
import { toast } from "../toast";

export default function ImportRecipeModal({ onClose, onAdd }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
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
      toast.error("Could not extract recipe. Try a different URL. (" + e.message + ")");
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

                <div style={{ marginTop: 14 }}>
                  <p className="label-uppercase" style={{ marginBottom: 6 }}>Ingredients</p>
                  <ul style={{ fontFamily: "var(--font-sans)", fontSize: 14, margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                    {(preview.ingredients || []).map((ing, i) => (
                      <li key={i}>{ing.amount ? ing.amount + " " : ""}{ing.name}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 14 }}>
                  <p className="label-uppercase" style={{ marginBottom: 6 }}>Method</p>
                  <ol style={{ fontFamily: "var(--font-sans)", fontSize: 14, margin: 0, paddingLeft: 20, lineHeight: 1.5 }}>
                    {(preview.method || []).map((step, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{step}</li>
                    ))}
                  </ol>
                </div>

                {preview.notes && (
                  <div style={{ marginTop: 14 }}>
                    <p className="label-uppercase" style={{ marginBottom: 6 }}>Notes</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontStyle: "italic", margin: 0 }}>{preview.notes}</p>
                  </div>
                )}
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
