import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import RecipeCard from "../components/RecipeCard";
import { slugify } from "../utils";

export default function BrowseView({ session, onAdd, ownRecipeIds }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState({});

  useEffect(() => {
    async function loadPublic() {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (data) setRecipes(data.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        tags: r.tags || [],
        servings: r.servings,
        prepTime: r.prep_time,
        cookTime: r.cook_time,
        ingredients: r.ingredients || [],
        method: r.method || [],
        notes: r.notes,
        createdAt: r.created_at,
        cook_count: r.cook_count || 0,
        step_notes: r.step_notes || {},
        image_url: r.image_url || null,
        user_id: r.user_id,
        is_public: r.is_public,
        // _author: r.username || null, // TODO: join with profiles table for display name
      })));
      setLoading(false);
    }
    loadPublic();
  }, []);

  async function handleAdd(recipe) {
    setAdding(a => ({ ...a, [recipe.id]: true }));
    const forked = {
      ...recipe,
      id: slugify(recipe.title) + "-" + Date.now(),
      createdAt: Date.now(),
      cook_count: 0,
      step_notes: {},
      lastCooked: null,
      is_public: false,
      // _forked_from: recipe.id, // TODO: track original for attribution
    };
    await onAdd(forked);
    setAdding(a => ({ ...a, [recipe.id]: false }));
  }

  const filtered = recipes.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="view"><p style={{ padding: 24 }}>Loading...</p></div>;

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Browse</h1>
          <p className="page-subtitle">{filtered.length} public recipe{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search public recipes…"
        className="input"
        style={{ marginBottom: 16 }}
      />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-emoji">🌍</p>
          <p className="empty-state-title">No public recipes yet</p>
          <p className="empty-state-text">Make your recipes public to share them here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(r => {
            const isOwn = r.user_id === session?.user?.id;
            const alreadyAdded = ownRecipeIds.includes(r.id);
            return (
              <div key={r.id} style={{ position: "relative" }}>
                <RecipeCard recipe={r} onClick={() => {}} collections={[]} compact />
                <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "flex-end" }}>
                  {isOwn ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>Your recipe</span>
                  ) : alreadyAdded ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>✓ In your library</span>
                  ) : (
                    <button
                      onClick={() => handleAdd(r)}
                      disabled={adding[r.id]}
                      className="btn btn-gold"
                    >
                      {adding[r.id] ? "Adding…" : "+ Add to my library"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
