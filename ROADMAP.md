# Larder App — Roadmap

## ✅ Completed

### Infrastructure
- Vite + React project setup on Chromebook Linux
- Modular file structure (components, views, constants, utils)
- GitHub repo at shanek324/Larder-App
- Deployed to Vercel at larder-app-omega.vercel.app
- Supabase database (recipes, collections, pantry, shopping_list, cook_logs tables)
- Auto-deploy on git push
- Supabase Row Level Security (RLS) — data locked per user
- Supabase Auth — email/password login and logout (Shane + Eve accounts)
- Claude API proxy via Vercel serverless function (api/claude.js)
- Anthropic API key safely server-side
- Haiku for mechanical tasks, Sonnet for creative tasks
- Full CSS refactor — design tokens, CSS variables, no inline styles

### App Features
- Recipe library with search and tag filtering
- Recipe detail view with ingredients and method
- Serving scaler (scale any recipe up or down)
- Edit and delete recipes
- Add recipe manually via form (fixed — was broken)
- Collections (group recipes into named sets)
- Pantry (track what you have in stock)
- Pantry cleanup via Claude Haiku (deduplicates messy entries)
- Shopping list — card grid with search and tag filter for recipe selection
- Claude Haiku consolidates ingredients intelligently (combines duplicates)
- Cross off items you already have before finalising
- Finalise list saves to Supabase (persists across sessions)
- In-shop mode — tick off items as you shop, start over button, add bought items to pantry on completion
- Cooking mode — fullscreen dark UI, card-based step carousel with progress dots
- Ingredients card as first step in cooking mode
- Floating ingredients button during cooking
- Per-step notes in cooking mode
- Post-cook review — 5 star rating + feedback
- Claude Haiku generates tips from feedback
- Tips saved to cook_logs table
- Cook count tracked per recipe (shown on recipe cards)
- Pantry cleanup prompt after cooking
- AI recipe assistant per recipe (clickable suggestion chips)
- AI recipe generator (describe a dish, get a full recipe)
- Cooked it! button (tracks last cooked date)

### Data
- 24 sample recipes seeded into Supabase
- All recipes standardised to consistent format
- cook_count and step_notes columns on recipes table
- cook_logs table for rating, feedback and AI tips history

---

## 📋 Next Up

### Mobile / Responsive UI
- Full responsive design for all screen sizes
- Nav bar always accessible and readable on phone
- Cooking mode optimised for phone use (big tap targets)
- Recipe detail layout stacks on mobile (currently side by side)

### Pantry Improvements
- Stock level per item — High / Medium / Low
- Future hook: low stock items auto-added to shopping list

### Cook Log / History
- View past cook sessions for a recipe (date, rating, tips)
- See AI tips from previous cooks shown contextually on relevant steps during cooking mode
- Recipe improvement over time — "last time you said X, try Y at step 3"

### Recipe Improvements
- Import recipe from URL (paste a link, Claude extracts the recipe)
- Duplicate a recipe (useful as a starting point for variations)
- Recipe cost estimate (based on pantry price data if available)

### Shopping List Improvements
- Show sub-breakdown under consolidated items (e.g. "4 chicken breasts — from Pasta Bake + Stir Fry")
- Remember last selected recipes so list rebuilds on return

---

## 💡 Future Ideas

### Features
- Meal planner (drag recipes onto a weekly calendar, auto-generate shopping list for the week)
- Recipe cost calculator (estimate cost per meal)
- Receipt scanning — photograph a receipt, Claude extracts items and prices, update pantry
- Low stock pantry reminders — auto-add to shopping list
- Nutritional info (AI-generated approximate macros per recipe)
- Share a recipe via link
- Eve access — shared library or multi-user support
- Offline support / PWA
- Dark mode

### Integrations
- Grocery delivery integration (send shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)

---

## 🔧 Known Issues / Technical Debt
- Mobile UI needs full responsive overhaul (in progress)
- No error handling UI (failures are silent to the user)
- Shopping list generation can be slow with many recipes selected (Claude call)
- Cook tips from previous sessions not yet surfaced during cooking mode
- FinaliseModal.jsx was duplicate/dead code — cleaned up
