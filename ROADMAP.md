# Larder App — Roadmap

## ✅ Completed

### Infrastructure
- Vite + React project setup on Chromebook Linux
- Modular file structure (components, views, constants, utils)
- GitHub repo at shanek324/Larder-App
- Deployed to Vercel at larder-app-omega.vercel.app
- Supabase database (recipes, collections, pantry tables)
- Auto-deploy on git push

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

### Security
- Add Supabase Row Level Security (RLS) so only you can access your data
- Auth — simple email/password login via Supabase Auth

### API Integration
- Move Claude API calls to a backend proxy (Vercel serverless function)
- This allows safe use of Anthropic API key without exposing it in the browser
- Enables AI Generate feature on the deployed app (currently Chromebook only)
- Enables AI recipe assistant on deployed app

### Database
- Shopping list persistence (currently resets on page reload)
- Recipe cook count tracking (how many times cooked)
- Recipe rating / favourites

---

## 💡 Future Ideas

### Features
- Meal planner (drag recipes onto a weekly calendar)
- Cost tracking (weekly spend based on selected recipes)
- Nutritional info (AI-generated approximate macros per recipe)
- Recipe import from URL (paste a link, AI extracts the recipe)
- Share a recipe via link
- Eve access — shared account or multi-user support
- Mobile PWA improvements (offline support, better mobile UI)

### Integrations
- Grocery delivery integration (add shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)

---

## 🔧 Known Issues / Technical Debt
- No RLS on Supabase tables (anyone with anon key can read/write)
- AI features (Generate, AI Assistant) only work locally due to API key exposure risk
- App is desktop-first — mobile UI could be improved
- No error handling UI (failures are silent)
