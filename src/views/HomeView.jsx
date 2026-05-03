import RecipeCard from "../components/RecipeCard";

export default function HomeView({ recipes, collections, onViewRecipe, search, setSearch, filterTag, setFilterTag }) {
  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();
  const filtered = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    const matchTag = !filterTag || r.tags.includes(filterTag);
    return matchSearch && matchTag;
  });
  const recent = [...recipes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const featured = recipes[Math.floor(Math.random() * recipes.length)] || null;
  const showingAll = !search && !filterTag;

  return (
    <>
      {showingAll && (
        <div style={{ background: "linear-gradient(135deg, #2c1810 0%, #4a2c1a 60%, #6b3f22 100%)", borderRadius: 16, padding: "28px 24px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 200, height: 200, background: "radial-gradient(circle, rgba(200,169,110,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
          <p style={{ margin: "0 0 6px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#c8a96e", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Your Kitchen</p>
          <h1 style={{ margin: "0 0 8px", fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#f5e6c8", fontWeight: 700, lineHeight: 1.2 }}>Welcome to<br />your Larder</h1>
          <p style={{ margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(245,230,200,0.65)", lineHeight: 1.6 }}>{recipes.length} recipe{recipes.length !== 1 ? "s" : ""} catalogued · {collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
          {featured && (
            <div onClick={() => onViewRecipe(featured.id)} style={{ background: "rgba(255,253,248,0.08)", borderRadius: 12, padding: "14px 18px", display: "inline-flex", gap: 14, alignItems: "center", backdropFilter: "blur(4px)", border: "1px solid rgba(245,230,200,0.15)", cursor: "pointer" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#c8a96e", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Featured</p>
                <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#f5e6c8", fontWeight: 700 }}>{featured.title}</p>
                <p style={{ margin: "2px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,230,200,0.55)" }}>{featured.prepTime} prep · {featured.cookTime} cook</p>
              </div>
              <span style={{ color: "#c8a96e", fontSize: 20 }}>→</span>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes…"
          style={{ width: "100%", padding: "10px 16px", border: "1.5px solid #ddd5c8", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#fffdf8", outline: "none", color: "#3a2e22", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span onClick={() => setFilterTag(null)} style={{ padding: "6px 14px", borderRadius: 20, background: !filterTag ? "#2c1810" : "#f0ebe3", color: !filterTag ? "#f5e6c8" : "#5c4a2a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>All</span>
          {allTags.map(t => (
            <span key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} style={{ padding: "6px 14px", borderRadius: 20, background: filterTag === t ? "#2c1810" : "#f0ebe3", color: filterTag === t ? "#f5e6c8" : "#5c4a2a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
          ))}
        </div>
      </div>

      {showingAll && recent.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2c1810", margin: "0 0 14px", fontWeight: 700 }}>Recently Added</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {recent.map(r => <RecipeCard key={r.id} recipe={r} collections={collections} onClick={() => onViewRecipe(r.id)} compact />)}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2c1810", margin: "0 0 14px", fontWeight: 700 }}>
          {showingAll ? "All Recipes" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
        </h2>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e8a73" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🍳</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#5c4a2a", marginBottom: 8 }}>No recipes found</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtered.map(r => <RecipeCard key={r.id} recipe={r} collections={collections} onClick={() => onViewRecipe(r.id)} />)}
          </div>
        )}
      </div>
    </>
  );
}
