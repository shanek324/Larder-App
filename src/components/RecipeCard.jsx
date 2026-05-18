import Tag from "./Tag";

const FALLBACK_EMOJIS = {
  pasta: "🍝", italian: "🍝", asian: "🍜", japanese: "🍜", chinese: "🥡",
  mexican: "🌮", indian: "🍛", thai: "🍜", french: "🥖",
  vegetarian: "🥗", vegan: "🥗", salad: "🥗",
  meat: "🥩", beef: "🥩", lamb: "🥩", pork: "🥩",
  chicken: "🍗", fish: "🐟", seafood: "🦐",
  soup: "🍲", curry: "🍛", stew: "🍲",
  breakfast: "🥞", brunch: "🥞", egg: "🍳",
  dessert: "🍰", baking: "🧁", sweet: "🍪",
  pizza: "🍕", bread: "🥖", sandwich: "🥪",
  drink: "🍷", cocktail: "🍸",
};

function emojiForRecipe(recipe) {
  for (const t of recipe.tags || []) {
    const key = t.toLowerCase();
    if (FALLBACK_EMOJIS[key]) return FALLBACK_EMOJIS[key];
  }
  return "🍳";
}

export default function RecipeCard({ recipe, onClick, collections = [], compact = false }) {
  const recipeCollections = collections.filter(c => c.recipeIds.includes(recipe.id));
  const hasImage = Boolean(recipe.image_url);
  const fallbackEmoji = emojiForRecipe(recipe);

  return (
    <button type="button" onClick={onClick} className={"recipe-card" + (compact ? " recipe-card-compact" : "")} aria-label={`Open recipe: ${recipe.title}`}>
      {compact ? (
        <div className="recipe-card-thumb">
          {hasImage ? (
            <img src={recipe.image_url} alt="" className="recipe-card-thumb-img" loading="lazy" />
          ) : (
            <div className="recipe-card-thumb-fallback" aria-hidden="true">{fallbackEmoji}</div>
          )}
        </div>
      ) : (
        <div className="recipe-card-image">
          {hasImage ? (
            <img src={recipe.image_url} alt="" className="recipe-card-image-img" loading="lazy" />
          ) : (
            <div className="recipe-card-image-fallback" aria-hidden="true">{fallbackEmoji}</div>
          )}
          {recipe.cook_count > 0 && (
            <span className="recipe-card-cooked-badge">👨‍🍳 {recipe.cook_count}x</span>
          )}
        </div>
      )}

      <div className="recipe-card-body">
        {recipeCollections.length > 0 && (
          <div className="recipe-card-collections">
            {recipeCollections.map(c => (
              <span key={c.id} className="recipe-card-collection">{c.emoji} {c.name}</span>
            ))}
          </div>
        )}

        <h3 className="recipe-card-title">{recipe.title}</h3>

        {!compact && recipe.description && (
          <p className="recipe-card-desc">{recipe.description}</p>
        )}

        {!compact && recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map(t => <Tag key={t} label={t} />)}
          </div>
        )}

        <div className="recipe-card-meta">
          <span>⏱ {recipe.prepTime}</span>
          <span>🔥 {recipe.cookTime}</span>
          <span>🍽 {recipe.servings}</span>
          {compact && recipe.cook_count > 0 && <span>👨‍🍳 {recipe.cook_count}x</span>}
        </div>
      </div>
    </button>
  );
}
