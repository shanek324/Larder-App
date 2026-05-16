import { useMemo } from "react";
import RecipeCard from "../components/RecipeCard";

export default function HomeView({ recipes, collections, onViewRecipe, search, setSearch, filterTag, setFilterTag, onBrowse }) {
  const allTags = [...new Set(recipes.flatMap(r => r.tags).map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()))].sort();

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    const matchTag = !filterTag || r.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const recent = useMemo(() => [...recipes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3), [recipes]);
  const featured = useMemo(() => {
    if (recipes.length === 0) return null;
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = ((hash << 5) - hash) + today.charCodeAt(i);
    return recipes[Math.abs(hash) % recipes.length];
  }, [recipes.length]);
  const showingAll = !search && !filterTag;

  return (
    <>
      {showingAll && (
        <div className="home-hero">
          <div className="home-hero-glow" />
          <p className="home-hero-eyebrow">Your Kitchen</p>
          <h1 className="home-hero-title">Welcome to<br />your Larder</h1>
          <p className="home-hero-stats">{recipes.length} recipe{recipes.length !== 1 ? "s" : ""} catalogued · {collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
          {featured && (
            <div className="home-hero-featured" onClick={() => onViewRecipe(featured.id)}>
              <div>
                <p className="home-hero-featured-label">Featured</p>
                <p className="home-hero-featured-title">{featured.title}</p>
                <p className="home-hero-featured-meta">{featured.prepTime} prep · {featured.cookTime} cook</p>
              </div>
              <span className="home-hero-featured-arrow">→</span>
            </div>
          )}
        </div>
      )}

      <div className="home-search-bar">
        <div onClick={onBrowse} className="browse-banner">
        <span>🌍 Discover public recipes</span>
        <span className="browse-banner-arrow">›</span>
      </div>

      <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes…"
          className="input home-search-input"
        />
        <div className="home-tags">
          <span
            onClick={() => setFilterTag(null)}
            className={"pill" + (!filterTag ? " active" : "")}
          >All</span>
          {allTags.map(t => (
            <span
              key={t}
              onClick={() => setFilterTag(filterTag === t ? null : t)}
              className={"pill" + (filterTag === t ? " active" : "")}
            >{t}</span>
          ))}
        </div>
      </div>

      {showingAll && recent.length > 0 && (
        <div className="home-section">
          <h2 className="section-title">Recently Added</h2>
          <div className="recipe-grid">
            {recent.map(r => <RecipeCard key={r.id} recipe={r} collections={collections} onClick={() => onViewRecipe(r.id)} compact />)}
          </div>
        </div>
      )}

      <div className="home-section">
        <h2 className="section-title">
          {showingAll ? "All Recipes" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
        </h2>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-emoji">🍳</p>
            <p className="empty-state-title">No recipes found</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {filtered.map(r => <RecipeCard key={r.id} recipe={r} collections={collections} onClick={() => onViewRecipe(r.id)} />)}
          </div>
        )}
      </div>
    </>
  );
}
