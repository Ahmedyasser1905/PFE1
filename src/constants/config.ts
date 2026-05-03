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
    '192.168.1.11',  // home Wi-Fi LAN
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
  const production = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend-domain.com/api';
  const development = process.env.EXPO_PUBLIC_DEV_API_URL || '';

  // If the dev URL is not set, warn loudly in development mode so
  // "Network Error" problems are immediately traced to misconfiguration.
  if (__DEV__ && !development) {
    console.warn(
      '[Config] EXPO_PUBLIC_DEV_API_URL is not set in your .env file. ' +
      'Network requests will fail. Set it to your machine\'s local IP ' +
      '(e.g. http://192.168.x.x:5000/api) and restart Expo.'
    );
  }

  return {
    /**
     * PRODUCTION Cloud Backend URL
     * This handles users who build the APK/AAB or run in production mode.
     * Add the real domain to .env or keep the Vercel/Cloud URL here.
     */
    PRODUCTION: production,

    /**
     * DEVELOPMENT Backend URL
     * Automatically targets localhost or a specific IP in development mode.
     * If not set, falls back to localhost (works for emulators, NOT physical devices).
     */
    DEVELOPMENT: development || 'http://localhost:5000/api',
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
