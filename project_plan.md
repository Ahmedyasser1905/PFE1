# Apex Project Plan & Analysis

This document provides a comprehensive overview of the current state of the project, including its existing architecture, required modifications, and known errors. It is based on a static analysis of the codebase and recent debugging history.

---

## 1. What Exists in the Project

The project is structured as a full-stack monorepo application consisting of a mobile frontend and a Node.js backend.

### **Frontend (Expo / React Native)**
- **Framework**: React Native with Expo (SDK ~52.0).
- **Routing**: Uses `expo-router` for file-based navigation (located in the `app/` directory), separated into `(auth)` for login flows and `(dashboard)` for authenticated client flows.
- **Client-Only Architecture**: Admin flows have been removed to enforce a strict client-only environment.
- **API Communication**: The frontend communicates with the backend via Axios, using an API mapper (`api/mappers.ts`) to translate between frontend camelCase models and backend snake_case contracts.
- **State & Assets**: Uses Context API (`context/`), custom hooks (`hooks/`), and native components (`components/`). Assets and translations are managed locally.

### **Backend (Node.js / Express)**
- **Architecture**: Located in the `server/` directory, following an MVC-like structure with `routes`, `controllers`, and `services`.
- **Database**: PostgreSQL (using `postgres` and `pg` modules), managed with custom scripts and migrations.
- **Core Modules**:
  - **Auth & Subscription**: Handles user registration, sessions, and plan management.
  - **External Services**: Manages resources like materials and services.
  - **Calculation Engine**: A dedicated stateless engine (`server/engine/`) that computes project estimations based on categories, formulas, and material configs.
  - **Admin**: Modules for managing categories, formulas, fields, units, and outputs.
  - **AI Chat**: Integrates `groq-sdk` for AI-assisted chat functionalities.
- **Middlewares**: Includes language detection, error handling, and authentication validation.

---

## 2. What Modifications are Needed

Based on the project's evolution and current configuration, the following modifications are recommended:

### **Backend Modifications**
1. **ESLint Migration**: The backend uses ESLint v9 but relies on legacy configuration formatting. A new `eslint.config.js` (Flat Config) must be created, or ESLint must be downgraded to v8 to restore linting capabilities.
2. **Database Schema Mapping Consistency**: Ensure that all database queries consistently map distinct schema columns (e.g., `output_label_en`, `output_label_ar`) to the unified contract names expected by the frontend (`output_label`).

### **Frontend Modifications**
1. **Data Integrity for Numeric Fields**: Ensure that numeric values (like `total_cost` or `budget`) returned by the backend do not default to `0` or `undefined` during the mapping phase in `api/mappers.ts`. The mapping layer needs robust type coercion guards.
2. **Navigation Stabilization**: The `NativeStackNavigator` throws stale state errors occasionally on boot. The authentication state transition needs to be debounced or conditionally rendered safely to ensure the router only mounts the dashboard once state is fully hydrated.
3. **Calculation Orchestration**: Strengthen the payload creation when saving an estimation (e.g., `saveLeaf` API call). Ensure fallback mechanisms prevent `undefined` values in calculation parameters to strictly adhere to the backend contract.
4. **Network Configuration Resilience**: Abstract the development IP configuration (`EXPO_PUBLIC_DEV_API_URL`) more dynamically to prevent "Network Errors" when the developer machine's IP changes.

---

## 3. What Errors It Contains

Currently, the following active or recurring errors are identified in the system:

1. **Backend Linting Error (Active)**
   - **Error**: `ESLint couldn't find an eslint.config.(js|mjs|cjs) file.`
   - **Cause**: The `package.json` specifies ESLint `^9.39.2`, which dropped support for `.eslintrc` out of the box in favor of the new flat config.

2. **Numeric Data Zeroing (Frontend - Data Flow Error)**
   - **Error**: Project budget and estimation values appear as `0` in the UI despite being accurate in the database.
   - **Cause**: Potential improper default value overrides or strict typing mismatches in the API mapper layer.

3. **Navigation Crash (Frontend - State Error)**
   - **Error**: `TypeError: Cannot read property 'stale' of undefined` inside `NativeStackNavigator`.
   - **Cause**: Occurs during the initialization of the `(dashboard)` layout, often stemming from an improper navigation state container during the login-to-dashboard transition.

4. **Missing Database Columns (Backend - Query Error)**
   - **Error**: `column "output_label" does not exist`.
   - **Cause**: Found in certain dynamic services (like `modules.service.js`). The raw SQL attempts to query `output_label` directly instead of aliasing `output_label_en` or `output_label_ar`. 

---

### *Note*
*No server-side code files or configurations have been altered during this analysis. All findings are derived from static codebase exploration, recent logs, and terminal outputs.*
