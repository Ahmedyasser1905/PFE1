# BUILDEST — Frontend ↔ Backend Integration Plan

> **Constraint:** No server files may be modified. All changes are frontend-only.

---

## 1. Project Overview

| Layer | Technology | Location |
|---|---|---|
| Frontend | React Native + Expo Router (SDK ~52) | `app/`, `src/` |
| Backend | Node.js + Express + PostgreSQL | `server/` |
| Live API | Railway cloud | `https://pfe1-production.up.railway.app/api` |
| Auth | JWT (access + refresh tokens) | `server/routes/auth/` |
| File uploads | Multer (memory storage) | `POST /api/projects` |
| AI | Groq SDK | `server/routes/Ai/` |

The backend is already deployed. The frontend has a complete API layer (`src/api/`) and a smart URL-detection utility (`src/utils/network.ts`). The task is to ensure every screen reliably talks to the correct endpoint with the right payload, and that edge cases (no subscription, expired token, offline) are handled gracefully.

---

## 2. Environment Setup

### 2.1 `.env` — Required Variables

The file already exists at the project root. Verify these values before any test run:

```
EXPO_PUBLIC_API_URL=https://pfe1-production.up.railway.app/api
EXPO_PUBLIC_DEV_API_URL=https://pfe1-production.up.railway.app/api

EXPO_PUBLIC_SUPABASE_URL=https://jfqcfvmjjeduimybqoxz.supabase.co
# ⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY — must be added (currently missing)

JWT_ACCESS_SECRET=pfe_access_secret_2026_dev
JWT_REFRESH_SECRET=pfe_refresh_secret_2026_dev

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seosolutions172@gmail.com
SMTP_PASS=bqme rtyx hwwi cxgg
FROM_EMAIL="Apex <noreply@apex.com>"

GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

> ⚠️ **Missing key:** `EXPO_PUBLIC_SUPABASE_ANON_KEY` is commented out. Add the anon key for the project `jfqcfvmjjeduimybqoxz` from the Supabase dashboard.

### 2.2 Running the Stack

```bash
# Start backend (from project root — script added in package.json)
npm run server          # runs: cd server && npm run dev

# Start frontend
npx expo start
npx expo start -c       # clear Metro cache when changing .env
```

---

## 3. URL Resolution Strategy

The URL detection logic lives in `src/utils/network.ts` and works as follows:

1. Custom URL set in Settings screen (stored in AsyncStorage)
2. Production URL (`EXPO_PUBLIC_API_URL`) — probed first with a 4 s timeout
3. Last cached URL from a previous successful probe
4. LAN candidates listed in `src/constants/config.ts → DEV_API_HOST_CANDIDATES`
5. Final fallback: production URL

**To switch to a local backend during development**, add your machine's LAN IP to `DEV_API_HOST_CANDIDATES` in `src/constants/config.ts`, or use the Settings screen's custom server URL field at runtime. No other files need to change.

---

## 4. Authentication Flow

### 4.1 Endpoints Used

| Action | Frontend Call | Backend Route |
|---|---|---|
| Register | `authApi.register(payload)` | `POST /api/register` |
| Login | `authApi.login(credentials)` | `POST /api/login` |
| Refresh | `authApi.refreshToken(token)` | `PUT /api/refresh` |
| Logout | — (clears storage only) | `POST /api/logout` |
| Forgot password | `authApi.forgotPassword(email)` | `POST /api/forgot-password` |
| Verify OTP | `authApi.verifyOtp(email, token)` | `GET /api/verify-reset-token?token=` |
| Reset password | `authApi.resetPassword(data)` | `POST /api/reset-password` |
| Get profile | `usersApi.getProfile()` | `GET /api/me` |

### 4.2 Token Storage

Tokens are stored via `src/utils/storage.ts` under these keys (defined in `src/constants/config.ts`):

| Key | Purpose |
|---|---|
| `userToken` | JWT access token — sent as `Bearer <token>` on every authenticated request |
| `refreshToken` | JWT refresh token — used only by `authService.refreshToken()` |
| `userData` | Serialized `User` object — restored on app boot |

### 4.3 Automatic Token Refresh

The axios instance in `src/api/api.ts` intercepts every `401` response and:
1. Calls `authService.refreshToken()` to exchange the stored refresh token for a new access token.
2. Queues all concurrent requests and retries them with the new token.
3. On definitive failure (no refresh token, second 401), calls `authService.handleInvalidToken()` which clears storage and shows a "Session Expired" global feedback popup.

**No changes needed.** The mechanism is complete.

### 4.4 Request Payload Contracts

**Register** (`POST /api/register`):
```json
{ "name": "string (min 3)", "email": "valid email", "password": "string", "role": "client" }
```

**Login** (`POST /api/login`):
```json
{ "email": "valid email", "password": "string" }
```

**Refresh** (`PUT /api/refresh`):
```json
{ "refreshToken": "<stored refresh token>" }
```

**Reset Password** (`POST /api/reset-password`):
```json
{ "token": "<OTP token>", "newPassword": "string" }
```

---

## 5. Subscription & Plans Flow

### 5.1 Endpoints Used

| Action | Frontend Call | Backend Route |
|---|---|---|
| Get plans | `plansApi.getAll()` | `GET /api/plans` |
| Get plan features | `plansApi.getFeatures(id)` | `GET /api/plans/:id` |
| Subscribe to plan | `subscriptionApi.create(planId)` | `POST /api/subscriptions` |
| Get my subscription | `subscriptionApi.getMine()` | `GET /api/subscriptions/me` |
| Get usage | `subscriptionApi.getUsage()` | `GET /api/subscriptions/me/usage` |
| Request plan switch | `subscriptionApi.switchPlan(planId)` | `PATCH /api/subscriptions/switch` |
| Confirm plan switch | `subscriptionApi.confirmSwitchPlan(token)` | `POST /api/subscriptions/switch/confirm` |

### 5.2 Global Subscription Gate

`src/context/SubscriptionContext.tsx` wraps the whole dashboard. It exposes:

- `hasSubscription` — whether a subscription row exists
- `isSubscriptionActive` — `status === 'ACTIVE'`
- `canCreateProject` — checks `usage.projectsLimit`
- `canCalculate` — checks `usage.leafCalculationsLimit`
- `canUseAI` — checks `usage.aiUsageLimit`

Any screen that creates a project, performs a calculation, or calls the AI expert **must** read from `useSubscriptionContext()` before proceeding. If the user has no active subscription, the backend will return a `403` with `code: 'NO_SUBSCRIPTION'`, which the global feedback system will intercept and show a "View Plans" prompt.

### 5.3 Important Edge Case: 409 on Subscribe

If the user already has a subscription and calls `POST /api/subscriptions` again, the backend returns HTTP `409 Conflict`. The frontend handles this by silently calling `subscriptionApi.getMine()` instead of crashing.

---

## 6. Categories & Estimation Flow

### 6.1 Endpoints Used

| Action | Frontend Call | Backend Route |
|---|---|---|
| Get root categories | `estimationApi.getCategories()` | `GET /api/categories` |
| Get category children | `estimationApi.getCategoryChildren(id)` | `GET /api/categories/:id/children` |
| Get leaf detail | `estimationApi.getCategoryLeaf(id)` | `GET /api/categories/:id/leaf` |
| Calculate preview | `estimationApi.calculatePreview(data)` | `POST /api/calculate` |
| Save leaf result | `estimationApi.saveLeaf(data)` | `POST /api/estimation/save-leaf` |
| Delete leaf | `estimationApi.deleteLeaf(projectDetailsId)` | `DELETE /api/estimation/leaf` |

### 6.2 Categories Layout Rule

Each category must be displayed on **a single dedicated line**, with **two categories per row** across the screen. Apply this layout to `app/(dashboard)/projects/[id]/categories.tsx` and any other screen rendering category lists:

```tsx
// Wrap the category list in a two-column FlatList or a wrapped row View

// Option A — FlatList (recommended)
<FlatList
  data={categories}
  numColumns={2}
  keyExtractor={(item) => item.categoryId}
  renderItem={({ item }) => (
    <CategoryCard
      item={item}
      onPress={handlePress}
      calcCount={getCalcCount(item.categoryId)}
    />
  )}
  columnWrapperStyle={styles.row}
/>

// Option B — manual row grouping
const rows = [];
for (let i = 0; i < categories.length; i += 2) {
  rows.push(categories.slice(i, i + 2));
}
// Then map rows → each renders two CategoryCard side-by-side

// Styles
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,          // each card takes exactly half the row
    marginHorizontal: 6,
  },
});
```

This rule applies to every screen that lists categories:
- `app/(dashboard)/projects/[id]/categories.tsx`
- `app/(dashboard)/index.tsx` (home screen category shortcuts, if any)

### 6.3 Calculate Payload Contract

`POST /api/calculate` requires (validated by `CalculationInputSchema`):
```json
{
  "category_id": "<UUID>",
  "selected_formula_id": "<UUID>",
  "selected_config_id": "<UUID or null>",
  "field_values": { "<fieldId>": <number> }
}
```
`field_values` must not be empty and every value must be a number.

### 6.4 Save Leaf Payload Contract

`POST /api/estimation/save-leaf` requires (validated by `SaveLeafResultSchema`):
```json
{
  "project_id": "<UUID>",
  "category_id": "<UUID>",
  "selected_formula_id": "<UUID>",
  "selected_config_id": "<UUID or null>",
  "project_details_id": "<UUID or null>",
  "field_values": { "<fieldId>": <number> },
  "formula_version_snapshot": <integer>,
  "results": { "<key>": <value> },
  "material_lines": [
    {
      "material_id": "<UUID>",
      "material_name": "string",
      "material_type": "PRIMARY | ACCESSORY",
      "quantity": <number ≥ 0>,
      "applied_waste": <number ≥ 0>,
      "quantity_with_waste": <number ≥ 0>,
      "unit_price_snapshot": <number ≥ 0>,
      "waste_factor_snapshot": <number ≥ 0>,
      "sub_total": <number ≥ 0>
    }
  ],
  "service_lines": [],
  "leaf_total": <number ≥ 0>
}
```

> ⚠️ **Known issue:** Never pass `undefined` for numeric fields. Always coerce with `Number(value) || 0` before building the payload. Failure to do so causes a Zod validation error (`400 Bad Request`).

### 6.5 Delete Leaf Payload

`DELETE /api/estimation/leaf` sends the body:
```json
{ "project_details_id": "<UUID>" }
```

---

## 7. Projects Flow

### 7.1 Endpoints Used

| Action | Frontend Call | Backend Route |
|---|---|---|
| List projects | `estimationApi.listProjects()` | `GET /api/projects` |
| Get one project | `estimationApi.getProject(id)` | `GET /api/projects/:id` |
| Create project | `estimationApi.createProject(data)` | `POST /api/projects` |
| Get estimation | `estimationApi.getProjectEstimation(id)` | `GET /api/projects/:id/estimation` |
| Export report | `estimationApi.exportProject(id)` | `GET /api/projects/:id/export` |

### 7.2 Creating a Project with an Image

The backend uses `multer` (`memoryStorage`) on `POST /api/projects`. When the user selects an image, the payload **must** be `FormData`, not JSON. The frontend already routes this correctly via `uploadFormData()` (which uses native `fetch`, not axios, to avoid the React Native bridgeless-mode XHR bug).

```ts
// Correct — with image
const formData = new FormData();
formData.append('name', projectName);
formData.append('description', description);
formData.append('budget_type', 'MEDIUM');
formData.append('image', {
  uri: imageUri,
  name: 'project.jpg',
  type: 'image/jpeg',
} as any);

await estimationApi.createProject(formData);

// Correct — without image
await estimationApi.createProject({
  name: projectName,
  description,
  budget_type: 'MEDIUM',
});
```

The `CreateProjectSchema` on the server validates: `name` (required, max 200), `description` (optional, max 1000), `budget_type` (LOW | MEDIUM | HIGH, default MEDIUM), `total_budget` (optional positive number).

### 7.3 Subscription Gate on Projects

`GET /api/projects` and `POST /api/projects` both go through `checkSubscription`. Free-plan users (no active subscription) receive a `403` / `NO_SUBSCRIPTION`. The frontend `useProjects` hook already handles this by setting `projects = []` silently — no error toast for this case.

---

## 8. AI Chat Flow

### 8.1 Endpoints Used

| Action | Frontend Call | Backend Route |
|---|---|---|
| Get suggested questions | `chatApi.getRecommendedQuestions(location)` | `POST /api/ai/questions` |
| Get FAQ answer | `chatApi.getFAQAnswer(questionId, language)` | `POST /api/ai/faq/:questionId` |
| Send expert message | `chatApi.sendMessage(message)` | `POST /api/ai/expert` |

### 8.2 Payload Contracts

**`POST /api/ai/questions`:**
```json
{ "display_location": "home | project | category | chat" }
```

**`POST /api/ai/faq/:questionId`:**
```json
{ "language": "en | ar" }
```

**`POST /api/ai/expert`:**
```json
{ "user_message": "string" }
```

### 8.3 Usage Gating

The `/expert` endpoint goes through `checkSubscription` and `checkUsage('ai_usage_limit')`. Before calling `chatApi.sendMessage()`, check `canUseAI` from `useSubscriptionContext()` and show a prompt if `false`. After a successful call, call `incrementAIUsage()` from the context to update usage counts locally without a refetch.

---

## 9. API Response Envelope

All backend responses follow one of two envelope shapes. The axios interceptor in `src/api/api.ts` unwraps them automatically — hooks and screens always receive plain data, never the envelope:

```json
// Standard
{ "status": "ok", "data": <payload> }

// Subscription endpoints
{ "success": true, "data": <payload> }

// Errors
{ "error": { "message": "string", "code": "string" } }
```

---

## 10. Data Mapping Layer

All raw backend responses (snake_case) pass through `src/api/mappers.ts` before reaching hooks or UI. **Never import `Raw*` types in screens.** The mapping chain is:

```
Backend JSON → Raw* type → mapper function → Clean domain type → hook → screen
```

| Raw type | Mapper | Clean type |
|---|---|---|
| `RawProject` | `mapProjectFromAPI` | `Project` |
| `RawCategory` | `mapCategoryFromAPI` | `Category` |
| `RawUser` | `mapUserFromAPI` | `User` |
| `RawCalculationResult` | `mapCalculationResultFromAPI` | `CalculationResult` |
| `RawEstimationReport` | `mapEstimationFromAPI` | `EstimationReport` |
| `RawSubscription` | `mapSubscriptionFromAPI` | `Subscription` |
| `RawUsage` | `mapUsageFromAPI` | `Usage` |
| `RawPlan` | `mapPlanFromAPI` | `Plan` |

**Critical rule:** Always coerce numeric fields with `Number(raw.field ?? 0)` in mappers. The PostgreSQL driver can return numeric types as strings in some pool configurations, causing budget and cost values to display as `0` in the UI if cast directly.

---

## 11. Error Handling System

The global feedback system (`src/context/FeedbackContext.tsx`) is called by the axios response interceptor automatically. Screens do not need to implement their own toasts for network errors. The interceptor handles:

| Condition | Global Feedback Action |
|---|---|
| `401` (after refresh failure) | "Session Expired" → Login |
| `400` | "Invalid Request" with server message |
| `403` or `NO_SUBSCRIPTION` | "Subscription Required" → View Plans |
| `404` | Suppressed (silent — expected for new accounts) |
| `500` | "Server Error" |
| Network Error | "Connection Issue" + URL cache reset |

Subscription errors on subscription/project endpoints are **silenced** at the interceptor level and handled locally in `useSubscription` and `useProjects` hooks, to avoid spamming free-plan users with error popups on every login.

---

## 12. Known Issues & Frontend-Side Fixes

These are bugs identified in `project_plan.md` that must be addressed in the frontend without changing backend files:

### 12.1 Numeric Fields Showing as `0`

**Cause:** PostgreSQL's `numeric` type can be returned as a string by the connection pool. Mappers that cast directly to a type without `Number()` coercion produce `0`.

**Fix:** In `src/api/mappers.ts`, ensure every monetary/count field uses:
```ts
totalCost: Number(raw?.total_cost ?? 0),
leafCount:  Number(raw?.leaf_count  ?? 0),
totalBudget: Number(raw?.total_budget ?? 0),
```
These coercions are already in the code for most fields. Audit all mappers to confirm no field is missing them.

### 12.2 Navigation Crash on Login → Dashboard Transition

**Cause:** `NativeStackNavigator` reads navigation state before `AuthContext` has finished hydrating, producing `TypeError: Cannot read property 'stale' of undefined`.

**Fix (frontend only):** In `app/_layout.tsx`, render a loading screen until `AuthContext.loading` is `false`:
```tsx
const { loading } = useAuth();
if (loading) return <SplashScreen />;  // or ActivityIndicator
```
This prevents the navigator from mounting before auth state is known.

### 12.3 Save Leaf — Undefined Numeric Values

**Cause:** If formula fields return `undefined` or `NaN`, the Zod schema on the server (`SaveLeafResultSchema`) rejects the payload with a `400`.

**Fix:** Before calling `estimationApi.saveLeaf()`, sanitize the payload:
```ts
const sanitizedFieldValues = Object.fromEntries(
  Object.entries(fieldValues).map(([k, v]) => [k, Number(v) || 0])
);
const sanitizedLeafTotal = Number(leafTotal) || 0;
```

---

## 13. Settings Screen — Personal Info

`PATCH /api/settings` (from `server/routes/auth/settings.js`) is used by the personal info screen. No image upload is involved here. Send JSON:
```json
{ "name": "string", "language": "en | ar" }
```

---

## 14. Integration Checklist

Use this list to verify each integration point end-to-end:

**Authentication**
- [ ] Register → tokens stored → dashboard loads
- [ ] Login → tokens stored → profile fetched from `/me`
- [ ] Token expiry → silent refresh → request retried
- [ ] Logout → storage cleared → redirected to login
- [ ] Forgot password email sent → OTP verified → password reset

**Subscription**
- [ ] Plans screen lists all plans from `/api/plans`
- [ ] Subscribe → `POST /api/subscriptions` → 409 handled gracefully
- [ ] Subscription status visible in settings
- [ ] Usage counters update after project create / calculation / AI call

**Projects**
- [ ] Project list loads (empty for free users — no error popup)
- [ ] Create project (JSON, no image)
- [ ] Create project (FormData, with image) — uses native `fetch`, not axios
- [ ] Project detail loads `GET /api/projects/:id`
- [ ] Estimation report loads `GET /api/projects/:id/estimation`
- [ ] Export project triggers `GET /api/projects/:id/export`

**Categories**
- [ ] Root categories load from `/api/categories`
- [ ] Category children load from `/api/categories/:id/children`
- [ ] Leaf detail loads from `/api/categories/:id/leaf` (includes formulas + configs)
- [ ] **Two categories displayed per row on each category screen**

**Estimation**
- [ ] Calculate preview works (all field values are numbers, not undefined)
- [ ] Save leaf — payload passes Zod validation (no undefined numeric fields)
- [ ] Delete leaf removes entry and refreshes project total

**AI Chat**
- [ ] Suggested questions load per screen location
- [ ] FAQ answers load by question ID
- [ ] Expert chat calls Groq via `/api/ai/expert` (subscription + usage checked first)

**Error Handling**
- [ ] Network error shows "Connection Issue" global popup
- [ ] 401 after failed refresh redirects to login
- [ ] 403/NO_SUBSCRIPTION shows "Subscription Required" popup with "View Plans"
- [ ] 400 shows server validation message

---

## 15. Folder Reference

```
BUILDEST-main/
├── .env                         ← API URLs, JWT secrets, SMTP, Cloudinary
├── app/
│   ├── (auth)/                  ← Login, Register, OTP, Reset, Onboarding
│   └── (dashboard)/
│       ├── index.tsx            ← Home screen
│       ├── projects/
│       │   ├── index.tsx        ← Project list
│       │   ├── create.tsx       ← Create project form
│       │   └── [id]/
│       │       ├── index.tsx    ← Project detail
│       │       ├── categories.tsx  ← Category browser (2-per-row layout)
│       │       └── category/
│       │           └── [categoryId].tsx  ← Leaf calculation screen
│       ├── chat/index.tsx       ← AI chat
│       ├── estimation-history/  ← All past estimations
│       └── settings/            ← Profile, password, plans, subscription
├── src/
│   ├── api/
│   │   ├── api.ts               ← Axios instance + all API calls
│   │   ├── authApi.ts           ← Separate axios instance for auth (no interceptors)
│   │   ├── mappers.ts           ← Raw → Clean type conversions
│   │   ├── types.ts             ← Raw* and Clean domain types
│   │   └── mockData.ts          ← Fallback data when server is unreachable
│   ├── constants/
│   │   └── config.ts            ← STORAGE_KEYS, API_URLS, DEV candidates
│   ├── context/
│   │   ├── AuthContext.tsx       ← User auth state
│   │   ├── SubscriptionContext.tsx ← Subscription + usage gate
│   │   ├── LanguageContext.tsx   ← i18n
│   │   └── FeedbackContext.tsx   ← Global error/success popups
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useProjectDetail.ts
│   │   ├── useSubscription.ts
│   │   └── useUser.ts
│   ├── services/
│   │   └── authService.ts       ← Token storage + refresh logic
│   └── utils/
│       ├── network.ts           ← Smart base-URL detection
│       └── storage.ts           ← AsyncStorage wrapper
└── server/                      ← Backend — DO NOT MODIFY
    ├── app.js                   ← Express app
    ├── routes/                  ← All route definitions
    ├── controllers/             ← Business logic
    ├── middlewares/             ← authenticate, checkSubscription, checkUsage
    ├── schemas/                 ← Zod validation schemas
    └── engine/                  ← Stateless calculation engine
```
