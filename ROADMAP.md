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
- Supabase Auth — email/password login and logout + public sign up flow
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
- Add Recipe consolidated dropdown — manual, AI generate, import URL in one button
- Recipe hero image — upload photo per recipe, stored in Supabase Storage (recipe-images bucket)
- Collections (group recipes into named sets with emoji)
- Pantry (track what you have in stock, grouped by aisle)
- Pantry tap-to-edit modal — name, quantity, standardised unit dropdown, aisle, stock level
- Pantry stock levels — High/Medium/Low per item, colour coded
- Pantry cleanup via Claude Haiku (deduplicates and normalises messy entries)
- Shopping list — recipe picker with search and tag filter
- Last selected recipes remembered via localStorage
- Claude Haiku consolidates ingredients intelligently (combines duplicates, assigns aisles)
- Quantity editing on consolidated shopping list items
- Sub-breakdown under consolidated items — tap to see source recipes and original amounts
- Low stock alert banner in shopping list (shows pantry items marked Low)
- Shopping list persists immediately on generate — navigating away and back restores it
- Resume saved shopping list banner — persists between sessions via Supabase
- Cross off items you already own before heading to shop
- "Go to Shop" saves final list and switches to in-shop mode
- In-shop mode — tick off items aisle by aisle, proper start-over modal
- Receipt scanner at end of shopping mode
- Add bought items to pantry on shop completion
- Cooking mode — fullscreen dark UI, card-based step carousel with progress dots
- Tips from last cook shown as a card after ingredients, before step 1
- Ingredients card as first step, floating ingredients button during steps
- Per-step notes in cooking mode (saved to recipe)
- Step text auto-scales to fit card on any screen size
- Swipe gestures for cooking mode step navigation
- Post-cook review — 5 star rating + feedback text + recipe notes editing
- Back button on cook review screen
- Cook log history — collapsible panel in review screen showing previous cooks (date, rating, feedback, AI tips)
- Cook history view — dedicated screen listing all past cooks across all recipes, with delete per entry
- Claude Haiku generates tips from feedback, saved to cook_logs table
- Cook count tracked per recipe (shown on recipe detail)
- Pantry cleanup prompt after cooking (tick off what you used)
- Responsive UI — all views adapt to mobile, nav icons-only on very small screens
- Security: auth-gate on /api/claude and /api/fetch-url — requires valid Supabase JWT, credits checked server-side
- Security: /api/fetch-url blocks private/internal IP ranges (SSRF prevention)
- Security: Browse view only fetches profiles for users with public recipes
- Fix: edited shopping list amounts now saved immediately to Supabase
- Fix: cost estimate resets when navigating between recipes, race condition guarded
- Fix: all pantry IDs use crypto.randomUUID() — no collision risk
- Fix: step notes keyed by method index not absolute step index — no misalignment with tips card
- Fix: cooking mode font resize runs only on step change, not every render
- Fix: pantry suggestions triggered in useEffect not during render
- Fix: GenerateModal now checks AI credits before generating
- Fix: swipe in cooking mode ignores vertical scroll gestures
- Fix: camera retake has proper error handling
- Fix: Resume shopping list restores selected recipes
- Fix: manual shopping list items get proper aisle categorisation
- Fix: combined auth and data loading states — no blank screen flash
- Cleanup: removed dead onCookedIt prop from RecipeView
- Cleanup: removed dead localStorage write for lastSelectedRecipes
- Receipt scanner — photograph supermarket receipt, Haiku extracts + normalises ingredient names
- Confirm screen — toggle off non-food items, edit names/prices/quantities, aisle editable
- Confirmed items saved to prices table (price per unit calculated) and added to pantry
- Recipe cost estimation — rolling average from prices table, shown on recipe detail and shopping list
- Public recipes — is_public flag + RLS allows all authenticated users to see public recipes

### Data
- 24 sample recipes seeded into Supabase
- All recipes standardised to consistent format
- cook_count, step_notes, image_url, is_public columns on recipes table
- quantity, unit, price, stock_level columns on pantry table
- prepared column on shopping_list table (tracks prep vs in-shop phase)
- cook_logs table for rating, feedback and AI tips history
- prices table — one row per purchase event, stores price_per_unit, quantity, unit, purchased_at
- Supabase Storage bucket: recipe-images (public, 5MB limit)

---

## 📋 Next Up

### 🚀 Native App (Priority)
The app is currently a web app with fundamental limitations around background persistence,
push notifications, and camera access. Moving to a native app is the next major milestone.

- **Phase 1 — PWA** (~2-3 days): Add manifest.json, service worker, offline caching. Installable
  on Android home screen. Limited on iOS but good enough for testing.
- **Phase 2 — Capacitor** (~4-6 weeks): Wrap in Capacitor for true iOS/Android native app.
  Fixes background persistence, enables proper camera access, push notifications, App Store distribution.
- Apple Developer account (€99/year) + Google Play (€25 one time) needed for store distribution
- Privacy policy + terms of service required for App Store

### Recipe Visibility & Sharing ✅
- Browse public recipes — search/filter across all users' public recipes ✅
- Add a public recipe to your own library (forks it as your own copy) ✅
- Users can only edit recipes they own — forking required to customise ✅
- Author name shown on public recipes in Browse and recipe detail ✅
- Public/private toggle per recipe in edit mode ✅
- Browse moved to main nav for discoverability ✅
- Username/display name editable in Profile ✅
- Tag filtering in Browse view ✅

### Shopping List Overhaul ✅
- Recipes tab stays accessible while a list exists ✅
- Tick state persists in Supabase between sessions (debounced 2s) ✅
- Add more recipes to an existing list + regenerate with AI ✅
- Receipt scanner at end of shop has context of what was on the list ✅
- Clear list confirmation modal replaces confusing back button ✅
- Receipt scanner preserves pack sizes in unit field ✅

### Bigger Features
- Nutritional info — AI-generated approximate macros per recipe
- Meal planner — drag recipes onto a weekly calendar, auto-generate shopping list for the week
- AI-generated recipe hero images (e.g. via Replicate or DALL-E)
- Multi-user / household sharing (Eve + Shane see same library)
- Proper email provider (Resend) for auth emails — replace Supabase default

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
- Offline support
- Dark mode
- Grocery delivery integration (send shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)

---

## 🔧 Known Issues / Technical Debt
- Background persistence — JS stops when switching apps on mobile (native app will fix this)
- No error handling UI — API failures are mostly silent (just console.error) — partial fix done, full sweep still needed
- Shopping list generation can be slow with many recipes selected
- No loading skeleton UI — blank gaps while data loads
- Collections layout switches to horizontal scroll on mobile which could feel odd with many collections
- Camera capture (take photo) unreliable on some mobile browsers — upload works fine
- Supabase default email sender unreliable — need Resend for production auth emails
- Price estimate ilike query can match unrelated ingredients (e.g. "Egg" matches "Eggplant")
- Skip cook review does not increment cook_count or set lastCooked
- Browse view Cook button is a no-op — should prompt to add to library first
- ReceiptScanner makes direct fetch calls to /api/claude instead of using callClaude util
- App.jsx line 465 inline ternary for onOverwrite prop is hard to read — needs extracting
- Browse "Add to library" always shows button even after adding (fork gets new ID so original ID never matches)
- RLS policies should be audited in Supabase to confirm all tables are properly locked per user
