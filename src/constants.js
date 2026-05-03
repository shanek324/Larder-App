/**
 * LARDER RECIPE FORMAT STANDARD
 * All recipes must follow this structure exactly.
 *
 * id:          slugified-title + "-" + timestamp e.g. "chicken-tacos-1714000000000"
 * title:       Title Case
 * description: 1-2 sentences. Include cost + portions e.g. "About €10 for 4 portions."
 * tags:        Array from approved list: Baking, Dessert, Portuguese, Dinner, Quick,
 *              Vegetarian, Fish, Chicken, Pasta, Italian, Breakfast, Soup
 * servings:    Number
 * prepTime:    "X min" format always
 * cookTime:    "X min" format always
 * ingredients: [{ name: "Ingredient, descriptor", amount: "metric amount" }]
 *              - name in Title Case, descriptor after comma e.g. "Chicken breast, diced"
 *              - amount always metric: g, ml, kg, tsp, tbsp, handful, "to taste", "to serve"
 * method:      Array of strings, each a complete sentence or logical step
 * notes:       1-2 practical tips. Optional but preferred.
 * createdAt:   Date.now()
 */


export const API_MODEL = "claude-sonnet-4-5";

export const DUNNES_AISLES = [
  { name: "Fresh Produce", icon: "🥦", keywords: ["spinach","lettuce","onion","garlic","pepper","tomato","lemon","lime","cucumber","broccoli","mushroom","spring onion","coriander","parsley","ginger","potato","carrot","courgette","herb","tenderstem","fresh chilli","avocado","bean sprout"] },
  { name: "Dairy & Eggs", icon: "🧀", keywords: ["egg","milk","cream","butter","cheese","mozzarella","cheddar","parmesan","halloumi","burrata","yogurt","crème fraîche","sour cream","flora"] },
  { name: "Meat & Fish", icon: "🥩", keywords: ["chicken","beef","mince","chorizo","bacon","prawn","calamari","fish","salmon","sea bass","pork","lamb","steak","sausage"] },
  { name: "Fresh Pasta & Chilled", icon: "🍝", keywords: ["gnocchi","fresh pasta","fresh noodle","tortilla","flatbread","naan","brioche","puff pastry"] },
  { name: "Dry Goods & Pasta", icon: "🫙", keywords: ["pasta","spaghetti","penne","rigatoni","fusilli","orzo","rice","noodle","flour","sugar","oat","lentil","bean","chickpea","tin","tinned","passata","stock","breadcrumb","tortilla chip","doritos","bun"] },
  { name: "Condiments & Sauces", icon: "🧴", keywords: ["soy sauce","honey","tomato purée","tomato paste","ketchup","mustard","bbq sauce","harissa","pesto","chipotle","hot sauce","peri-peri","salsa","mayo","mayonnaise","worcestershire","balsamic","vinegar","oil","sesame oil","chilli oil","vodka","cream","single cream","double cream"] },
  { name: "Spices & Baking", icon: "🫙", keywords: ["paprika","cumin","cajun","oregano","cinnamon","vanilla","chilli","pepper","salt","seasoning","five spice","italian seasoning","garlic granule","onion granule","sugar","flour","baking"] },
];

export const TAG_COLORS = {
  default: { bg: "#f0ebe3", text: "#5c4a2a" },
  Baking: { bg: "#fde8d0", text: "#b84800" },
  Dessert: { bg: "#fce4ec", text: "#880e4f" },
  Portuguese: { bg: "#e8f4ea", text: "#2e7d32" },
  Dinner: { bg: "#e3f2fd", text: "#1565c0" },
  Quick: { bg: "#f3e5f5", text: "#6a1b9a" },
  Vegetarian: { bg: "#e8f5e9", text: "#1b5e20" },
  Fish: { bg: "#e0f7fa", text: "#00695c" },
  Chicken: { bg: "#fff3e0", text: "#e65100" },
  Pasta: { bg: "#fff8e1", text: "#f57f17" },
  Italian: { bg: "#fce8e8", text: "#b71c1c" },
  Breakfast: { bg: "#f9fbe7", text: "#558b2f" },
  Soup: { bg: "#e8eaf6", text: "#283593" },
};
