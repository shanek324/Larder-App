import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import HomeView from "./views/HomeView";
import RecipeView from "./views/RecipeView";
import CollectionsView from "./views/CollectionsView";
import ShoppingListView from "./views/ShoppingListView";
import PantryView from "./views/PantryView";
import GenerateModal from "./views/GenerateModal";
import AddRecipeModal from "./views/AddRecipeModal";
import Login from "./Login";

const NAV = [
  { key: "home", label: "Recipes", icon: "🍳" },
  { key: "collections", label: "Collections", icon: "📁" },
  { key: "shopping", label: "Shopping", icon: "🛒" },
  { key: "pantry", label: "Pantry", icon: "🥫" },
];

function recipeToDb(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags,
    servings: r.servings,
    prep_time: r.prepTime,
    cook_time: r.cookTime,
    ingredients: r.ingredients,
    method: r.method,
    notes: r.notes,
    created_at: r.createdAt,
    last_cooked: r.lastCooked || null,
  };
}

function recipeFromDb(r) {
  return {
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
    lastCooked: r.last_cooked,
    user_id: session?.user?.id,
  };
}

function collectionToDb(c) {
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    recipe_ids: c.recipeIds,
    created_at: c.createdAt,
    user_id: session?.user?.id,
  };
}

function collectionFromDb(c) {
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    recipeIds: c.recipe_ids || [],
    createdAt: c.created_at,
  };
}

function pantryToDb(p) {
  return {
    id: p.id,
    name: p.name,
    aisle: p.aisle,
    added_at: p.addedAt,
    user_id: session?.user?.id,
  };
}

function pantryFromDb(p) {
  return {
    id: p.id,
    name: p.name,
    aisle: p.aisle,
    addedAt: p.added_at,
  };
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  const [view, setView] = useState("home");
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  // Load all data from Supabase on mount
  useEffect(() => {
	  if(!session) return;
    async function loadData() {
      setLoading(true);
      try {

      const [{ data: recipeData }, { data: colData }, { data: pantryData }] = await Promise.all([
        supabase.from("recipes").select("*").order("created_at", { ascending: false }),
        supabase.from("collections").select("*").order("created_at", { ascending: true }),
        supabase.from("pantry").select("*").order("added_at", { ascending: true }),
      ]);

      const loadedRecipes = recipeData ? recipeData.map(recipeFromDb) : [];

      setRecipes(loadedRecipes);
      setCollections(colData ? colData.map(collectionFromDb) : []);

      setPantryItems(pantryData ? pantryData.map(pantryFromDb) : []);
      setLoading(false);
      } catch(e) { console.error("loadData error", e); setLoading(false); }
    }

    loadData();
  }, [session]);

  async function addRecipe(recipe) {
    const { data } = await supabase.from("recipes").insert(recipeToDb(recipe)).select().single();
    if (data) setRecipes(r => [recipeFromDb(data), ...r]);
  }

  async function updateRecipe(updated) {
    const { data } = await supabase.from("recipes").update(recipeToDb(updated)).eq("id", updated.id).select().single();
    if (data) setRecipes(r => r.map(x => x.id === updated.id ? recipeFromDb(data) : x));
  }

  async function deleteRecipe(id) {
    await supabase.from("recipes").delete().eq("id", id);
    setRecipes(r => r.filter(x => x.id !== id));
    setView("home");
    setActiveRecipeId(null);
  }

  async function updateCollections(updated) {
    // Upsert all collections
    await supabase.from("collections").upsert(updated.map(collectionToDb));
    // Delete removed ones
    const updatedIds = updated.map(c => c.id);
    const removedIds = collections.filter(c => !updatedIds.includes(c.id)).map(c => c.id);
    if (removedIds.length > 0) await supabase.from("collections").delete().in("id", removedIds);
    setCollections(updated);
  }

  async function updatePantry(updated) {
    const newItems = updated.filter(i => !pantryItems.find(p => p.id === i.id));
    const removedIds = pantryItems.filter(p => !updated.find(i => i.id === p.id)).map(p => p.id);
    if (newItems.length > 0) await supabase.from("pantry").insert(newItems.map(pantryToDb));
    if (removedIds.length > 0) await supabase.from("pantry").delete().in("id", removedIds);
    setPantryItems(updated);
  }

  async function handleUpdateShoppingList(updatedList, addToPantry = []) {
    if (addToPantry.length > 0) {
      const existing = pantryItems.map(i => i.name.toLowerCase());
      const newItems = addToPantry
        .filter(i => !existing.includes(i.name.toLowerCase()))
        .map(i => ({ id: "pantry-" + Date.now() + Math.random(), name: i.name, aisle: i.aisle, addedAt: Date.now() }));
      if (newItems.length > 0) {
        await supabase.from("pantry").insert(newItems.map(pantryToDb));
        setPantryItems(p => [...p, ...newItems]);
      }
    }
  }

  function viewRecipe(id) { setActiveRecipeId(id); setView("recipe"); }
  function handleBack() { setActiveRecipeId(null); setView("home"); }

  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  if (authLoading) return null;
  if (!session) return <Login />;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf7f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🫙</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2c1810" }}>Loading your Larder…</p>
        </div>
      </div>
    );
  }

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
            onUpdateCollections={updateCollections}
            onCookedIt={() => updateRecipe({ ...activeRecipe, lastCooked: Date.now() })}
          />
        ) : view === "collections" ? (
          <CollectionsView
            collections={collections}
            recipes={recipes}
            onUpdateCollections={updateCollections}
            onViewRecipe={viewRecipe}
          />
        ) : view === "shopping" ? (
          <ShoppingListView
            recipes={recipes}
            pantryItems={pantryItems}
            shoppingList={[]}
            onUpdateShoppingList={handleUpdateShoppingList}
          />
        ) : view === "pantry" ? (
          <PantryView
            pantryItems={pantryItems}
            onUpdatePantry={updatePantry}
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
