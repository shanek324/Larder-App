import { useMemo, useState, useEffect } from "react";
import { supabase } from "../supabase";
import RecipeCard from "../components/RecipeCard";
import TagFilterSheet from "../components/TagFilterSheet";
import Skeleton from "../components/Skeleton";

export default function HomeView({
  recipes,
  collections,
  onViewRecipe,
  search,
  setSearch,
  filterTag,
  setFilterTag,
  onBrowse,
  onOpenAdd,
  onOpenGenerate,
  onOpenImport,
  resumeOffer,
  onAcceptResume,
  onDismissResume,
}) {
  const [todayPlanIds, setTodayPlanIds] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [showTagSheet, setShowTagSheet] = useState(false);
  const [loadingToday, setLoadingToday] = useState(true);

  const allTags = useMemo(() => {
    return [...new Set(
      recipes.flatMap(r => r.tags).map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    )].sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recipes.filter(r => {
      const matchSearch = !q
        || r.title.toLowerCase().includes(q)
        || r.description?.toLowerCase().includes(q)
        || r.tags.some(t => t.toLowerCase().includes(q));
      const matchTag = !filterTag || r.tags.includes(filterTag);
      return matchSearch && matchTag;
    });
  }, [recipes, search, filterTag]);

  const recent = useMemo(
    () => [...recipes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3),
    [recipes]
  );

  const showingAll = !search && !filterTag;
  const isFirstRun = recipes.length === 0;

  // Today's planned meals + low-stock pantry — only fetched on the home screen
  useEffect(() => {
    let cancelled = false;
    async function loadTodayContext() {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const iso = `${y}-${m}-${d}`;

      const [planRes, pantryRes] = await Promise.all([
        supabase.from("meal_plans").select("recipe_id").eq("date", iso),
        supabase.from("pantry").select("name").eq("stock_level", "low").limit(5),
      ]);

      if (cancelled) return;

      if (planRes.data) setTodayPlanIds(planRes.data.map(p => p.recipe_id));
      if (pantryRes.data) setLowStock(pantryRes.data.map(p => p.name));
      setLoadingToday(false);
    }
    if (!isFirstRun) {
      loadTodayContext();
    } else {
      setLoadingToday(false);
    }
    return () => { cancelled = true; };
  }, [isFirstRun]);

  // Derive todayPlans from the fetched ids + current recipes, so edits to
  // recipes don't refetch but DO update the displayed list.
  const todayPlans = useMemo(
    () => recipes.filter(r => todayPlanIds.includes(r.id)),
    [recipes, todayPlanIds]
  );

  const hasTodayContext = todayPlans.length > 0 || lowStock.length > 0;

  // ============================================================
  // FIRST-RUN STATE — no recipes yet
  // ============================================================
  if (isFirstRun) {
    return (
      <div className="home-firstrun">
        <div className="home-firstrun-hero">
          <p className="home-hero-eyebrow">Welcome</p>
          <h1 className="home-hero-title">Your Larder<br />starts here</h1>
          <p className="home-firstrun-subtitle">
            Add your first recipe — type it in, generate one with AI, or import from a URL.
          </p>
        </div>

        <div className="home-firstrun-tiles">
          <button onClick={onOpenAdd} className="home-firstrun-tile">
            <span className="home-firstrun-tile-emoji">✏️</span>
            <span className="home-firstrun-tile-title">Add manually</span>
            <span className="home-firstrun-tile-sub">Type a recipe you already know</span>
          </button>
          <button onClick={onOpenGenerate} className="home-firstrun-tile home-firstrun-tile-featured">
            <span className="home-firstrun-tile-emoji">✦</span>
            <span className="home-firstrun-tile-title">Generate with AI</span>
            <span className="home-firstrun-tile-sub">Describe a dish — get a full recipe</span>
          </button>
          <button onClick={onOpenImport} className="home-firstrun-tile">
            <span className="home-firstrun-tile-emoji">🔗</span>
            <span className="home-firstrun-tile-title">Import from URL</span>
            <span className="home-firstrun-tile-sub">Paste a link from any recipe site</span>
          </button>
        </div>

        <button onClick={onBrowse} className="home-firstrun-browse">
          <span>🌍 Or browse community recipes</span>
          <span className="browse-banner-arrow">›</span>
        </button>
      </div>
    );
  }

  // ============================================================
  // RETURNING USER
  // ============================================================
  return (
    <>
      {resumeOffer && (
        <div className="home-resume-banner">
          <div className="home-resume-banner-body">
            <span className="home-resume-banner-emoji" aria-hidden="true">🍳</span>
            <div className="home-resume-banner-text">
              <p className="home-resume-banner-label">Resume cooking</p>
              <p className="home-resume-banner-title">{resumeOffer.recipe.title}</p>
            </div>
          </div>
          <div className="home-resume-banner-actions">
            <button onClick={onAcceptResume} className="btn btn-gold">Resume</button>
            <button onClick={onDismissResume} className="btn btn-outline" aria-label="Dismiss resume cooking">Dismiss</button>
          </div>
        </div>
      )}
      {showingAll && loadingToday && !hasTodayContext && (
        <div className="home-today">
          <div className="home-today-block">
            <Skeleton width="60px" height="11px" style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height="18px" />
          </div>
        </div>
      )}

      {showingAll && !loadingToday && !hasTodayContext && (
        <div className="home-today">
          <div className="home-today-block">
            <p className="home-today-label">Today</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted-dark)", margin: 0 }}>
              No meal planned. What are you cooking?
            </p>
          </div>
        </div>
      )}

      {showingAll && hasTodayContext && (
        <div className="home-today">
          {todayPlans.length > 0 && (
            <div className="home-today-block">
              <p className="home-today-label">Tonight</p>
              {todayPlans.map(r => (
                <button
                  key={r.id}
                  onClick={() => onViewRecipe(r.id)}
                  className="home-today-recipe"
                >
                  <span className="home-today-recipe-title">{r.title}</span>
                  <span className="home-today-recipe-meta">⏱ {r.prepTime} · 🔥 {r.cookTime}</span>
                </button>
              ))}
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="home-today-block home-today-lowstock">
              <p className="home-today-label">Running low</p>
              <p className="home-today-lowstock-items">{lowStock.join(" · ")}</p>
            </div>
          )}
        </div>
      )}

      <div className="home-search-row">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes…" aria-label="Search recipes…"
          className="input home-search-input"
        />
        <button
          onClick={() => setShowTagSheet(true)}
          className={"home-tag-trigger" + (filterTag ? " active" : "")}
          aria-label="Filter by tag"
        >
          {filterTag ? (
            <>
              <span>🏷 {filterTag}</span>
              <span
                className="home-tag-trigger-x"
                onClick={e => { e.stopPropagation(); setFilterTag(null); }}
              >×</span>
            </>
          ) : (
            <span>🏷 Filter</span>
          )}
        </button>
      </div>

      {showingAll && recent.length > 0 && (
        <div className="home-section">
          <h2 className="section-title">Recently Added</h2>
          <div className="recipe-grid">
            {recent.map(r => (
              <RecipeCard key={r.id} recipe={r} collections={collections} onClick={() => onViewRecipe(r.id)} compact />
            ))}
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
            {(search || filterTag) && (
              <button
                onClick={() => { setSearch(""); setFilterTag(null); }}
                className="btn btn-secondary"
                style={{ marginTop: 12 }}
              >Clear filters</button>
            )}
          </div>
        ) : (
          <div className="recipe-grid">
            {filtered.map(r => (
              <RecipeCard key={r.id} recipe={r} collections={collections} onClick={() => onViewRecipe(r.id)} />
            ))}
          </div>
        )}
      </div>

      {showTagSheet && (
        <TagFilterSheet
          tags={allTags}
          value={filterTag}
          onChange={setFilterTag}
          onClose={() => setShowTagSheet(false)}
        />
      )}
    </>
  );
}
