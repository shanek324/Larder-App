import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import HomeView from "./views/HomeView";
import RecipeView from "./views/RecipeView";
import CollectionsView from "./views/CollectionsView";
import ShoppingListView from "./views/ShoppingListView";
import InShopView from "./views/InShopView";
import PantryView from "./views/PantryView";
import GenerateModal from "./views/GenerateModal";
import AddRecipeModal from "./views/AddRecipeModal";
import ImportRecipeModal from "./views/ImportRecipeModal";
import Login from "./Login";
import CookingMode from "./views/CookingMode";
import CookHistoryView from "./views/CookHistoryView";

const NAV = [
  { key: "home", label: "Recipes", icon: "🍳" },
  { key: "collections", label: "Collections", icon: "📁" },
  { key: "shopping", label: "Shopping", icon: "🛒" },
  { key: "pantry", label: "Pantry", icon: "🥫" },
  { key: "history", label: "History", icon: "📋" },
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
    cook_count: r.cook_count || 0,
    step_notes: r.step_notes || {},
    image_url: r.image_url || null,
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
    cook_count: r.cook_count || 0,
    step_notes: r.step_notes || {},
    image_url: r.image_url || null,
  };
}

function collectionToDb(c) {
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    recipe_ids: c.recipeIds,
    created_at: c.createdAt,
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
    quantity: p.quantity || null,
    unit: p.unit || null,
    price: p.price || null,
  };
}

function pantryFromDb(p) {
  return {
    id: p.id,
    name: p.name,
    aisle: p.aisle,
    addedAt: p.added_at,
    quantity: p.quantity || null,
    unit: p.unit || null,
    price: p.price || null,
  };
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [savedShoppingList, setSavedShoppingList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [view, setView] = useState("home");
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  // Load all data from Supabase on mount
  useEffect(() => {
    if (!session) return;
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: recipeData }, { data: colData }, { data: pantryData }, { data: shopData }] = await Promise.all([
          supabase.from("recipes").select("*").order("created_at", { ascending: false }),
          supabase.from("collections").select("*").order("created_at", { ascending: true }),
          supabase.from("pantry").select("*").order("added_at", { ascending: true }),
          supabase.from("shopping_list").select("*").order("created_at", { ascending: false }).limit(1),
        ]);
        setRecipes(recipeData ? recipeData.map(recipeFromDb) : []);
        setCollections(colData ? colData.map(collectionFromDb) : []);
        setPantryItems(pantryData ? pantryData.map(pantryFromDb) : []);
        setSavedShoppingList(shopData?.[0] || null);
      } catch(e) {
        console.error("loadData error", e);
      }
      setLoading(false);
    }
    loadData();
  }, [session]);

  async function addRecipe(recipe) {
    const { data } = await supabase.from("recipes").insert({ ...recipeToDb(recipe), user_id: session?.user?.id }).select().single();
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


  async function duplicateRecipe(recipe) {
    const copy = {
      ...recipe,
      id: undefined,
      title: recipe.title + " (copy)",
      cook_count: 0,
      step_notes: {},
      lastCooked: null,
      createdAt: Date.now(),
    };
    await addRecipe(copy);
  }

  async function updateCollections(updated) {
    await supabase.from("collections").upsert(updated.map(c => ({ ...collectionToDb(c), user_id: session?.user?.id })));
    const updatedIds = updated.map(c => c.id);
    const removedIds = collections.filter(c => !updatedIds.includes(c.id)).map(c => c.id);
    if (removedIds.length > 0) await supabase.from("collections").delete().in("id", removedIds);
    setCollections(updated);
  }

  async function updatePantry(updated) {
    const newItems = updated.filter(i => !pantryItems.find(p => p.id === i.id));
    const removedIds = pantryItems.filter(p => !updated.find(i => i.id === p.id)).map(p => p.id);
    if (newItems.length > 0) await supabase.from("pantry").insert(newItems.map(p => ({ ...pantryToDb(p), user_id: session?.user?.id })));
    if (removedIds.length > 0) await supabase.from("pantry").delete().in("id", removedIds);
    setPantryItems(updated);
  }

  async function saveShoppingList(items, prepared = false) {
    if (savedShoppingList) {
      await supabase.from("shopping_list").update({ items, prepared }).eq("id", savedShoppingList.id);
      setSavedShoppingList({ ...savedShoppingList, items, prepared });
    } else {
      const { data } = await supabase.from("shopping_list").insert({ items, prepared, user_id: session?.user?.id, created_at: Date.now() }).select().single();
      setSavedShoppingList(data);
    }
  }

  async function savePrices(priceEntries) {
    // priceEntries: [{ ingredient_name, total_price, quantity, unit }]
    const rows = priceEntries.map(e => {
      const qty = parseFloat(e.quantity) || 1;
      const price_per_unit = e.total_price / qty;
      return {
        ingredient_name: e.ingredient_name,
        price_per_unit,
        quantity: qty,
        unit: e.unit || null,
        user_id: session?.user?.id,
        purchased_at: new Date().toISOString(),
      };
    });
    await supabase.from("prices").insert(rows);
  }

  async function clearShoppingList() {
    if (savedShoppingList) {
      await supabase.from("shopping_list").delete().eq("id", savedShoppingList.id);
      setSavedShoppingList(null);
    }
  }

  async function handleUpdateShoppingList(updatedList, addToPantry = []) {
    if (addToPantry.length > 0) {
      const existing = pantryItems.map(i => i.name.toLowerCase());
      const newItems = addToPantry
        .filter(i => !existing.includes(i.name.toLowerCase()))
        .map(i => ({ id: "pantry-" + Date.now() + Math.random(), name: i.name, aisle: i.aisle, addedAt: Date.now() }));
      if (newItems.length > 0) {
        await supabase.from("pantry").insert(newItems.map(p => ({ ...pantryToDb(p), user_id: session?.user?.id })));
        setPantryItems(p => [...p, ...newItems]);
      }
    }
  }

  function viewRecipe(id) { setActiveRecipeId(id); setView("recipe"); }
  function handleBack() { setActiveRecipeId(null); setView("home"); }

  const activeRecipe = recipes.find(r => r.id === activeRecipeId);
  const isCooking = view === "cooking" && activeRecipe;

  if (authLoading) return null;
  if (!session) return <Login />;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-inner">
          <p className="loading-emoji">🫙</p>
          <p className="loading-text">Loading your Larder…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {!isCooking && (
        <>
          <header className="app-header">
            <div className="app-logo" onClick={() => { setView("home"); setActiveRecipeId(null); }}>
              <span className="app-logo-icon">🫙</span>
              <span className="app-logo-text">Larder</span>
            </div>
            <div className="header-actions">
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowAddMenu(v => !v)} className="btn btn-primary">+ Add Recipe</button>
                {showAddMenu && (
                  <div className="add-recipe-menu">
                    <button onClick={() => { setShowAdd(true); setShowAddMenu(false); }} className="add-recipe-menu-item">✏️ Add manually</button>
                    <button onClick={() => { setShowGenerate(true); setShowAddMenu(false); }} className="add-recipe-menu-item">✦ AI Generate</button>
                    <button onClick={() => { setShowImport(true); setShowAddMenu(false); }} className="add-recipe-menu-item">🔗 Import from URL</button>
                  </div>
                )}
              </div>
              <button onClick={() => supabase.auth.signOut()} className="btn btn-outline">Sign Out</button>
            </div>
          </header>

          <nav className="app-nav">
            {NAV.map(n => (
              <button
                key={n.key}
                onClick={() => { setView(n.key); setActiveRecipeId(null); }}
                className={"nav-btn" + (view === n.key || (n.key === "home" && view === "recipe") ? " active" : "")}
              >
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      <div className={isCooking ? "" : "main-content"}>
        {isCooking ? (
          <CookingMode
            recipe={activeRecipe}
            pantryItems={pantryItems}
            onExit={() => setView("recipe")}
            onUpdateRecipe={updateRecipe}
            onUpdatePantry={updatePantry}
            session={session}
          />
        ) : view === "recipe" && activeRecipe ? (
          <RecipeView
            recipe={activeRecipe}
            onBack={handleBack}
            onUpdate={updateRecipe}
            onDelete={() => deleteRecipe(activeRecipeId)}
            collections={collections}
            onUpdateCollections={updateCollections}
            onStartCooking={() => setView("cooking")}
            onDuplicate={() => duplicateRecipe(activeRecipe)}
          />
        ) : view === "collections" ? (
          <CollectionsView
            collections={collections}
            recipes={recipes}
            onUpdateCollections={updateCollections}
            onViewRecipe={viewRecipe}
          />
        ) : view === "shopping" ? (
          savedShoppingList && savedShoppingList.prepared ? (
            <InShopView
              savedList={savedShoppingList}
              pantryItems={pantryItems}
              onClearList={clearShoppingList}
              onUpdatePantry={updatePantry}
            />
          ) : (
            <ShoppingListView
              recipes={recipes}
              pantryItems={pantryItems}
              onSaveList={saveShoppingList}
              savedList={savedShoppingList}
              onClearList={clearShoppingList}
            />
          )
        ) : view === "history" ? (
          <CookHistoryView recipes={recipes} />
        ) : view === "pantry" ? (
          <PantryView
            pantryItems={pantryItems}
            onUpdatePantry={updatePantry}
            onSavePrices={savePrices}
            session={session}
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
      {showImport && <ImportRecipeModal onClose={() => setShowImport(false)} onAdd={addRecipe} />}
    </div>
  );
}
