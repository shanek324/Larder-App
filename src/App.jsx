import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabase";
import { checkAiCredit } from "./utils";
import { toast } from "./toast";
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
import ResetPassword from "./ResetPassword";
import ToastHost from "./components/ToastHost";
import CookingMode from "./views/CookingMode";
import CookHistoryView from "./views/CookHistoryView";
import BrowseView from "./views/BrowseView";
import ProfileView from "./views/ProfileView";
import MealPlanView from "./views/MealPlanView";

const NAV = [
  { key: "home", label: "Recipes", icon: "🍳" },
  { key: "browse", label: "Browse", icon: "🌍" },
  { key: "plan", label: "Plan", icon: "📅" },
  { key: "pantry", label: "Pantry", icon: "🥫" },
  { key: "shopping", label: "Shopping", icon: "🛒" },
  { key: "profile", label: "Profile", icon: "👤" },
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
    is_public: r.is_public || false,
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
    is_public: r.is_public || false,
    user_id: r.user_id || null,
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
    stock_level: p.stockLevel || "high",
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
    stockLevel: p.stock_level || "high",
  };
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [savedShoppingList, setSavedShoppingList] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [consolidatedList, setConsolidatedList] = useState(null);
  const [crossedOff, setCrossedOff] = useState({});
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  async function checkCredits() {
    if (!session?.user?.id) return false;
    try {
      await checkAiCredit(supabase, session.user.id);
      return true;
    } catch(e) {
      toast.error(e.message);
      return false;
    }
  }

  const [view, setView] = useState("home");
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const addMenuRef = useRef(null);

  useEffect(() => {
    if (!showAddMenu) return;
    function handleClickOutside(e) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showAddMenu]);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load all data from Supabase on mount
  useEffect(() => {
    if (!session) return;
    async function loadData() {
      setLoading(true);
      try {
        // Compute date range: today to today + 21 days, in YYYY-MM-DD
        const today = new Date(); today.setHours(0,0,0,0);
        const future = new Date(today); future.setDate(future.getDate() + 21);
        const toIso = (d) => d.toISOString().slice(0, 10);

        const [{ data: recipeData }, { data: colData }, { data: pantryData }, { data: shopData }, { data: planData }] = await Promise.all([
          supabase.from("recipes").select("*").order("created_at", { ascending: false }),
          supabase.from("collections").select("*").order("created_at", { ascending: true }),
          supabase.from("pantry").select("*").order("added_at", { ascending: true }),
          supabase.from("shopping_list").select("*").order("created_at", { ascending: false }).limit(1),
          supabase.from("meal_plans").select("*").gte("date", toIso(today)).lte("date", toIso(future)).order("date", { ascending: true }),
        ]);
        setRecipes(recipeData ? recipeData.map(recipeFromDb) : []);
        setCollections(colData ? colData.map(collectionFromDb) : []);
        setPantryItems(pantryData ? pantryData.map(pantryFromDb) : []);
        setSavedShoppingList(shopData?.[0] || null);
        setMealPlans(planData || []);
      } catch(e) {
        console.error("loadData error", e);
        toast.error("Couldn't load your Larder. Check your connection and reload.");
      }
      setLoading(false);
    }
    loadData();
  }, [session]);

  async function addRecipe(recipe) {
    try {
      const { data, error } = await supabase.from("recipes").insert({ ...recipeToDb(recipe), user_id: session?.user?.id }).select().single();
      if (error) throw error;
      if (data) setRecipes(r => [recipeFromDb(data), ...r]);
    } catch(e) {
      console.error("addRecipe error", e);
      toast.error("Couldn't save recipe. Please try again.");
    }
  }

  async function updateRecipe(updated) {
    try {
      const { data, error } = await supabase.from("recipes").update(recipeToDb(updated)).eq("id", updated.id).select().single();
      if (error) throw error;
      if (data) setRecipes(r => r.map(x => x.id === updated.id ? recipeFromDb(data) : x));
    } catch(e) {
      console.error("updateRecipe error", e);
      toast.error("Couldn't update recipe. Please try again.");
    }
  }

  async function deleteRecipe(id) {
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      setRecipes(r => r.filter(x => x.id !== id));
      setView("home");
      setActiveRecipeId(null);
      toast.success("Recipe deleted");
    } catch(e) {
      console.error("deleteRecipe error", e);
      toast.error("Couldn't delete recipe. Please try again.");
    }
  }


  function duplicateRecipe(recipe) {
    setDuplicateData({
      ...recipe,
      _originalId: recipe.id,
      title: recipe.title + " (copy)",
      cook_count: 0,
      step_notes: {},
      lastCooked: null,
      createdAt: Date.now(),
    });
    setShowAdd(true);
  }

  async function overwriteRecipe(original, updates) {
    await updateRecipe({ ...original, ...updates });
  }

  async function updateCollections(updated) {
    try {
      const { error } = await supabase.from("collections").upsert(updated.map(c => ({ ...collectionToDb(c), user_id: session?.user?.id })));
      if (error) throw error;
      const updatedIds = updated.map(c => c.id);
      const removedIds = collections.filter(c => !updatedIds.includes(c.id)).map(c => c.id);
      if (removedIds.length > 0) {
        const { error: delErr } = await supabase.from("collections").delete().in("id", removedIds);
        if (delErr) throw delErr;
      }
      setCollections(updated);
    } catch(e) {
      console.error("updateCollections error", e);
      toast.error("Couldn't update collections. Please try again.");
    }
  }

  async function updatePantry(updated) {
    try {
      const newItems = updated.filter(i => !pantryItems.find(p => p.id === i.id));
      const removedIds = pantryItems.filter(p => !updated.find(i => i.id === p.id)).map(p => p.id);
      const changedItems = updated.filter(i => {
        const existing = pantryItems.find(p => p.id === i.id);
        return existing && JSON.stringify(pantryToDb(i)) !== JSON.stringify(pantryToDb(existing));
      });
      if (newItems.length > 0) {
        const { error } = await supabase.from("pantry").insert(newItems.map(p => ({ ...pantryToDb(p), user_id: session?.user?.id })));
        if (error) throw error;
      }
      if (removedIds.length > 0) {
        const { error } = await supabase.from("pantry").delete().in("id", removedIds);
        if (error) throw error;
      }
      if (changedItems.length > 0) {
        const results = await Promise.all(changedItems.map(p => supabase.from("pantry").update(pantryToDb(p)).eq("id", p.id)));
        const firstErr = results.find(r => r.error);
        if (firstErr) throw firstErr.error;
      }
      setPantryItems(updated);
    } catch(e) {
      console.error("updatePantry error", e);
      toast.error("Couldn't update pantry. Please try again.");
    }
  }

  async function saveShoppingList(items, prepared = false, ticked = {}, recipe_ids = []) {
    try {
      if (savedShoppingList) {
        const { error } = await supabase.from("shopping_list").update({ items, prepared, ticked, recipe_ids }).eq("id", savedShoppingList.id);
        if (error) throw error;
        setSavedShoppingList({ ...savedShoppingList, items, prepared, ticked, recipe_ids });
      } else {
        const { data, error } = await supabase.from("shopping_list").insert({ items, prepared, ticked, recipe_ids, user_id: session?.user?.id, created_at: Date.now() }).select().single();
        if (error) throw error;
        setSavedShoppingList(data);
      }
    } catch(e) {
      console.error("saveShoppingList error", e);
      toast.error("Couldn't save shopping list. Please try again.");
    }
  }

  async function saveTicked(ticked) {
    if (!savedShoppingList) return;
    try {
      const { error } = await supabase.from("shopping_list").update({ ticked }).eq("id", savedShoppingList.id);
      if (error) throw error;
      setSavedShoppingList(s => ({ ...s, ticked }));
    } catch(e) {
      console.error("saveTicked error", e);
      toast.error("Couldn't sync shopping list. Your ticks are saved locally.");
    }
  }

  async function updateShoppingListItems(items) {
    if (!savedShoppingList) return;
    try {
      const { error } = await supabase.from("shopping_list").update({ items }).eq("id", savedShoppingList.id);
      if (error) throw error;
      setSavedShoppingList(s => ({ ...s, items }));
    } catch(e) {
      console.error("updateShoppingListItems error", e);
      toast.error("Couldn't update shopping list. Please try again.");
    }
  }

  async function savePrices(priceEntries) {
    try {
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
      const { error } = await supabase.from("prices").insert(rows);
      if (error) throw error;
    } catch(e) {
      console.error("savePrices error", e);
      toast.error("Couldn't save prices, but your pantry was updated.");
    }
  }

  async function clearShoppingList() {
    if (!savedShoppingList) return;
    try {
      const { error } = await supabase.from("shopping_list").delete().eq("id", savedShoppingList.id);
      if (error) throw error;
      setSavedShoppingList(null);
    } catch(e) {
      console.error("clearShoppingList error", e);
      toast.error("Couldn't clear shopping list. Please try again.");
    }
  }

  async function handleUpdateShoppingList(updatedList, addToPantry = []) {
    if (addToPantry.length > 0) {
      const existing = pantryItems.map(i => i.name.toLowerCase());
      const newItems = addToPantry
        .filter(i => !existing.includes(i.name.toLowerCase()))
        .map(i => ({ id: crypto.randomUUID(), name: i.name, aisle: i.aisle, addedAt: Date.now() }));
      if (newItems.length > 0) {
        await supabase.from("pantry").insert(newItems.map(p => ({ ...pantryToDb(p), user_id: session?.user?.id })));
        setPantryItems(p => [...p, ...newItems]);
      }
    }
  }

  async function addMealPlan(date, recipeId, slot = "dinner") {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({ user_id: session?.user?.id, date, recipe_id: recipeId, slot })
        .select()
        .single();
      if (error) throw error;
      if (data) setMealPlans(p => [...p, data]);
    } catch(e) {
      console.error("addMealPlan error", e);
      toast.error("Couldn't add to meal plan. Please try again.");
    }
  }

  async function removeMealPlan(planId) {
    try {
      const { error } = await supabase.from("meal_plans").delete().eq("id", planId);
      if (error) throw error;
      setMealPlans(p => p.filter(x => x.id !== planId));
    } catch(e) {
      console.error("removeMealPlan error", e);
      toast.error("Couldn't remove meal. Please try again.");
    }
  }

  async function clearWeekPlans(startDate, endDate) {
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .gte("date", startDate)
        .lte("date", endDate);
      if (error) throw error;
      setMealPlans(p => p.filter(x => x.date < startDate || x.date > endDate));
    } catch(e) {
      console.error("clearWeekPlans error", e);
      toast.error("Couldn't clear week plan. Please try again.");
    }
  }

  async function handleLogDeleted(recipeId) {
    try {
      // Recount logs for this recipe and sync cook_count
      const { count, error: countErr } = await supabase
        .from("cook_logs")
        .select("*", { count: "exact", head: true })
        .eq("recipe_id", recipeId);
      if (countErr) throw countErr;
      const newCount = count || 0;
      const { error: updErr } = await supabase
        .from("recipes")
        .update({ cook_count: newCount })
        .eq("id", recipeId);
      if (updErr) throw updErr;
      setRecipes(rs => rs.map(r => r.id === recipeId ? { ...r, cook_count: newCount } : r));
    } catch(e) {
      console.error("handleLogDeleted error", e);
      toast.error("Couldn't sync cook count. Reload to refresh.");
    }
  }

  function viewRecipe(id) { setActiveRecipeId(id); setView("recipe"); }
  function handleBack() { setActiveRecipeId(null); setView("home"); }

  const activeRecipe = recipes.find(r => r.id === activeRecipeId);
  const isCooking = view === "cooking" && activeRecipe;

  const canOverwrite = useMemo(() => {
    if (!duplicateData?._originalId) return false;
    const orig = recipes.find(r => r.id === duplicateData._originalId);
    return !!(orig && orig.user_id === session?.user?.id && !orig.is_public);
  }, [duplicateData, recipes, session?.user?.id]);

  const handleOverwrite = canOverwrite
    ? (updates) => overwriteRecipe(recipes.find(r => r.id === duplicateData._originalId), updates)
    : null;

  if (authLoading || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-inner">
          <p className="loading-emoji">🫙</p>
          <p className="loading-text">Loading your Larder…</p>
        </div>
      </div>
    );
  }

  if (isRecovery) return <ResetPassword onDone={() => setIsRecovery(false)} />;
  if (!session) return <Login />;

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
              <div style={{ position: "relative" }} ref={addMenuRef}>
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
                className={"nav-btn" + (view === n.key || (n.key === "home" && view === "recipe") || (n.key === "profile" && ["collections", "history"].includes(view)) ? " active" : "")}
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
            checkCredits={checkCredits}
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
            session={session}
            checkCredits={checkCredits}
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
              onSavePrices={savePrices}
              onSaveTicked={saveTicked}
              onUpdateItems={updateShoppingListItems}
              checkCredits={checkCredits}
            />
          ) : (
            <ShoppingListView
              recipes={recipes}
              pantryItems={pantryItems}
              onSaveList={saveShoppingList}
              savedList={savedShoppingList}
              onClearList={() => { clearShoppingList(); setConsolidatedList(null); setCrossedOff({}); setSelectedRecipes([]); }}
              selectedRecipes={selectedRecipes}
              setSelectedRecipes={setSelectedRecipes}
              consolidated={consolidatedList}
              setConsolidated={setConsolidatedList}
              crossedOff={crossedOff}
              setCrossedOff={setCrossedOff}
              checkCredits={checkCredits}
            />
          )
        ) : view === "history" ? (
          <CookHistoryView recipes={recipes} onLogDeleted={handleLogDeleted} />
        ) : view === "browse" ? (
          <BrowseView session={session} onAdd={addRecipe} ownRecipeIds={recipes.map(r => r.id)} />
        ) : view === "plan" ? (
          <MealPlanView
            mealPlans={mealPlans}
            recipes={recipes}
            onAddPlan={addMealPlan}
            onRemovePlan={removeMealPlan}
            onClearWeek={clearWeekPlans}
            onViewRecipe={viewRecipe}
            onPlanToShopping={(recipeIds) => { setSelectedRecipes(recipeIds); setView("shopping"); }}
          />
        ) : view === "profile" ? (
          <ProfileView
            session={session}
            onSignOut={() => supabase.auth.signOut()}
            onNavigate={(target, id) => { if (target === "recipe" && id) { setActiveRecipeId(id); setView("recipe"); } else { setView(target); } }}
            recipes={recipes}
            collections={collections}
          />
        ) : view === "pantry" ? (
          <PantryView
            pantryItems={pantryItems}
            onUpdatePantry={updatePantry}
            onSavePrices={savePrices}
            session={session}
            checkCredits={checkCredits}
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
            onBrowse={() => setView("browse")}
            onOpenAdd={() => setShowAdd(true)}
            onOpenGenerate={() => setShowGenerate(true)}
            onOpenImport={() => setShowImport(true)}
          />
        )}
      </div>

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onAdd={addRecipe} checkCredits={checkCredits} />}
      {showAdd && <AddRecipeModal onClose={() => { setShowAdd(false); setDuplicateData(null); }} onAdd={addRecipe} initialData={duplicateData} onOverwrite={handleOverwrite} />}
      {showImport && <ImportRecipeModal onClose={() => setShowImport(false)} onAdd={addRecipe} checkCredits={checkCredits} />}
      <ToastHost />
    </div>
  );
}
