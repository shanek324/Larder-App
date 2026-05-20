import { DUNNES_AISLES, API_MODEL } from "./constants";
import { supabase } from "./supabase";

export function categoriseIngredient(name) {
  const lower = name.toLowerCase();
  for (const aisle of DUNNES_AISLES) {
    if (aisle.keywords.some(k => lower.includes(k))) return aisle.name;
  }
  return "Other";
}

const STRIP_WORDS = new Set(["diced","sliced","cubed","chopped","minced","finely","roughly","coarsely","grated","peeled","deveined","crushed","softened","beaten","cooked","raw","dried","smoked","lean","reduced","extra","virgin","large","small","medium","whole","halved","rinsed","drained","trimmed","de-seeded","deseeded","optional","to","taste","serve","garnish"]);

export function consolidateName(name) {
  return name.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 1 && !STRIP_WORDS.has(w)).join(" ").trim();
}

export function matchesPantry(itemName, pantryItems) {
  const itemWords = itemName.split(" ");
  return pantryItems.some(p => {
    const pWords = consolidateName(p.name).split(" ");
    const overlap = itemWords.filter(w => w.length > 2 && pWords.includes(w));
    return overlap.length > 0 && overlap.length >= Math.min(itemWords.length, pWords.length);
  });
}

export function autoConsolidate(rawIngredients) {
  const merged = {};
  rawIngredients.forEach(ing => {
    const consolidated = consolidateName(ing.name);
    if (!consolidated) return;
    const key = "con-" + consolidated.replace(/\s+/g, "-");
    if (!merged[key]) {
      merged[key] = {
        key,
        name: consolidated.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        originals: [ing.name],
        amounts: ing.amount && !["to taste","to serve","to garnish","optional"].includes(ing.amount.toLowerCase()) ? [ing.amount] : [],
        aisle: categoriseIngredient(ing.name),
      };
    } else {
      if (!merged[key].originals.includes(ing.name)) merged[key].originals.push(ing.name);
      if (ing.amount && !merged[key].amounts.includes(ing.amount)) merged[key].amounts.push(ing.amount);
    }
  });
  return Object.values(merged);
}

export function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

export function scaleAmount(amountStr, ratio) {
  if (ratio === 1) return amountStr;
  const match = amountStr.match(/^([\d.\/]+)\s*(.*)/);
  if (!match) return amountStr;
  let num = match[1];
  const unit = match[2];
  if (num.includes("/")) {
    const parts = num.split("/");
    num = parseFloat(parts[0]) / parseFloat(parts[1]);
  } else {
    num = parseFloat(num);
  }
  if (isNaN(num)) return amountStr;
  const scaled = num * ratio;
  const formatted = scaled % 1 === 0 ? scaled.toString() : parseFloat(scaled.toFixed(2)).toString();
  return unit ? `${formatted}${unit}` : formatted;
}

export async function callClaude(messages, system = "", maxTokens = 1000, model = API_MODEL) {
  const body = { model: model, max_tokens: maxTokens, messages };
  if (system) body.system = system;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Claude API error");
  }
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

export async function loadPriceMap() {
  // Fetch recent prices once; return a map of consolidated-name → [{price, unit}].
  const { data, error } = await supabase
    .from("prices")
    .select("price_per_unit, unit, ingredient_name, purchased_at")
    .order("purchased_at", { ascending: false })
    .limit(500);
  if (error) return {};
  const priceMap = {};
  (data || []).forEach(r => {
    const key = consolidateName(r.ingredient_name);
    if (!key) return;
    if (!priceMap[key]) priceMap[key] = [];
    if (priceMap[key].length < 5) priceMap[key].push({ price: parseFloat(r.price_per_unit), unit: r.unit });
  });
  return priceMap;
}

export function computeRecipeCost(ingredients, priceMap) {
  // Pure synchronous compute against an already-loaded priceMap.
  // Each breakdown row exposes enough detail for the cost breakdown screen:
  //   { name, amount, key, estimate, avgPricePerUnit, qty, unit, sourceCount }
  // estimate is null when no priceMap entry exists for the normalised name.
  if (!priceMap) return { total: 0, breakdown: [], hasData: false };
  const breakdown = ingredients.map(ing => {
    const key = consolidateName(ing.name);
    const prices = priceMap[key];
    const amountMatch = ing.amount ? ing.amount.match(/^([\d.]+)/) : null;
    const qty = amountMatch ? parseFloat(amountMatch[1]) : 1;
    if (!prices || prices.length === 0) {
      return { name: ing.name, amount: ing.amount, key, estimate: null, qty };
    }
    const avg = prices.reduce((a, b) => a + b.price, 0) / prices.length;
    // Most-common unit across the past purchases (just first for now; refinement later).
    const unit = prices[0].unit || null;
    return {
      name: ing.name,
      amount: ing.amount,
      key,
      estimate: avg * qty,
      avgPricePerUnit: avg,
      qty,
      unit,
      sourceCount: prices.length,
    };
  });
  const known = breakdown.filter(b => b.estimate !== null);
  const total = known.reduce((sum, b) => sum + b.estimate, 0);
  return { total, breakdown, hasData: known.length > 0 };
}

export async function estimateRecipeCost(ingredients) {
  // Single batched query: pull recent prices once, match against consolidated names in JS.
  const { data } = await supabase
    .from("prices")
    .select("price_per_unit, unit, ingredient_name, purchased_at")
    .order("purchased_at", { ascending: false })
    .limit(500);

  const priceMap = {};
  (data || []).forEach(r => {
    const key = consolidateName(r.ingredient_name);
    if (!key) return;
    if (!priceMap[key]) priceMap[key] = [];
    if (priceMap[key].length < 5) priceMap[key].push({ price: parseFloat(r.price_per_unit), unit: r.unit });
  });

  const breakdown = ingredients.map(ing => {
    const key = consolidateName(ing.name);
    const prices = priceMap[key];
    if (!prices || prices.length === 0) return { name: ing.name, estimate: null };
    const avg = prices.reduce((a, b) => a + b.price, 0) / prices.length;
    const amountMatch = ing.amount ? ing.amount.match(/^([\d.]+)/) : null;
    const qty = amountMatch ? parseFloat(amountMatch[1]) : 1;
    return { name: ing.name, estimate: avg * qty };
  });

  const known = breakdown.filter(b => b.estimate !== null);
  const total = known.reduce((sum, b) => sum + b.estimate, 0);
  return { total, breakdown, hasData: known.length > 0 };
}


// Schema guards for AI-generated JSON. Throw on malformed shape so we can
// catch and toast instead of silently writing garbage to Supabase.
export function validateRecipeShape(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Recipe response is not an object");
  if (typeof obj.title !== "string" || !obj.title.trim()) throw new Error("Recipe needs a title");
  if (!Array.isArray(obj.ingredients)) throw new Error("Recipe ingredients must be an array");
  if (!Array.isArray(obj.method)) throw new Error("Recipe method must be an array");
  // Normalise: coerce missing-but-optional fields to sane defaults.
  return {
    title: obj.title.trim(),
    description: typeof obj.description === "string" ? obj.description : "",
    prepTime: typeof obj.prepTime === "string" ? obj.prepTime : "",
    cookTime: typeof obj.cookTime === "string" ? obj.cookTime : "",
    servings: Number.isFinite(Number(obj.servings)) ? Number(obj.servings) : 4,
    tags: Array.isArray(obj.tags) ? obj.tags.filter(t => typeof t === "string") : [],
    ingredients: obj.ingredients
      .filter(i => i && typeof i === "object" && typeof i.name === "string" && i.name.trim())
      .map(i => ({ name: i.name.trim(), amount: typeof i.amount === "string" ? i.amount : "" })),
    method: obj.method.filter(s => typeof s === "string" && s.trim()).map(s => s.trim()),
    notes: typeof obj.notes === "string" ? obj.notes : "",
  };
}

export function validatePantrySuggestions(arr) {
  if (!Array.isArray(arr)) throw new Error("Pantry suggestions response is not an array");
  return arr
    .filter(s => s && typeof s === "object" && typeof s.pantryName === "string")
    .map(s => ({
      pantryName: s.pantryName.trim(),
      usedAmount: (typeof s.usedAmount === "number" && Number.isFinite(s.usedAmount)) ? s.usedAmount : null,
      usedUnit: typeof s.usedUnit === "string" ? s.usedUnit : null,
      fullyUsed: Boolean(s.fullyUsed),
    }));
}


// Shape conversion: Supabase row → app-shaped recipe object.
// Mirrored counterpart `recipeToDb` lives in App.jsx (depends on session/state-ish concerns).
// Exported so BrowseView and any other view can use a single source of truth.
export function recipeFromDb(r) {
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
    is_public: r.is_public || false,
    is_approved: r.is_approved || false,
    user_id: r.user_id || null,
  };
}
