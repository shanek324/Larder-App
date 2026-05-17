# Larder App — Roadmap

## ✅ Shipped

### Infrastructure
- Vite + React, deployed on Vercel (auto-deploy on push), Supabase backend
- Supabase Auth (email/password, sign up, password reset, resend confirmation, profile auto-create trigger)
- Row Level Security on every table, audited
- Claude API proxy via Vercel serverless functions, JWT-required, credits checked server-side
- Haiku for mechanical tasks (consolidation, cleanup), Sonnet for creative tasks (generation, chat)
- SSRF protection on /api/fetch-url
- Account deletion endpoint (GDPR) with cascading data delete + auth row removal

### Resilience (Round-4 audit)
- Global ErrorBoundary catches uncaught render errors with reload UI
- Toast system mounted, every async failure surfaces a user-visible toast
- All `alert()` calls migrated to toasts
- App.jsx wraps every Supabase write/read with try/catch + contextual error toast
- Receipt-scan pantry matching normalised (trim + lowercase) to prevent duplicates
- deleteRecipe cascades cleanup to meal_plans and collections
- Cook count recomputes from cook_logs when a log is deleted

### Recipes
- Library with search, tag filtering, collections
- Manual add, AI generate, URL import (consolidated into one Add Recipe dropdown)
- Recipe detail with serving scaler, cost estimation, hero image upload
- Edit, duplicate, delete, public/private toggle
- AI recipe assistant per recipe (suggestion chips, trimmed history)
- Photo-led recipe cards (4:3 hero image, emoji fallback by tag)
- Recipe action row collapsed to Cook + overflow menu (mobile cutoff fixed)

### Cooking Mode
- Fullscreen dark UI, card-based step carousel, swipe gestures, auto-scaling step text
- Ingredients card first, floating ingredients button during steps
- Tips from last cook surfaced before step 1
- Per-step notes saved to recipe
- Post-cook review: 5-star rating, feedback, AI-generated tips, opt-in pantry update
- Cook log history (per-recipe panel + dedicated history view, deletes recount)
- Cook count tracked per recipe
- Code-split into its own bundle chunk

### Pantry & Shopping
- Pantry with quantity, unit, aisle, stock level (High/Medium/Low)
- Tap-to-edit modal, Haiku-powered cleanup, sticky aisle headers
- Shopping list with recipe picker, Haiku ingredient consolidation, sub-breakdown under items
- Cross-off pantry items before shopping, persist between sessions
- In-shop mode: tick off aisle by aisle, manual add, debounced sync
- Receipt scanner (Haiku extraction + normalisation), confirm screen, save to prices + pantry
- Receipt scanner code-split into its own bundle chunk
- Recipe cost estimation from prices table (exact normalised match, batched query)

### Meal Planner
- 7-day grid with week navigation, today highlighted
- Tap-to-add recipe picker per day, remove per entry, clear-week confirm
- "Shopping list" button pre-populates from week's recipes
- meal_plans table indexed on (user_id, date)

### Home Screen
- First-run state: three onboarding tiles + browse community fallback
- Returning users: "Tonight" planned meal + "Running low" pantry strip (only when relevant)
- Round-4 redesign: redundant browse banner dropped, tag list collapsed behind bottom-sheet filter, search + filter button live in one row
- Skeleton loading state for today/lowstock block

### Profile
- Avatar header (initials in gold circle), name, email
- Four-tile stats row: Recipes / Cooks / Collections / Public
- "Most cooked" highlight card, deep-links to recipe (fixed Round-4)
- Account tier and credit usage
- Editable display name
- Danger zone with typed-confirmation delete account flow

### PWA
- vite-plugin-pwa: manifest, service worker, Workbox runtime caching
- App-shell precaching, Google Fonts + recipe images cached for offline viewing
- Install prompt component (Android/Chrome) + iOS "Add to Home Screen" hint
- Theme/background colour, viewport-fit, Apple touch icon, favicon
- Placeholder L-lockup icons at 192/512/180/32 — ready for real branding swap

### Design System
- Two-font system (Playfair serif + DM Sans)
- Cream/gold/oak palette via CSS variables in index.css
- Toast system (success/error/info), mounts once in App.jsx
- Confirmation modals for destructive actions across all views
- Bottom-sheet primitive (TagFilterSheet) for mobile-friendly modal patterns
- Reusable Skeleton primitive (card / history entry / arbitrary)
- Inline-style sweep, dead Vite boilerplate removed

### Performance
- Memoised filter/map chains in ShoppingList, MealPlan, Pantry views
- Code-split CookingMode and ReceiptScanner (~24kB off critical path)
- Skeleton loading states in Browse, Cook History, Recipe cost, Home today block

### Data
- recipes: cook_count, step_notes, image_url, is_public
- pantry: quantity, unit, price, stock_level
- shopping_list: prepared, scanned_items
- cook_logs, prices, meal_plans, profiles all with RLS
- Supabase Storage bucket: recipe-images (public, 5MB)
- delete_my_account() SECURITY DEFINER function for GDPR cascading delete

---

## 📋 Next Up

### Observability (audit outstanding)
- **Sentry** integration for production error tracking — needs sentry.io account + DSN, then wire SDK + ErrorBoundary
- **PostHog** for usage analytics — needs posthog.com account + project key, then wire event firing for signup, recipe_added, cook_finished, ai_credit_blocked, etc.

### Brand & Identity
- Real logo lockup, app icon, favicon, Apple touch icon, splash screen
- Replace placeholder L-lockup PWA icons (currently /public/pwa-*.png)
- PWA / Capacitor needs all sizes (192, 512, etc.)

### Auth & email
- Resend (resend.com) for production auth emails — Supabase default sender is unreliable
- Email verification reliability tracking

### Outstanding polish
- AI-generated image option for new recipes (Replicate / image gen)
- Cooking mode: timer integration for time-based steps ("simmer 20 min" → tap to start timer)
- Tap target sizes below 44px on pill filters, stock buttons, × close icons
- Shopping list selected-recipe-card affordance is too subtle (just a ✓ corner)
- BrowseView lacks visual distinction from HomeView
- Pantry "Add item" and search inputs look identical, hard to distinguish
- Long Claude calls have no abort (AbortController support in callClaude)
- Session expiry mid-action — listen for TOKEN_REFRESHED, handle 401s with toast + redirect

### 🚀 Native App
- **Capacitor** (~4-6 weeks): iOS/Android native, background persistence, camera, push, App Store
- Apple Developer (€99/year), Google Play (€25 one time)
- Privacy policy + terms required for store distribution

### Bigger Features
- Nutritional info — AI-generated macros per recipe
- Meal planner v2: AI fill empty days, breakfast/lunch slots, per-meal servings override
- Multi-user / household sharing

---

## 💰 Business Model

### Monetisation
- Free tier: manual features unlimited, AI actions gated behind 30s rewarded ads (~€0.04/action covers €0.02 API cost)
- Starter €2.99/mo (10 AI actions), Regular €4.99/mo (30), Power €9.99/mo (100)

### What counts as an AI action
- Recipe generation, URL import, AI chat, shopping consolidation, pantry cleanup, receipt scan, cooking tips

### To productise
- Capacitor wrap, AdMob SDK, Stripe or RevenueCat, action counter per user

### Differentiation
- Claude AI throughout vs Paprika/Mealime/Whisk
- Receipt scanning → price tracking → recipe cost estimation (no competitor has this)
- Irish/Dunnes-aware aisle ordering
- Meal planner + shopping list as one workflow

---

## 💡 Future Ideas
- Optimistic concurrency / multi-tab edit warnings
- Dark mode
- Grocery delivery integration
- Voice control in cooking mode
- Recipe versioning / "see history of edits"
- AI-suggested cooking schedule (start dish A at 18:00 so it finishes when dish B is ready)

---

## 🔧 Known Issues
- Background persistence: JS pauses on mobile app-switch (Capacitor will fix this)
- Shopping list consolidation can be slow with many recipes selected
- Camera capture unreliable in some mobile browsers (upload works fine)
- mealPlans only fetched for next 21 days on mount (past weeks empty, acceptable)
- 482kB JS critical bundle after code-splits — further chunking deferred
- Supabase default email sender unreliable — Resend integration pending
