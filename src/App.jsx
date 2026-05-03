import { useState, useEffect } from "react";
import { STORAGE_KEY, COLLECTIONS_KEY, PANTRY_KEY, SHOPPING_LIST_KEY, SAMPLE_RECIPES, SAMPLE_COLLECTIONS } from "./constants";
import HomeView from "./views/HomeView";
import RecipeView from "./views/RecipeView";
import CollectionsView from "./views/CollectionsView";
import ShoppingListView from "./views/ShoppingListView";
import PantryView from "./views/PantryView";
import GenerateModal from "./views/GenerateModal";
import AddRecipeModal from "./views/AddRecipeModal";

const NAV = [
  { key: "home", label: "Recipes", icon: "🍳" },
  { key: "collections", label: "Collections", icon: "📁" },
  { key: "shopping", label: "Shopping", icon: "🛒" },
  { key: "pantry", label: "Pantry", icon: "🥫" },
];

export default function App() {
  const [recipes, setRecipes] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : SAMPLE_RECIPES; } catch { return SAMPLE_RECIPES; }
  });
  const [collections, setCollections] = useState(() => {
    try { const s = localStorage.getItem(COLLECTIONS_KEY); return s ? JSON.parse(s) : SAMPLE_COLLECTIONS; } catch { return SAMPLE_COLLECTIONS; }
  });
  const [pantryItems, setPantryItems] = useState(() => {
    try { const s = localStorage.getItem(PANTRY_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [shoppingList, setShoppingList] = useState(() => {
    try { const s = localStorage.getItem(SHOPPING_LIST_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const [view, setView] = useState("home");
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem(PANTRY_KEY, JSON.stringify(pantryItems)); }, [pantryItems]);
  useEffect(() => { localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(shoppingList)); }, [shoppingList]);

  function addRecipe(recipe) { setRecipes(r => [recipe, ...r]); }
  function updateRecipe(updated) { setRecipes(r => r.map(x => x.id === updated.id ? updated : x)); }
  function deleteRecipe(id) { setRecipes(r => r.filter(x => x.id !== id)); setView("home"); setActiveRecipeId(null); }

  function viewRecipe(id) { setActiveRecipeId(id); setView("recipe"); }
  function handleBack() { setActiveRecipeId(null); setView("home"); }

  function handleUpdateShoppingList(updatedList, addToPantry = []) {
    setShoppingList(updatedList);
    if (addToPantry.length > 0) {
      setPantryItems(p => {
        const existing = p.map(i => i.name.toLowerCase());
        const newItems = addToPantry
          .filter(i => !existing.includes(i.name.toLowerCase()))
          .map(i => ({ id: "pantry-" + Date.now() + Math.random(), name: i.name, aisle: i.aisle, addedAt: Date.now() }));
        return [...p, ...newItems];
      });
    }
  }

  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fffdf8", borderBottom: "1.5px solid #e8e0d5", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => { setView("home"); setActiveRecipeId(null); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🫙</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#2c1810" }}>Larder</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowGenerate(true)} style={{ background: "#f5e6c8", color: "#8b6914", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>✦ Generate</button>
          <button onClick={() => setShowAdd(true)} style={{ background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>+ Add</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#fffdf8", borderBottom: "1.5px solid #e8e0d5", padding: "0 24px", display: "flex", gap: 0 }}>
        {NAV.map(n => (
          <button key={n.key} onClick={() => { setView(n.key); setActiveRecipeId(null); }} style={{ background: "none", border: "none", padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: view === n.key || (n.key === "home" && view === "recipe") ? "#c8a96e" : "#9e8a73", borderBottom: view === n.key || (n.key === "home" && view === "recipe") ? "2px solid #c8a96e" : "2px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {view === "recipe" && activeRecipe ? (
          <RecipeView
            recipe={activeRecipe}
            onBack={handleBack}
            onUpdate={updateRecipe}
            onDelete={() => deleteRecipe(activeRecipeId)}
            collections={collections}
            onUpdateCollections={setCollections}
            onCookedIt={() => updateRecipe({ ...activeRecipe, lastCooked: Date.now() })}
          />
        ) : view === "collections" ? (
          <CollectionsView
            collections={collections}
            recipes={recipes}
            onUpdateCollections={setCollections}
            onViewRecipe={viewRecipe}
          />
        ) : view === "shopping" ? (
          <ShoppingListView
            recipes={recipes}
            pantryItems={pantryItems}
            shoppingList={shoppingList}
            onUpdateShoppingList={handleUpdateShoppingList}
          />
        ) : view === "pantry" ? (
          <PantryView
            pantryItems={pantryItems}
            onUpdatePantry={setPantryItems}
          />
        ) : (
          <HomeView
            recipes={recipes}
            collections={collections}
            onViewRecipe={viewRecipe}
            search={search}
            setSearch={setSearch}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
          />
        )}
      </div>

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onAdd={addRecipe} />}
      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} onAdd={addRecipe} />}
    </div>
  );
}
