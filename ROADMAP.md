# Larder App — Roadmap

## ✅ Completed

### Infrastructure
- Vite + React project setup on Chromebook Linux
- Modular file structure (components, views, constants, utils)
- GitHub repo at shanek324/Larder-App
- Deployed to Vercel at larder-app-omega.vercel.app
- Supabase database (recipes, collections, pantry, shopping_list, cook_logs, prices tables)
- Auto-deploy on git push
- Supabase Row Level Security (RLS) — data locked per user
- Supabase Auth — email/password login and logout (Shane + Eve accounts)
- Claude API proxy via Vercel serverless function (api/claude.js)
- Anthropic API key safely server-side
- Haiku for mechanical tasks, Sonnet for creative tasks
- Full CSS refactor — design tokens, CSS variables, no inline styles, duplicate sections removed, ~1400 lines

### App Features
- Recipe library with search and tag filtering
- Recipe detail view with ingredients and method
- Serving scaler (scale any recipe up or down)
- Edit and delete recipes
- Add recipe manually via form
- AI recipe generator (describe a dish, get a full recipe)
- AI recipe assistant per recipe (clickable suggestion chips)
- Collections (group recipes into named sets with emoji)
- Pantry (track what you have in stock, grouped by aisle)
- Pantry quantity + unit per item (e.g. 500g, 2 each)
- Pantry cleanup via Claude Haiku (deduplicates and normalises messy entries)
- Shopping list — recipe picker with search and tag filter
- Claude Haiku consolidates ingredients intelligently (combines duplicates, assigns aisles)
- Shopping list persists immediately on generate — navigating away and back restores it
- Cross off items you already own before heading to shop
- "Go to Shop" saves final list and switches to in-shop mode
- Sub-breakdown under consolidated items (shows which recipes need each ingredient)
- In-shop mode — tick off items aisle by aisle, start over button
- Add bought items to pantry on shop completion
- Cooking mode — fullscreen dark UI, card-based step carousel with progress dots
- Ingredients card as first step, floating ingredients button during steps
- Per-step notes in cooking mode (saved to recipe)
- Post-cook review — 5 star rating + feedback text
- Cook log history — collapsible panel in review screen showing previous cooks (date, rating, feedback, AI tips)
- Claude Haiku generates tips from feedback, saved to cook_logs table
- Cook count tracked per recipe (shown on recipe detail)
- Pantry cleanup prompt after cooking (tick off what you used)
- Cooked it! button (tracks last cooked date without going through cooking mode)
- Responsive UI — all views adapt to mobile, nav icons-only on very small screens
- Receipt scanner — photograph supermarket receipt, Haiku extracts + normalises ingredient names
- Confirm screen — toggle off non-food items, edit names/prices/quantities/units
- Confirmed items saved to prices table (price per unit calculated) and added to pantry

### Data
- 24 sample recipes seeded into Supabase
- All recipes standardised to consistent format
- cook_count, step_notes columns on recipes table
- quantity, unit, price columns on pantry table
- prepared column on shopping_list table (tracks prep vs in-shop phase)
- cook_logs table for rating, feedback and AI tips history
- prices table — one row per purchase event, stores price_per_unit, quantity, unit, purchased_at

---

## 📋 Next Up

### Recipe Cost Estimation ✅
- getPriceEstimate() helper — queries last 5 prices per ingredient, returns rolling average
- estimateRecipeCost() — sums across all ingredients with known prices
- Recipe detail shows estimated total cost + coverage (e.g. 6/12 items) in meta row
- Shopping list subtitle shows estimated total when recipes selected
- Cost scales with serving scaler on recipe detail

### Recipe Improvements
- Import recipe from URL — paste a link, Claude extracts and formats the recipe
- Duplicate a recipe — useful as a starting point for variations
- Recipe image — upload or AI-generate a hero image per recipe

### Cook Log Improvements
- Surface previous cook tips contextually on the relevant step during cooking mode
  (e.g. at step 3, show "last time you noted: sauce was too thick")
- Cook history view — dedicated screen listing all past cooks across all recipes

### Shopping List Improvements
- Remember last selected recipes so list can be quickly rebuilt
- Quantity editing — adjust amounts per item before going to shop
- Low stock alert — pantry items with low quantity auto-suggested when building shopping list

### Mobile Polish
- Cooking mode step text size auto-scales to fill card on phone
- Swipe gestures for cooking mode step navigation

---

## 💡 Future Ideas

### Features
- Meal planner — drag recipes onto a weekly calendar, auto-generate shopping list for the week
- Recipe cost calculator — estimate cost per meal based on pantry price data
- Receipt scanning — photograph a receipt, Claude extracts items and prices, updates pantry
- Nutritional info — AI-generated approximate macros per recipe
- Share a recipe via link (public read-only view)
- Multi-user / household sharing (Eve + Shane see same library)
- Offline support / PWA
- Dark mode

### Integrations
- Grocery delivery integration (send shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)

---

## 🔧 Known Issues / Technical Debt
- No error handling UI — API failures are mostly silent (just console.error)
- Shopping list generation can be slow with many recipes selected
- Cook tips from previous sessions not yet shown on relevant cooking steps (only in review screen)
- No loading skeleton UI — blank gaps while data loads
- Collections layout switches to horizontal scroll on mobile which could feel odd with many collections
- InShopView uses window.confirm for start-over — should be a proper modal
- Receipt scanner untested in production — needs real receipt photo test
