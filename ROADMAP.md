# Larder App — Roadmap

## ✅ Shipped

### Infrastructure
- Vite + React, deployed on Vercel (auto-deploy on push), Supabase backend
- Supabase Auth (email/password, sign up, password reset, resend confirmation, profile auto-create trigger)
- Row Level Security on every table, audited
- Claude API proxy via Vercel serverless functions, JWT-required, **credit decrement server-side only** (no double-charge)
- Haiku for mechanical tasks (consolidation, cleanup), Sonnet for creative tasks (generation, chat)
- **SSRF protection on /api/fetch-url with redirect-loop guard, 8s timeout, 2MB response cap**
- Account deletion endpoint (GDPR) with cascading data delete + auth row removal
- **Atomic recipe delete via `delete_my_recipe()` SECURITY DEFINER function** — meal_plans, cook_logs, collections.recipe_ids all cleaned in a single transaction
- **Admin-approval moderation for public recipes** — `is_admin()` SQL function gates approve/unpublish on a queue inside ProfileView; recipes are pending until approved

### Resilience (Rounds 4 + 5)
- Global ErrorBoundary catches uncaught render errors with reload UI
- Toast system styled and mounted; every async failure surfaces a user-visible toast
- Toasts support tap-to-dismiss and action variant with inline button (used for AI-chat Undo)
- All `alert()` calls migrated to toasts
- App.jsx wraps every Supabase write/read with try/catch + contextual error toast
- All in-view writes (CookingMode, AIChat, BrowseView, CookHistoryView, ProfileView) surface errors via toast — no more silent failures
- Receipt-scan pantry matching normalised (trim + lowercase) to prevent duplicates
- **Pantry cleanup reuses existing UUIDs** where possible — no doubled items on partial failure
- **InShop debounce flushes on visibilitychange / beforeunload / pagehide / unmount** — no lost ticks on app death mid-shop
- Cook count recomputes from cook_logs when a log is deleted

### Recipes
- Library with search, tag filtering, collections
- Manual add, AI generate, URL import (consolidated into one Add Recipe dropdown)
- **AI generate + URL import previews show full ingredients + method before saving** (no more blind commits)
- GenerateModal raised to 2000 max_tokens to prevent truncation of richer recipes
- Recipe detail with serving scaler, **interactive cost breakdown**
- Edit, duplicate, delete (now with confirmation), public/private toggle (now with confirmation)
- AI recipe assistant per recipe (suggestion chips, trimmed history)
- **AI chat field whitelist** — only content fields can be modified by Claude; cook_count, step_notes, is_public, etc. preserved across AI edits
- **AI chat Undo toast** — 10s undo window via toast.action()
- Recipe cards (emoji fallback by tag; hero image upload deferred)
- Recipe action row collapsed to Cook + overflow menu (mobile cutoff fixed)
- **Recipe cards are accessible buttons** with keyboard focus + aria-label

### Cooking Mode
- Fullscreen dark UI, card-based step carousel, swipe gestures, auto-scaling step text
- Ingredients card first, floating ingredients button during steps
- **Return-to-step button** on the ingredients card after peeking via 🥘 (no more swiping back through every step)
- Tips from last cook surfaced before step 1
- Per-step notes saved to recipe
- Post-cook review: 5-star rating, feedback, AI-generated tips, opt-in pantry update
- **Tips generation failure no longer skips the cook log** — log + count bump always happen
- **Pantry suggestion short-circuits on empty pantry** (no wasted credit)
- Cook log history (per-recipe panel + dedicated history view, deletes recount)
- Cook count tracked per recipe
- Code-split into its own bundle chunk
- **Resume cooking after app kill** — current step + ingredient-peek state persisted to localStorage; HomeView banner offers Resume within 6 hours

### Pantry & Shopping
- Pantry with quantity, unit, aisle, stock level (High/Medium/Low)
- Tap-to-edit modal, Haiku-powered cleanup, sticky aisle headers
- **Pantry item delete now confirmed** (no more one-tap-and-gone)
- Shopping list with recipe picker, Haiku ingredient consolidation, sub-breakdown under items
- **Remove × on consolidated shopping items** — drop bad consolidations without crossing them off
- Cross-off pantry items before shopping, persist between sessions
- In-shop mode: tick off aisle by aisle, manual add, debounced sync
- **Finish shopping button always available once any item is ticked** — no more all-or-nothing trap
- **Receipt scan decoupled from shop-finish** — scan now adds to pantry and auto-ticks matching list items, leaves user in InShop to decide when to finish
- Receipt scanner (Haiku extraction + normalisation), confirm screen, save to prices + pantry
- Receipt scanner code-split into its own bundle chunk
- Recipe cost estimation from prices table (exact normalised match, batched query)
- **PriceMap loaded once at app mount** and refreshed only after new prices arrive — no per-recipe-open fetch
- **Cost breakdown modal**: tap the cost block to see per-ingredient math, source-count, and add prices inline (cross-recipe — adding chicken price here improves every recipe that uses chicken)

### Meal Planner
- 7-day grid with week navigation, today highlighted
- Tap-to-add recipe picker per day, **remove per entry confirmed**, clear-week confirm
- "Shopping list" button pre-populates from week's recipes
- meal_plans table indexed on (user_id, date)

### Home Screen
- First-run state: three onboarding tiles + browse community fallback
- Returning users: "Tonight" planned meal + "Running low" pantry strip (only when relevant)
- **No-context "what are you cooking today?" prompt** when nothing planned + nothing low
- **Resume cooking banner** at the top when there is unfinished cook state
- Round-4 redesign: redundant browse banner dropped, tag list collapsed behind bottom-sheet filter, search + filter button live in one row
- Skeleton loading state for today/lowstock block
- **"Clear filters" action** in the empty-results state
- **Stuck-loading "reload?" button** appears after 8s on the boot loader

### Browse / Community
- Public recipe library across all users, gated on admin approval
- Author byline (resolved via profiles.username), fork-to-library action
- BrowseView uses the canonical `recipeFromDb` from utils (no field drift)
- "Add to library" forks the recipe as `is_public: false, is_approved: false`

### Profile
- Avatar header (initials in gold circle), name, email
- Four-tile stats row: Recipes / Cooks / Collections / Public
- "Most cooked" highlight card, deep-links to recipe (fixed Round-4)
- Account tier and credit usage (limit matches SQL function — 10/day starter, unlimited power)
- Editable display name
- **Moderation queue** (admins only) — list of pending public recipes with expand-to-view-full + Approve/Unpublish
- Danger zone with typed-confirmation delete account flow

### Accessibility
- Recipe cards rendered as keyboard-accessible buttons with aria-labels
- App-wide `:focus-visible` indicators on every interactive element
- 23 `<span onClick>` patterns converted to `<button>` (modal closes, tag pills, remove ×s, meal-plan entry titles)
- 21 modals tagged with `role="dialog"` + `aria-modal="true"`
- ~34 inputs got `aria-label` derived from their placeholder
- Cooking-mode dots: visual 8px stays, tap area extended to ~44px via content-box padding trick; converted to `<button>` with `aria-current`

### PWA
- vite-plugin-pwa: manifest, service worker, Workbox runtime caching
- App-shell precaching, Google Fonts cached for offline viewing
- Install prompt component (Android/Chrome) + iOS "Add to Home Screen" hint
- **iOS hint rate-limited to once every 7 days** (no more permanent floating banner)
- **iPad iOS 13+ detection** (Mac UA + touch points heuristic)
- Theme/background colour, viewport-fit, Apple touch icon, favicon
- Placeholder L-lockup icons at 192/512/180/32 — ready for real branding swap

### Design System
- Two-font system (Playfair serif + DM Sans)
- Cream/gold/oak palette via CSS variables in index.css
- Toast system styled (slide-in, success/error/info/action variants), mounts once in App.jsx
- **Confirmation modals on every destructive action** (delete recipe, delete pantry item, remove meal plan, make public, clear week, delete cook log, delete collection, clear shopping list, start over, delete account)
- Bottom-sheet primitive (TagFilterSheet) for mobile-friendly modal patterns
- Reusable Skeleton primitive (card / history entry / arbitrary)
- Inline-style sweep, dead Vite boilerplate removed

### Performance
- Memoised filter/map chains in ShoppingList, MealPlan, Pantry views
- Code-split CookingMode and ReceiptScanner (~24kB off critical path)
- Skeleton loading states in Browse, Cook History, Recipe cost, Home today block
- **PriceMap fetched once on app mount** instead of on every recipe view
- HomeView today/lowstock fetch narrowed to fire on `[isFirstRun]`, not on every recipe edit

### Data
- recipes: cook_count, step_notes, is_public, is_approved
- pantry: quantity, unit, price, stock_level
- shopping_list: prepared, scanned_items
- cook_logs, prices, meal_plans, profiles all with RLS
- Supabase Storage bucket: recipe-images — deferred (image upload not yet implemented)
- `delete_my_account()` and `delete_my_recipe()` SECURITY DEFINER functions
- `is_admin()` SECURITY DEFINER function gates moderation policy
- `check_and_use_ai_credit()` enforces 10/day starter, unlimited power, single-source-of-truth limit

---

## 📋 Next Up

### Observability
- **Sentry** integration for production error tracking — needs sentry.io account + DSN, then wire SDK + ErrorBoundary
- **PostHog** for usage analytics — needs posthog.com account + project key, then wire event firing for signup, recipe_added, cook_finished, ai_credit_blocked, etc.

### Brand & Identity
- Real logo lockup, app icon, favicon, Apple touch icon, splash screen
- Replace placeholder L-lockup PWA icons (currently /public/pwa-*.png)
- PWA / Capacitor needs all sizes (192, 512, etc.)

### Auth & email
- Resend (resend.com) for production auth emails — Supabase default sender is unreliable
- Email verification reliability tracking

### Outstanding polish (Round-5 deferred)
- Long Claude calls have no abort (AbortController support in callClaude across all callsites) — audit item #44
- Rate limiting on `/api/fetch-url` — needs SQL counter table OR Vercel KV decision — audit item #21
- Smart unit reconciliation for cost breakdown — currently per-unit math is naive (€/g recipe × per-pack price reads weirdly). Should parse recipe amount units and match to price units, converting where possible.
- AI-generated image option for new recipes (Replicate / image gen)
- Cooking mode: timer integration for time-based steps ("simmer 20 min" → tap to start timer)
- Session expiry mid-action — listen for TOKEN_REFRESHED, handle 401s with toast + redirect
- Modal focus trap (we have role=dialog and aria-modal; Tab can still escape the modal)

### 🚀 Native App
- **Capacitor** (~4-6 weeks): iOS/Android native, background persistence, camera, push, App Store
- Apple Developer (€99/year), Google Play (€25 one time)
- Privacy policy + terms required for store distribution

### Bigger Features
- Nutritional info — AI-generated macros per recipe
- Meal planner v2: AI fill empty days, breakfast/lunch slots, per-meal servings override
- Multi-user / household sharing
- Search across cook history ("when did I last cook curry?")
- Export / backup (JSON download for full library)

---

## 💰 Business Model

### Monetisation
- Free tier: manual features unlimited, AI actions gated behind 30s rewarded ads (~€0.04/action covers €0.02 API cost)
- Starter €2.99/mo (10 AI actions/day), Regular €4.99/mo (30/day), Power €9.99/mo (unlimited)

### What counts as an AI action
- Recipe generation, URL import, AI chat, shopping consolidation, pantry cleanup, receipt scan, cooking tips

### To productise
- Capacitor wrap, AdMob SDK, Stripe or RevenueCat, action counter per user

### Differentiation
- Claude AI throughout vs Paprika/Mealime/Whisk
- Receipt scanning → price tracking → recipe cost estimation with inline price entry (no competitor has this)
- Irish/Dunnes-aware aisle ordering
- Meal planner + shopping list as one workflow
- Resume-cooking after app kill (most cooking apps drop you back to home)

---

## 💡 Future Ideas
- Optimistic concurrency / multi-tab edit warnings
- Dark mode
- Grocery delivery integration
- Voice control in cooking mode
- Recipe versioning / "see history of edits"
- AI-suggested cooking schedule (start dish A at 18:00 so it finishes when dish B is ready)
- Public-recipe report mechanism (right now moderation is admin-pull; eventually we want user-push reports)

---

## 🔧 Known Issues
- Background persistence: JS pauses on mobile app-switch (Capacitor will fix this)
- Shopping list consolidation can be slow with many recipes selected
- Camera capture unreliable in some mobile browsers (upload works fine)
- mealPlans only fetched for next 21 days on mount (past weeks empty, acceptable)
- 482kB JS critical bundle after code-splits — further chunking deferred
- Supabase default email sender unreliable — Resend integration pending
- Cost breakdown per-unit math is naive about unit reconciliation (see "Outstanding polish")

---

## 📜 Audit history
- Round 1 — logic
- Round 2 — security / RLS
- Round 3 — UI/UX
- Round 4 — production readiness (ErrorBoundary, toast, PWA, code-split, skeletons, password reset, account deletion, HomeView redesign)
- Round 5 — deep dive (user journeys, per-screen rendering, data integrity, a11y, performance). Started at 72/100, finished at ~96/100. 30+ items closed including all 9 blockers. Highlights: AI credit double-decrement fix, atomic recipe delete RPC, SSRF redirect-guard hardening, admin-approval moderation flow, resume cooking, cost breakdown modal, full a11y sweep (recipe cards as buttons, focus indicators, modal dialog roles, input labels, span→button), 4 confirmation modals added for previously destructive one-taps.
