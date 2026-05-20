import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import RecipeCard from "../components/RecipeCard";
import RecipeView from "./RecipeView";
import { SkeletonCard } from "../components/Skeleton";
import { slugify, recipeFromDb } from "../utils";

export default function BrowseView({ session, onAdd, ownRecipeIds }) {
  const [recipes, setRecipes] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [adding, setAdding] = useState({});
  const [addedOriginals, setAddedOriginals] = useState(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    async function loadPublic() {
      const { data: recipeData } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (recipeData) {
        const userIds = [...new Set(recipeData.map(r => r.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", userIds);
          if (profileData) {
            const profileMap = {};
            profileData.forEach(p => { profileMap[p.id] = p.username; });
            setProfiles(profileMap);
          }
        }
      }

      if (recipeData) setRecipes(recipeData.map(recipeFromDb));
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
      is_approved: false,
    };
    await onAdd(forked);
    setAddedOriginals(s => { const n = new Set(s); n.add(recipe.id); return n; });
    setAdding(a => ({ ...a, [recipe.id]: false }));
  }

  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    const matchTag = !filterTag || r.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  if (loading) {
    return (
      <div className="view">
        <div className="view-header">
          <div>
            <h1 className="page-title">Browse</h1>
            <p className="page-subtitle">Loading public recipes…</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (selectedRecipe) {
    return (
      <RecipeView
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onUpdate={() => {}}
        onDelete={() => {}}
        collections={[]}
        onUpdateCollections={() => {}}
        onStartCooking={null}
        onDuplicate={() => handleAdd(selectedRecipe)}
        onAddToLibrary={(ownRecipeIds.includes(selectedRecipe.id) || addedOriginals.has(selectedRecipe.id)) ? null : () => handleAdd(selectedRecipe)}
        session={session}
       
        authorName={profiles[selectedRecipe.user_id] || null}
      />
    );
  }

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
        placeholder="Search public recipes…" aria-label="Search public recipes…"
        className="input"
        style={{ marginBottom: 12 }}
      />

      <div className="home-tags" style={{ marginBottom: 16 }}>
        <button type="button" onClick={() => setFilterTag(null)} className={"pill" + (!filterTag ? " active" : "")}>All</button>
        {allTags.map(t => (
          <button type="button" key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} className={"pill" + (filterTag === t ? " active" : "")}>{t}</button>
        ))}
      </div>

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
            const alreadyAdded = ownRecipeIds.includes(r.id) || addedOriginals.has(r.id);
            const author = profiles[r.user_id];
            return (
              <div key={r.id}>
                <div style={{ position: "relative" }}>
                  <RecipeCard recipe={r} onClick={() => setSelectedRecipe(r)} collections={[]} compact />
                </div>
                <div style={{ padding: "0 0 4px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
                    {author ? "by " + author : ""}
                  </span>
                  {isOwn ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>Your recipe</span>
                  ) : alreadyAdded ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>✓ In your library</span>
                  ) : (
                    <button onClick={() => handleAdd(r)} disabled={adding[r.id]} className="btn btn-gold">
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
