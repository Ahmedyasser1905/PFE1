# Frontend Comparison: `Desktop\APEX-main` vs `Desktop\Projet\APEX-main`

Comparison scope: **frontend only**. Backend (`server/`) and dependency artifacts (`node_modules/`, `.expo/`, `.git/`) are excluded.

- **OLD** = `C:\Users\dz laptops\Desktop\APEX-main`
- **NEW** = `C:\Users\dz laptops\Desktop\Projet\APEX-main`

---

## 1. Top-level layout

| Item | OLD | NEW | Note |
|---|:---:|:---:|---|
| `app/` (Expo Router) | yes | yes | Routes restructured — see §3 |
| `assets/` | 6 files | 7 files | NEW adds `project-placeholder.png` |
| `api/` (root) | yes | — | Moved into `src/api/` |
| `components/` (root) | yes | — | Moved into `src/components/` |
| `constants/` (root) | yes | — | Moved into `src/constants/` |
| `context/` (root) | yes | — | Moved into `src/context/` |
| `hooks/` (root) | yes | — | Moved into `src/hooks/` |
| `services/` (root) | yes | — | Moved into `src/services/` |
| `utils/` (root) | yes | — | Moved into `src/utils/` |
| `translations/` (root) | empty folder | — | Removed (translations live under `src/constants/translations/`) |
| `src/` | — | yes | NEW consolidates all non-route code under `src/` |
| `.vscode/` | — | yes | Editor config added |
| `scripts/` | — | empty folder | Added (no files yet) |
| `project_plan.md` | — | yes | Added |
| `docs/` | empty folder | 1 file | NEW has docs content |
| `supabase_schema.sql` | yes | — | Removed from root (DB schema lives in `server/`) |
| `updated_migration.sql` | yes | — | Removed from root |
| `verify_db.js` | yes | yes | Identical (687 bytes) |
| `api-contract.html` | yes | yes | Identical (93 476 bytes) |
| `app.json`, `eas.json`, `metro.config.js` | yes | yes | Same sizes — unchanged |
| `.env` | 1 056 B | 1 333 B | NEW adds extra variables |
| `package.json` | 1 322 B | 1 364 B | See §2 |
| `tsconfig.json` | 312 B | 372 B | See §2 |

**Headline structural change:** the project moved from a *flat* Expo layout (`api/`, `components/`, `hooks/`, …) to a **`src/`-based layout**, with `app/` kept at the root for Expo Router file-based routing.

---

## 2. Configuration changes

### `package.json`

Identical dependencies and dev-dependencies. Only difference:

```diff
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
-   "web": "expo start --web"
+   "web": "expo start --web",
+   "server": "cd server && npm run dev"
  }
```

NEW adds a convenience script to start the backend from the root.

### `tsconfig.json`

```diff
  "paths": {
-   "~/*": ["*"]
+   "~/*": ["src/*"]
  },
+ "module": "esnext",
+ "moduleResolution": "node",
```

The `~/...` import alias now points at `src/` instead of the project root, matching the new layout.

---

## 3. `app/` — Expo Router routes

### Routes added in NEW

- `app/(dashboard)/settings/help.tsx`
- `app/(dashboard)/settings/personal-info.tsx`
- `app/(dashboard)/settings/terms.tsx`
- `app/privacy.tsx` (top-level public page)

> Correction: `app/(auth)/verify-otp.tsx` exists in **both** projects — see §12 for its content change.

### Routes removed in NEW

The whole static `calculations/` route group is gone:

- `app/(dashboard)/calculations/_layout.tsx`
- `app/(dashboard)/calculations/concrete.tsx`
- `app/(dashboard)/calculations/finishes.tsx`
- `app/(dashboard)/calculations/index.tsx`

(NEW keeps the dynamic `all-calculations/` and `calculation-details/[id].tsx` flow that already existed in OLD.)

### Routes unchanged (path-wise)

All other auth and dashboard routes (`login`, `register`, `forgot-password`, `reset-password`, `onboarding`, `terms`, `privacy` (auth variant), `projects/*`, `chat/*`, `estimation-history`, `settings/index|password|plans|subscription`, etc.) exist in both.

---

## 4. `src/api/` (vs OLD `api/`)

| File | OLD | NEW |
|---|:---:|:---:|
| `api.ts` | yes | yes |
| `authApi.ts` | yes | yes |
| `types.ts` | yes | yes |
| `mappers.ts` | — | **added** |
| `mockData.ts` | — | **added** |

NEW introduces a mappers/mocks layer between API responses and the UI.

---

## 5. `src/components/` (vs OLD `components/`)

### Common / features

`common/*` (BottomNav, Filter, Header, ScreenShell, SplashScreenComponent) and feature components (`features/auth/OnboardingCard`, `features/calculations/CalculationCard`, `features/projects/ItemCard`, `features/projects/ProjectsCard`) exist in both.

### Added in NEW

- `components/projects/BudgetCategorySelector.tsx`
- `components/ui/AppFeedback.tsx`
- `components/ui/ErrorScreen.tsx`
- `components/ui/NativeSelect.tsx`
- `components/ui/PremiumModal.tsx`
- `components/ui/Skeleton.tsx`

OLD only had `ui/{BaseButton, BaseInput, EmptyState, LoadingOverlay, LoadingScreen, Logo}.tsx`. NEW keeps all of those and adds the six above — notably a feedback layer, a skeleton loader, a premium-paywall modal, and a native select.

---

## 6. `src/context/` (vs OLD `context/`)

| File | OLD | NEW |
|---|:---:|:---:|
| `AuthContext.tsx` | yes | yes |
| `LanguageContext.tsx` | yes | yes |
| `FeedbackContext.tsx` | — | **added** |
| `SubscriptionContext.tsx` | — | **added** |

NEW introduces global feedback/toast state and subscription/plan state providers.

---

## 7. `src/hooks/` (vs OLD `hooks/`)

| File | OLD | NEW |
|---|:---:|:---:|
| `useLocalCalculations.ts` | yes | yes |
| `useProjectDetail.ts` | yes | yes |
| `useProjects.ts` | yes | yes |
| `useUser.ts` | yes | yes |
| `useEstimationHistory.ts` | — | **added** |
| `useSubscription.ts` | — | **added** |

The two new hooks pair with the two new contexts and the new estimation/history flow.

---

## 8. `src/utils/` (vs OLD `utils/`)

| File | OLD | NEW |
|---|:---:|:---:|
| `errorHandler.ts` | yes | yes |
| `formatters.ts` | yes | yes |
| `responsive.ts` | yes | yes |
| `storage.ts` | yes | yes |
| `supabase.ts` | yes | yes |
| `imageResolver.ts` | — | **added** |

---

## 9. `src/services/` & `src/constants/`

- `services/authService.ts` — present in both, unchanged in path.
- `constants/{config.ts, Styles.tsx, theme.ts}` — present in both.
- `constants/translations/{ar.json, en.json}` — present in both. (OLD also had an empty top-level `translations/` folder, removed in NEW.)

---

## 10. `.env`

OLD: 1 056 bytes. NEW: 1 333 bytes (~+277 B). NEW likely adds backend-related URLs (e.g. local API base for the new `server/` companion). File contents are gitignored, so no diff is shown here.

---

## 11. Summary of qualitative changes

1. **Architectural refactor:** flat → `src/`-based layout. Path alias `~/...` retargets accordingly.
2. **Companion backend wired in:** root script `npm run server` and an extended `.env` indicate the app now talks to the local `server/` instead of relying on Supabase directly for everything.
3. **API layer matured:** added `mappers.ts` + `mockData.ts`.
4. **New product features (UI surfaces):**
   - OTP verification flow (`verify-otp`)
   - Settings expansion: `help`, `personal-info`, `terms`
   - Public `privacy` page
   - Premium / subscription UX (`PremiumModal`, `SubscriptionContext`, `useSubscription`, plus existing `settings/plans` & `settings/subscription`)
   - Estimation history (`useEstimationHistory`) and budget category selection (`BudgetCategorySelector`)
   - Global feedback / toast system (`AppFeedback`, `FeedbackContext`)
   - Better loading & error UX (`Skeleton`, `ErrorScreen`)
   - `NativeSelect`, `imageResolver`
5. **Routes simplified:** the static `calculations/{concrete,finishes,…}` screens were dropped in favour of the dynamic `all-calculations` / `calculation-details/[id]` flow.
6. **DB schema files removed from frontend root:** `supabase_schema.sql` and `updated_migration.sql` no longer live alongside the app — schema concerns moved to the backend project.
7. **Tooling polish:** `.vscode/`, `scripts/`, `docs/` populated, `project_plan.md` added.

No frontend dependency versions changed between the two projects.

---

## 12. Content changes in files that exist in **both** projects (same path)

These files were not added or removed — they were rewritten. Sizes (bytes) shown to indicate the magnitude of the rewrite.

### Auth routes (`app/(auth)/`)

| File | OLD | NEW | Δ |
|---|---:|---:|---:|
| `forgot-password.tsx` | 4 421 | 4 525 | +104 |
| `login.tsx` | 10 123 | 11 432 | +1 309 |
| `onboarding.tsx` | 7 277 | 7 407 | +130 |
| `privacy.tsx` | 6 025 | 6 223 | +198 |
| `register.tsx` | 8 374 | 8 341 | −33 |
| `reset-password.tsx` | 6 272 | 6 722 | +450 |
| `terms.tsx` | 6 010 | 6 208 | +198 |
| `verify-otp.tsx` | 4 280 | 4 383 | +103 |

### Dashboard routes (`app/(dashboard)/`)

| File | OLD | NEW | Δ |
|---|---:|---:|---:|
| `_layout.tsx` | 1 015 | 1 442 | +427 |
| `index.tsx` | 9 228 | 13 177 | **+3 949** |
| `all-calculations/index.tsx` | 2 169 | 3 745 | +1 576 |
| `chat/index.tsx` | 9 024 | 9 887 | +863 |
| `estimation-history/index.tsx` | 3 403 | 6 921 | **+3 518** (≈ doubled) |
| `projects/_layout.tsx` | 344 | 355 | +11 |
| `projects/index.tsx` | 9 549 | 11 233 | +1 684 |
| `projects/create.tsx` | 12 825 | 10 095 | **−2 730** (refactored / simplified) |
| `settings/index.tsx` | 12 567 | 13 304 | +737 |
| `settings/password.tsx` | 6 161 | 1 938 | **−4 223** (heavily refactored) |
| `settings/plans.tsx` | 14 281 | 19 387 | **+5 106** |
| `settings/subscription.tsx` | 10 311 | 16 315 | **+6 004** |

### Top-level routes

| File | OLD | NEW | Δ |
|---|---:|---:|---:|
| `app/_layout.tsx` | 4 701 | 6 386 | +1 685 |
| `app/index.tsx` | 547 | 562 | +15 |
| `app/+not-found.tsx` | 3 797 | 3 795 | −2 |

### Routes that did NOT change in content

- `app/(auth)/_layout.tsx`
- `app/(dashboard)/calculation-details/[id].tsx`
- `app/(dashboard)/chat/_layout.tsx`
- `app/(dashboard)/projects/[id]/categories.tsx`
- `app/(dashboard)/projects/[id]/category/[categoryId].tsx`
- `app/(dashboard)/projects/[id]/index.tsx`
- `app/(dashboard)/settings/_layout.tsx`

### Root-level config/asset files unchanged in content

- `app.json`, `eas.json`, `metro.config.js`
- `api-contract.html`, `verify_db.js`
- `.gitignore`

---

## 13. Content changes in **relocated** files (root → `src/`)

Every file that moved into `src/` was also modified. Highlights of biggest rewrites:

| File (NEW path) | OLD | NEW | Δ |
|---|---:|---:|---:|
| `src/context/LanguageContext.tsx` | 4 683 | 22 897 | **+18 214** (≈ 5× larger — likely full i18n rewrite) |
| `src/api/api.ts` | 7 435 | 20 577 | **+13 142** (≈ 2.8× larger) |
| `src/api/types.ts` | 3 825 | 11 361 | **+7 536** (≈ 3× larger) |
| `src/constants/translations/en.json` | 1 578 | 3 387 | +1 809 (more keys) |
| `src/api/authApi.ts` | 3 477 | 4 862 | +1 385 |
| `src/constants/theme.ts` | 1 125 | 2 452 | +1 327 |
| `src/context/AuthContext.tsx` | 6 443 | 7 986 | +1 543 |
| `src/components/ui/BaseInput.tsx` | 3 397 | 4 286 | +889 |
| `src/components/features/projects/ProjectsCard.tsx` | 4 416 | 5 463 | +1 047 |
| `src/components/common/Header.tsx` | 4 524 | 5 291 | +767 |
| `src/constants/config.ts` | 2 929 | 3 790 | +861 |
| `src/components/ui/BaseButton.tsx` | 3 517 | 3 969 | +452 |
| `src/services/authService.ts` | 2 155 | 2 526 | +371 |

Smaller but still modified: `BottomNav`, `Filter`, `ScreenShell`, `SplashScreenComponent`, `OnboardingCard`, `CalculationCard`, `ItemCard`, `EmptyState`, `LoadingOverlay`, `LoadingScreen`, `Logo`, `Styles.tsx`, `useLocalCalculations`, `useProjectDetail`, `useProjects`, `useUser`, `errorHandler`, `formatters`, `responsive`, `storage`, `supabase`.

### Translations

- `en.json` — modified (1 578 → 3 387 B, more strings)
- `ar.json` — **identical** in both projects (1 984 B, same hash)

> **Note:** every shared file was at least lightly edited during the move to `src/`. There is no file that was relocated *as-is*.

---

## 14. Quick "what didn't change at all" list

Useful if you only want to know what is safe to ignore:

- `app.json`, `eas.json`, `metro.config.js`, `.gitignore`
- `api-contract.html`, `verify_db.js`
- `app/(auth)/_layout.tsx`, `app/(dashboard)/settings/_layout.tsx`, `app/(dashboard)/chat/_layout.tsx`
- `app/(dashboard)/projects/[id]/index.tsx`, `categories.tsx`, `category/[categoryId].tsx`
- `app/(dashboard)/calculation-details/[id].tsx`
- `src/constants/translations/ar.json`

Everything else was either added, removed, moved, or rewritten.

