# Larder App — Roadmap

## ✅ Completed

### Infrastructure
- Vite + React project setup on Chromebook Linux
- Modular file structure (components, views, constants, utils)
- GitHub repo at shanek324/Larder-App
- Deployed to Vercel at larder-app-omega.vercel.app
- Supabase database (recipes, collections, pantry tables)
- Auto-deploy on git push
- Supabase Row Level Security (RLS) — data locked per user
- Supabase Auth — email/password login and logout
- Claude API proxy via Vercel serverless function
- AI features (Generate, Assistant) working on deployed app
- Anthropic API key safely server-side

### App Features
- Recipe library with search and tag filtering
- Recipe detail view with ingredients and method
- Serving scaler (scale any recipe up or down)
- Edit and delete recipes
- Add recipe manually via form
- Collections (group recipes into named sets)
- Pantry (track what you have in stock)
- Shopping list (select recipes, auto-consolidate ingredients, organised by Dunnes aisle order)
- Finalise list flow (tick what you have, optionally save to pantry)
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

### Features
- Shopping list persistence (currently resets on page reload)
- Recipe cook count tracking (how many times cooked)
- Recipe rating / favourites
- Cooking mode — fullscreen step-by-step view with large text, tap to advance, timers per step
- Step annotations — add notes to individual steps while cooking (e.g. "added extra garlic", "kept in pan")
- Merge annotations back into recipe via Claude ("Update recipe from my notes")

### Technical
- CSS refactor — move inline styles to stylesheet for easier theming and global style changes

---

## 💡 Future Ideas

### Features
- Meal planner (drag recipes onto a weekly calendar)
- Recipe cost calculator (estimate cost per meal based on ingredient prices)
- Receipt scanning — photograph a Dunnes/Tesco receipt, Claude extracts items and prices, update pantry and attach prices to ingredients
- Nutritional info (AI-generated approximate macros per recipe)
- Recipe import from URL (paste a link, AI extracts the recipe)
- Share a recipe via link
- Eve access — shared account or multi-user support
- Mobile PWA improvements (offline support, better mobile UI)

### Integrations
- Grocery delivery integration (add shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)
- Dunnes price scraping (long term, complex — receipt scanning preferred approach)

---

## 🔧 Known Issues / Technical Debt
- App is desktop-first — mobile UI could be improved
- No error handling UI (failures are silent)
- Styles are inline in JSX — hard to do global theme changes (CSS refactor planned)
