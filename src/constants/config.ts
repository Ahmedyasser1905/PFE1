/**
 * Apex — Centralized Configuration Constants
 *
 * All magic strings, storage keys, enums, and app-level config live here.
 * Never write these inline in screens or services.
 */

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  USER_LANGUAGE: 'userLanguage',
  CUSTOM_SERVER_URL: 'customServerUrl',
  ONBOARDING_COMPLETED: 'hasCompletedOnboarding_v6',
  CALCULATIONS: '@apex_calculations',
  TRANSLATIONS: 'app_translations',
  RESOLVED_API_URL: '@apex_resolved_api_url',
} as const;

// ─── Dev-mode candidate hosts for auto-detection ──────────────────────────────
// In development the app probes these in order and uses the first one that
// answers. You can override the whole list via EXPO_PUBLIC_DEV_API_HOSTS
// (comma-separated, e.g. "192.168.137.1,192.168.1.11").
export const DEV_API_PORT = Number(process.env.EXPO_PUBLIC_DEV_API_PORT) || 5000;

export const DEV_API_HOST_CANDIDATES: string[] = (() => {
  const fromEnv = (process.env.EXPO_PUBLIC_DEV_API_HOSTS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return [
    '192.168.137.1', // laptop Mobile-Hotspot gateway
    '192.168.1.7',   // current home Wi-Fi LAN
    '192.168.1.11',  // home Wi-Fi LAN (alt)
    '192.168.1.1',
    '192.168.0.1',
    '10.0.2.2',      // Android emulator → host loopback
    '127.0.0.1',     // iOS simulator
    'localhost',
  ];
})();

// ─── App Config ───────────────────────────────────────────────────────────────

export const APP_CONFIG = {
  CURRENCY: 'DA',
  CURRENCY_LOCALE: 'fr-DZ',
  DEFAULT_LANGUAGE: 'en' as const,
  SUPPORTED_LANGUAGES: ['en', 'ar'] as const,
  API_TIMEOUT_MS: 15_000,
  NETWORK_RETRY_COUNT: 2,
  NETWORK_RETRY_DELAY_MS: 1_000,
} as const;

// ─── API URLs ─────────────────────────────────────────────────────────────────

export const API_URLS = (() => {
  const RAILWAY_URL = 'https://pfe1-production.up.railway.app/api';
  return {
    /**
     * PRODUCTION Cloud Backend URL
     */
    PRODUCTION: RAILWAY_URL,

    /**
     * DEVELOPMENT Backend URL
     * Hardcoded to use the production URL for all development as requested.
     */
    DEVELOPMENT: RAILWAY_URL,
  };
})();

// ─── Project Enums ────────────────────────────────────────────────────────────

export const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  COMPLETED: 'completed', // some API responses use lowercase
} as const;

export type ProjectStatusType = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// ─── Budget Options ───────────────────────────────────────────────────────────

export const BUDGET_TYPE = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type BudgetType = typeof BUDGET_TYPE[keyof typeof BUDGET_TYPE];

export const BUDGET_OPTIONS = [
  { id: BUDGET_TYPE.LOW, label: 'Low Budget', subLabel: 'Cost-effective materials', value: 1 },
  { id: BUDGET_TYPE.MEDIUM, label: 'Medium Budget', subLabel: 'Balanced cost and quality', value: 2 },
  { id: BUDGET_TYPE.HIGH, label: 'High Budget', subLabel: 'Premium materials', value: 3 },
] as const;
