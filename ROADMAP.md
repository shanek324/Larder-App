# Larder App — Roadmap

## ✅ Shipped

### Infrastructure
- Vite + React, deployed on Vercel (auto-deploy on push), Supabase backend
- Supabase Auth (email/password, sign up flow, profile auto-create trigger)
- Row Level Security on every table, audited
- Claude API proxy via Vercel serverless functions, JWT-required, credits checked server-side
- Haiku for mechanical tasks (consolidation, cleanup), Sonnet for creative tasks (generation, chat)
- SSRF protection on /api/fetch-url

### Recipes
- Library with search, tag filtering, collections
- Manual add, AI generate, URL import (consolidated into one Add Recipe dropdown)
- Recipe detail with serving scaler, cost estimation, hero image upload
- Edit, duplicate, delete, public/private toggle
- AI recipe assistant per recipe (suggestion chips, trimmed history)
- Photo-led recipe cards (4:3 hero image, emoji fallback by tag)
- Recipe action row collapsed to Cook + overflow menu

### Cooking Mode
- Fullscreen dark UI, card-based step carousel, swipe gestures, auto-scaling step text
- Ingredients card first, floating ingredients button during steps
- Tips from last cook surfaced before step 1
- Per-step notes saved to recipe
- Post-cook review: 5-star rating, feedback, AI-generated tips, opt-in pantry update
- Cook log history (per-recipe panel + dedicated history view)
- Cook count tracked per recipe

### Pantry & Shopping
- Pantry with quantity, unit, aisle, stock level (High/Medium/Low)
- Tap-to-edit modal, Haiku-powered cleanup, sticky aisle headers
- Shopping list with recipe picker, Haiku ingredient consolidation, sub-breakdown under items
- Cross-off pantry items before shopping, persist between sessions
- In-shop mode: tick off aisle by aisle, manual add, debounced sync
- Receipt scanner (Haiku extraction + normalisation), confirm screen, save to prices + pantry
- Recipe cost estimation from prices table (exact normalised match, batched query)

### Meal Planner
- 7-day grid with week navigation, today highlighted
- Tap-to-add recipe picker per day, remove per entry, clear-week confirm
- "Shopping list" button pre-populates from week's recipes
- meal_plans table indexed on (user_id, date)

### Home Screen (Round-3 audit)
- First-run state: three onboarding tiles + browse community fallback
- Returning users: "Tonight" planned meal + "Running low" pantry strip (only when relevant)
- Static welcome hero removed

### Profile (Round-3 audit)
- Avatar header (initials in gold circle), name, email
- Four-tile stats row: Recipes / Cooks / Collections / Public
- "Most cooked" highlight card, deep-links to recipe
- Account tier and credit usage

### Design System
- Two-font system (Playfair serif + DM Sans)
- Cream/gold/oak palette via CSS variables in index.css
- Toast system (success/error/info), mounts once in App.jsx
- Confirmation modals for destructive actions across all views
- Round-3 audit: inline-style sweep, dead Vite boilerplate removed

### Data
- recipes: cook_count, step_notes, image_url, is_public
- pantry: quantity, unit, price, stock_level
- shopping_list: prepared, scanned_items
- cook_logs, prices, meal_plans, profiles all with RLS
- Supabase Storage bucket: recipe-images (public, 5MB)

---

## 📋 Next Up

### 🚀 Native App
- **PWA** (~2-3 days): manifest.json, service worker, offline caching, installable on Android
- **Capacitor** (~4-6 weeks): iOS/Android native, background persistence, camera, push, App Store
- Apple Developer (€99/year), Google Play (€25 one time)
- Privacy policy + terms required for store distribution

### Brand & Identity
- Real logo lockup, app icon, favicon, Apple touch icon, splash screen
- PWA / Capacitor needs all sizes (192, 512, etc.)

### Round-3 audit — outstanding polish
- Recipe images on cards exist but no AI-generated image option for new recipes (Replicate / image gen)
- ai-error-toast in App.jsx still uses the old custom div — migrate to new toast system
- Loading skeleton states across views (currently blank gaps while data loads)
- Global error boundary
- Mobile nav: labels truncate awkwardly between 381-399px — consider icons-only earlier
- Pantry "Add item" and search inputs look identical, hard to distinguish
- Cooking mode: timer integration for time-based steps ("simmer 20 min" → tap to start timer)
- Tap target sizes below 44px on pill filters, stock buttons, × close icons
- Shopping list selected-recipe-card affordance is too subtle (just a ✓ corner)
- BrowseView lacks visual distinction from HomeView

### Bigger Features
- Nutritional info — AI-generated macros per recipe
- Meal planner v2: AI fill empty days, breakfast/lunch slots, per-meal servings override
- Multi-user / household sharing
- Resend for production auth emails

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
- Offline support, dark mode, grocery delivery integration, voice control in cooking mode

---

## 🔧 Known Issues
- Background persistence: JS pauses on mobile app-switch (native app fixes this)
- Shopping list consolidation can be slow with many recipes selected
- Camera capture unreliable in some mobile browsers (upload works fine)
- mealPlans only fetched for next 21 days on mount (past weeks empty, acceptable)
- 500kB JS bundle, no code-splitting yet
