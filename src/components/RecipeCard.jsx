import Tag from "./Tag";

export default function RecipeCard({ recipe, onClick, collections = [], compact = false }) {
  const recipeCollections = collections.filter(c => c.recipeIds.includes(recipe.id));
  return (
    <div onClick={onClick} style={{
      background: "#fffdf8",
      border: "1.5px solid #e8e0d5",
      borderRadius: 16,
      padding: compact ? "16px 18px" : "22px 24px",
      cursor: "pointer",
      transition: "all 0.18s ease",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(92,74,42,0.12)";
        e.currentTarget.style.borderColor = "#c8a96e";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e8e0d5";
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "radial-gradient(circle at top right, #f5e6c8 0%, transparent 70%)", pointerEvents: "none" }} />
      {recipeCollections.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {recipeCollections.map(c => (
            <span key={c.id} style={{ fontSize: 11, color: "#9e8a73", background: "#f0ebe3", padding: "1px 8px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif" }}>
              {c.emoji} {c.name}
            </span>
          ))}
        </div>
      )}
      <h3 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', serif", fontSize: compact ? 16 : 18, color: "#2c1810", fontWeight: 700 }}>{recipe.title}</h3>
      {!compact && <p style={{ margin: "0 0 14px", fontSize: 13, color: "#7a6651", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{recipe.description}</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: compact ? 8 : 14 }}>
        {recipe.tags.map(t => <Tag key={t} label={t} />)}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif" }}>
        <span>⏱ {recipe.prepTime} prep</span>
        <span>🔥 {recipe.cookTime} cook</span>
        <span>🍽 {recipe.servings} servings</span>
      </div>
    </div>
  );
}
