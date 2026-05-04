# Larder App — Roadmap

## ✅ Completed

### Infrastructure
- Vite + React project setup on Chromebook Linux
- Modular file structure (components, views, constants, utils)
- GitHub repo at shanek324/Larder-App
- Deployed to Vercel at larder-app-omega.vercel.app
- Supabase database (recipes, collections, pantry, shopping_list tables)
- Auto-deploy on git push
- Supabase Row Level Security (RLS) — data locked per user
- Supabase Auth — email/password login and logout
- Claude API proxy via Vercel serverless function
- AI features (Generate, Assistant) working on deployed app
- Anthropic API key safely server-side
- Haiku model for mechanical tasks, Sonnet for creative tasks

### App Features
- Recipe library with search and tag filtering
- Recipe detail view with ingredients and method
- Serving scaler (scale any recipe up or down)
- Edit and delete recipes
- Add recipe manually via form
- Collections (group recipes into named sets)
- Pantry (track what you have in stock)
- Pantry cleanup via Claude (deduplicates messy entries)
- Shopping list — select recipes, Claude consolidates ingredients intelligently
- Cross off items you already have before finalising
- Finalise list saves to Supabase (persists across sessions)
- In-shop mode — tick off items as you shop, add bought items to pantry on completion
- AI recipe assistant per recipe (ask questions, request modifications)
- AI recipe generator (describe a dish, get a full recipe)
- Cooked it! button (tracks last cooked date)
- Standardised recipe format with format spec comment in constants.js

### Data
- 24 sample recipes seeded into Supabase
- All recipes standardised to consistent format
- Recipe format standard documented in constants.js

---

## 📋 Next Up

### Cooking Mode (major feature)
- Trigger from recipe detail view
- Card-based step-by-step view, near fullscreen
- Carousel navigation — swipe or tap through steps
- Smooth rolodex-style transition animation between cards
- Add notes to individual steps while cooking
- End of cooking flow:
  - Mark as cooked (increment cook count)
  - 5-star rating
  - Free text feedback (e.g. "needed more flavour")
  - Claude generates closing tips from feedback
  - Tips appear as contextual notes on relevant steps next time
  - Option to remove used-up items from pantry

### Pantry Improvements
- Stock level per item — High / Medium / Low
- Future hook: low stock items auto-added to shopping list

### Mobile / Responsive UI
- Full responsive design for all screen sizes
- Nav bar always accessible on phone
- Nothing cut off on small screens
- CSS refactor — move inline styles to stylesheet

---

## 💡 Future Ideas

### Features
- Meal planner (drag recipes onto a weekly calendar)
- Recipe cost calculator (estimate cost per meal based on ingredient prices)
- Receipt scanning — photograph a receipt, Claude extracts items and prices, update pantry and attach prices to ingredients
- Low stock pantry reminders — auto-add to shopping list
- Nutritional info (AI-generated approximate macros per recipe)
- Recipe import from URL (paste a link, AI extracts the recipe)
- Share a recipe via link
- Eve access — shared account or multi-user support
- Mobile PWA improvements (offline support)

### Integrations
- Grocery delivery integration (add shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)
- Dunnes price scraping (long term, complex — receipt scanning preferred approach)

---

## 🔧 Known Issues / Technical Debt
- App is desktop-first — mobile UI needs full responsive overhaul (planned)
- No error handling UI (failures are silent)
- Styles are inline in JSX — hard to do global theme changes (CSS refactor planned)
