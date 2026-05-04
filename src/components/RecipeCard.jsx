import Tag from "./Tag";

export default function RecipeCard({ recipe, onClick, collections = [], compact = false }) {
  const recipeCollections = collections.filter(c => c.recipeIds.includes(recipe.id));

  return (
    <div onClick={onClick} className={"recipe-card" + (compact ? " recipe-card-compact" : "")}>
      <div className="recipe-card-glow" />

      {recipeCollections.length > 0 && (
        <div className="recipe-card-collections">
          {recipeCollections.map(c => (
            <span key={c.id} className="recipe-card-collection">{c.emoji} {c.name}</span>
          ))}
        </div>
      )}

      <h3 className="recipe-card-title">{recipe.title}</h3>

      {!compact && <p className="recipe-card-desc">{recipe.description}</p>}

      <div className="recipe-card-tags">
        {recipe.tags.map(t => <Tag key={t} label={t} />)}
      </div>

      <div className="recipe-card-meta">
        <span>⏱ {recipe.prepTime} prep</span>
        <span>🔥 {recipe.cookTime} cook</span>
        <span>🍽 {recipe.servings} servings</span>
        {recipe.cook_count > 0 && <span>👨‍🍳 Cooked {recipe.cook_count}x</span>}
      </div>
    </div>
  );
}
