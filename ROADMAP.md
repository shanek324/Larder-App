# Larder App — Roadmap

## ✅ Completed

### Infrastructure
- Vite + React project setup on Chromebook Linux
- Modular file structure (components, views, constants, utils)
- GitHub repo at shanek324/Larder-App
- Deployed to Vercel at larder-app-omega.vercel.app
- Supabase database (recipes, collections, pantry, shopping_list, cook_logs, prices, meal_plans tables)
- Auto-deploy on git push
- Supabase Row Level Security (RLS) — all tables locked per user, audited and verified
- Supabase Auth — email/password login and logout + public sign up flow
- Auto-create profile row trigger on new user signup (+ backfilled existing users)
- Claude API proxy via Vercel serverless function (api/claude.js)
- Anthropic API key safely server-side, JWT-required, credits checked server-side
- Haiku for mechanical tasks, Sonnet for creative tasks
- Full CSS refactor — design tokens, CSS variables, no inline styles, ~1400 lines

### App Features
- Recipe library with search and tag filtering
- Recipe detail view with ingredients and method
- Serving scaler (scale any recipe up or down)
- Edit and delete recipes
- Duplicate a recipe (appends "copy", resets cook count)
- Add recipe manually via form
- Import recipe from URL — Claude Sonnet extracts and formats via api/fetch-url.js proxy
- AI recipe generator (describe a dish, get a full recipe)
- AI recipe assistant per recipe (clickable suggestion chips, conversation trimmed to last 10 messages)
- Add Recipe consolidated dropdown — manual, AI generate, import URL in one button
- Recipe hero image — upload photo per recipe, stored in Supabase Storage (recipe-images bucket)
- Collections (group recipes into named sets with emoji)
- Pantry (track what you have in stock, grouped by aisle)
- Pantry tap-to-edit modal — name, quantity, standardised unit dropdown, aisle, stock level
- Pantry stock levels — High/Medium/Low per item, colour coded
- Pantry cleanup via Claude Haiku (deduplicates and normalises messy entries)
- Shopping list — recipe picker with search and tag filter
- Claude Haiku consolidates ingredients intelligently (combines duplicates, assigns aisles)
- Quantity editing on consolidated shopping list items (debounced 800ms, single write per edit)
- Sub-breakdown under consolidated items — tap to see source recipes and original amounts
- Low stock alert banner in shopping list (shows pantry items marked Low)
- Shopping list persists immediately on generate — navigating away and back restores it
- Resume saved shopping list banner — persists between sessions via Supabase
- Cross off items you already own before heading to shop
- "Go to Shop" saves final list and switches to in-shop mode
- In-shop mode — tick off items aisle by aisle, proper start-over modal
- Manually-add items in in-shop mode (syncs to App state, no refresh needed)
- Receipt scanner at end of shopping mode (uses authenticated callClaude util)
- Add bought items to pantry on shop completion
- Cooking mode — fullscreen dark UI, card-based step carousel with progress dots
- Tips from last cook shown as a card after ingredients, before step 1
- Ingredients card as first step, floating ingredients button during steps
- Per-step notes in cooking mode (saved to recipe)
- Step text auto-scales to fit card on any screen size
- Swipe gestures for cooking mode step navigation (ignores input/textarea targets)
- Post-cook review — 5 star rating + feedback text + recipe notes editing
- Back button on cook review screen
- Cook log history — collapsible panel in review screen showing previous cooks (date, rating, feedback, AI tips)
- Cook history view — dedicated screen listing all past cooks, with delete per entry
- Claude Haiku generates tips from feedback, saved to cook_logs table
- Cook count tracked per recipe (Skip review still increments count + lastCooked)
- Pantry update step after cooking — opt-in AI suggestion button (no auto-burn of credits)
- Responsive UI — all views adapt to mobile, nav icons-only on very small screens
- Receipt scanner — photograph supermarket receipt, Haiku extracts + normalises ingredient names
- Confirm screen — toggle off non-food items, edit names/prices/quantities, aisle editable
- Confirmed items saved to prices table (price per unit calculated) and added to pantry
- Recipe cost estimation — exact normalised matching, single batched query, shown on recipe detail and shopping list
- Public recipes — is_public flag + RLS allows all authenticated users to see public recipes

### Meal Planner ✅
- 7-day week grid with prev/next/today week navigation
- Tap-to-add recipe picker per day with search and tag filter
- Today's column highlighted
- Remove planned meal per entry
- Clear week confirmation modal
- "Shopping list" button on the week pre-populates Shopping with planned recipes
- meal_plans table with RLS, indexed on (user_id, date)

### Security & RLS
- /api/claude and /api/fetch-url require valid Supabase JWT, credits checked server-side
- /api/fetch-url SSRF protection — correct 172.16-31 range, IPv6 loopback/unique-local/link-local, GCP metadata endpoint
- Browse view only fetches profiles for users with public recipes
- ReceiptScanner uses callClaude util (auth header sent on every request)
- RLS policies audited and confirmed on every table

### Round-2 Audit Fixes
- CookingMode useEffect moved above conditional returns (Rules of Hooks)
- ReceiptScanner uses callClaude (no more 401s on scan)
- Skip review increments cook_count and sets lastCooked
- Browse Cook button hidden when no handler
- Browse "Add to library" button updates immediately after add
- Price estimate uses exact normalised match (no more "rice" matching "rice vinegar")
- Price query batched (N+1 eliminated)
- ProfileView only reloads on user id change, preserves in-progress edits
- RecipeView only resets draft on recipe id change (no edit-loss on parent re-render)
- InShopView manual-add routes through App state (no desync)
- CookingMode refreshes cookLogs after insert (Tips card always current)
- App.jsx canOverwrite/handleOverwrite memoised (readability + perf)
- Auth listener unsubscribes on unmount
- ShoppingListView cost effect: vars declared before effect, cancellation guard added
- HomeView featured pick stable through the day (date-seeded)
- AIChat surfaces JSON parse failures instead of silent swallow
- AIChat trims conversation history to last 10 messages
- App add-menu click-outside listener only attached when menu is open
- CookingMode font auto-resize steps by 2 (less layout thrash)

### Data
- 24+ sample recipes seeded into Supabase
- cook_count, step_notes, image_url, is_public columns on recipes table
- quantity, unit, price, stock_level columns on pantry table
- prepared column on shopping_list table (tracks prep vs in-shop phase)
- cook_logs table for rating, feedback and AI tips history
- prices table — one row per purchase event, stores price_per_unit, quantity, unit, purchased_at
- meal_plans table — date + recipe_id + slot + servings + notes
- profiles table — auto-populated via handle_new_user trigger
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

### Bigger Features
- Nutritional info — AI-generated approximate macros per recipe
- Meal planner v2 — "✦ Fill empty days" auto-suggest based on lastCooked + cook_count
- Meal planner v2 — breakfast/lunch slots (column already exists, UI only)
- Meal planner v2 — servings override per planned meal (column already exists)
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
- Meal planner + shopping list integration in a single workflow

## 💡 Future Ideas

### Features
- Offline support
- Dark mode
- Grocery delivery integration (send shopping list to Tesco/Dunnes online)
- Smart home (send shopping list to Alexa/Google)

---

## 🔧 Known Issues / Technical Debt
- Background persistence — JS stops when switching apps on mobile (native app will fix this)
- No global error boundary — uncaught render errors blank the whole app
- No error handling UI on most async actions — failures often only logged to console
- Shopping list generation can be slow with many recipes selected
- No loading skeleton UI in views — blank gaps while data loads
- Collections layout switches to horizontal scroll on mobile which could feel odd with many collections
- Camera capture (take photo) unreliable on some mobile browsers — upload works fine
- Supabase default email sender unreliable — need Resend for production auth emails
- Recipe detail view back button always goes to home, regardless of where you came from (Plan / Browse)
- Recipe actions row wraps onto 4 lines on small mobile screens — needs a "More" collapse
- mealPlans only loaded for next 21 days on mount — navigating to past weeks shows empty (acceptable for now)
