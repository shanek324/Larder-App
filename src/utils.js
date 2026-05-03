import { DUNNES_AISLES, API_MODEL } from "./constants";

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
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}
