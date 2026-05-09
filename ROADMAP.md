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
- Duplicate a recipe (appends "copy", resets cook count)
- Add recipe manually via form
- Import recipe from URL — Claude Sonnet extracts and formats via api/fetch-url.js proxy
- AI recipe generator (describe a dish, get a full recipe)
- AI recipe assistant per recipe (clickable suggestion chips)
- Recipe hero image — upload photo per recipe, stored in Supabase Storage (recipe-images bucket)
- Collections (group recipes into named sets with emoji)
- Pantry (track what you have in stock, grouped by aisle)
- Pantry quantity + unit per item (e.g. 500g, 2 each)
- Pantry stock levels — High/Medium/Low per item, colour coded
- Pantry cleanup via Claude Haiku (deduplicates and normalises messy entries)
- Shopping list — recipe picker with search and tag filter
- Last selected recipes remembered via localStorage
- Claude Haiku consolidates ingredients intelligently (combines duplicates, assigns aisles)
- Quantity editing on consolidated shopping list items
- Low stock alert banner in shopping list (shows pantry items marked Low)
- Shopping list persists immediately on generate — navigating away and back restores it
- Cross off items you already own before heading to shop
- "Go to Shop" saves final list and switches to in-shop mode
- Sub-breakdown under consolidated items (shows which recipes need each ingredient)
- In-shop mode — tick off items aisle by aisle, proper start-over modal
- Add bought items to pantry on shop completion
- Cooking mode — fullscreen dark UI, card-based step carousel with progress dots
- Tips from last cook shown as a card after ingredients, before step 1
- Ingredients card as first step, floating ingredients button during steps
- Per-step notes in cooking mode (saved to recipe)
- Step text auto-scales to fit card on any screen size
- Swipe gestures for cooking mode step navigation
- Post-cook review — 5 star rating + feedback text + recipe notes editing
- Cook log history — collapsible panel in review screen showing previous cooks (date, rating, feedback, AI tips)
- Cook history view — dedicated screen listing all past cooks across all recipes
- Claude Haiku generates tips from feedback, saved to cook_logs table
- Cook count tracked per recipe (shown on recipe detail)
- Pantry cleanup prompt after cooking (tick off what you used)
- Cooked it! button (tracks last cooked date without going through cooking mode)
- Responsive UI — all views adapt to mobile, nav icons-only on very small screens
- Receipt scanner — photograph supermarket receipt, Haiku extracts + normalises ingredient names
- Confirm screen — toggle off non-food items, edit names/prices/quantities/units
- Confirmed items saved to prices table (price per unit calculated) and added to pantry
- Recipe cost estimation — rolling average from prices table, shown on recipe detail and shopping list

### Data
- 24 sample recipes seeded into Supabase
- All recipes standardised to consistent format
- cook_count, step_notes, image_url columns on recipes table
- quantity, unit, price columns on pantry table
- prepared column on shopping_list table (tracks prep vs in-shop phase)
- cook_logs table for rating, feedback and AI tips history
- prices table — one row per purchase event, stores price_per_unit, quantity, unit, purchased_at
- Supabase Storage bucket: recipe-images (public, 5MB limit)

---

## 📋 Next Up

### Bigger Features
- Nutritional info — AI-generated approximate macros per recipe
- Share a recipe via link (public read-only view)
- Multi-user / household sharing (Eve + Shane see same library)
- Meal planner — drag recipes onto a weekly calendar, auto-generate shopping list for the week
- AI-generated recipe hero images (e.g. via Replicate or DALL-E)

---

## 💰 Business Model (If Productised)

### Monetisation Strategy
- **Free tier** — all manual features unlimited (add recipes, pantry, shopping list manual mode)
- AI actions on free tier gated behind a 30 second rewarded ad (YouTube-style)
- Ad revenue per AI action (~€0.04) covers API cost (~€0.02) on free tier
- Paid tiers remove ads and include AI action allowances:
  - **Starter €2.99/month** — 10 AI actions
  - **Regular €4.99/month** — 30 AI actions
  - **Power €9.99/month** — 100 AI actions

### What counts as an AI action
- Receipt scan, recipe generation, shopping list consolidation
- AI recipe chat message, cooking tips, pantry cleanup

### To productise
- Wrap in Capacitor for iOS/Android native app (~4-6 weeks)
- Or ship as PWA first (~2-3 days, easier but limited on iOS)
- Apple Developer account (€99/year) + Google Play (€25 one time)
- Implement action counter per user in Supabase
- Integrate rewarded ad SDK (e.g. AdMob) for free tier
- Privacy policy + terms of service required for App Store
- Stripe or RevenueCat for subscription billing

### Market differentiation
- Claude AI integration is unique vs Paprika, Mealime, Whisk
- Receipt scanning → price tracking → recipe cost estimation — nobody else has this
- Irish/Dunnes store awareness as local market advantage

## 💡 Future Ideas

### Features
- Offline support / PWA
- Dark mode
- Grocery delivery integration (send shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)

---

## 🔧 Known Issues / Technical Debt
- No error handling UI — API failures are mostly silent (just console.error)
- Shopping list generation can be slow with many recipes selected
- No loading skeleton UI — blank gaps while data loads
- Collections layout switches to horizontal scroll on mobile which could feel odd with many collections
- Receipt scanner untested in production — needs real receipt photo test
