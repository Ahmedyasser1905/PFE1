/**
 * Smart base-URL detection for the Apex dev backend.
 *
 * Why this exists
 * ───────────────
 * In development the laptop hosting the Express server may be reachable
 * through different IPs depending on the active network:
 *   - Mobile Hotspot (laptop is the AP)  → 192.168.137.1
 *   - Home Wi-Fi router (LAN)            → 192.168.1.x
 *   - Emulator                           → 10.0.2.2 (Android) / localhost (iOS)
 *
 * Hard-coding a single value in `EXPO_PUBLIC_API_URL` means the app stops
 * working every time the network changes. This module probes a list of
 * candidate hosts in parallel, picks the first one that answers, and caches
 * the winning URL in AsyncStorage so the next launch is instant.
 *
 * Production is unaffected: in non-`__DEV__` builds we always return the
 * static `EXPO_PUBLIC_API_URL`.
 *
 * Public API
 * ──────────
 *   detectBaseUrl()      → Promise<string>  // probe + cache + return
 *   getCachedBaseUrl()   → string           // sync best-effort (env fallback)
 *   primeBaseUrlFromCache() → Promise<void> // call once at app boot
 *   setCachedBaseUrl(url)→ Promise<void>    // manual override (e.g. settings)
 *   resetCachedBaseUrl() → Promise<void>    // forget detection
 */
import { storage } from '~/utils/storage';
import {
  API_URLS,
  DEV_API_HOST_CANDIDATES,
  DEV_API_PORT,
  STORAGE_KEYS,
} from '~/constants/config';

// ─── Module-level cache (sync access) ─────────────────────────────────────────

// Hard "I'm loaded" beacon. If you don't see this in the Metro logs the
// instant the bundle starts, the new code is NOT running yet — Metro is
// serving a stale cache. Stop Metro and run `npx expo start -c`.
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[Network] module loaded, smart base-URL detection is ACTIVE');
}

const PROBE_TIMEOUT_MS = 2_000;

/**
 * The currently chosen base URL. Synchronously readable.
 * Initialised to the static env URL so calls that happen before detection
 * completes still get a sensible value.
 */
let currentBaseUrl: string = __DEV__ ? API_URLS.DEVELOPMENT : API_URLS.PRODUCTION;

let detectionPromise: Promise<string> | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log = (...args: unknown[]) => {
  if (__DEV__) console.log('[Network]', ...args);
};

/**
 * Build the full /api URL for a given host.
 */
const toApiUrl = (host: string, port: number = DEV_API_PORT): string => {
  // Allow callers to pass a fully-formed URL through unchanged
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host.replace(/\/+$/, '');
  }
  return `http://${host}:${port}/api`;
};

/**
 * Probe a single base URL. Resolves to the URL if any HTTP response is
 * received within the timeout (any status counts — even 404 proves the
 * server stack works), or rejects on timeout / network error.
 */
const probeBaseUrl = async (
  baseUrl: string,
  timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // GET on the api root. The server's 404 fallback handler answers fast,
    // which is exactly what we want — we just need any HTTP response.
    const res = await fetch(baseUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    log(`probe ok: ${baseUrl} (status ${res.status})`);
    return baseUrl;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Race a list of base URLs in parallel. Resolves with the FIRST one that
 * answers. Rejects only if all probes fail.
 */
const raceBaseUrls = async (urls: string[]): Promise<string> => {
  if (urls.length === 0) throw new Error('No candidate URLs to probe');

  return new Promise<string>((resolve, reject) => {
    let pending = urls.length;
    let settled = false;

    urls.forEach((url) => {
      probeBaseUrl(url)
        .then((winner) => {
          if (settled) return;
          settled = true;
          resolve(winner);
        })
        .catch(() => {
          pending -= 1;
          if (pending === 0 && !settled) {
            settled = true;
            reject(new Error(`All ${urls.length} candidates failed`));
          }
        });
    });
  });
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Synchronous best-effort getter. Returns the most recently resolved/cached
 * base URL, falling back to the env value. Safe to call before detection.
 */
export const getCachedBaseUrl = (): string => currentBaseUrl;

/**
 * Manually override the resolved base URL (e.g. from a "Custom server"
 * settings screen). Persists for next launch.
 */
export const setCachedBaseUrl = async (url: string): Promise<void> => {
  currentBaseUrl = url;
  try {
    await storage.setItem(STORAGE_KEYS.RESOLVED_API_URL, url);
  } catch {
    // Storage failures are non-fatal; in-memory value is still updated.
  }
};

/**
 * Forget any previously cached resolution. Next `detectBaseUrl()` call will
 * re-probe from scratch.
 */
export const resetCachedBaseUrl = async (): Promise<void> => {
  detectionPromise = null;
  try {
    await storage.deleteItem(STORAGE_KEYS.RESOLVED_API_URL);
  } catch {}
};

/**
 * Hydrate the in-memory cache from AsyncStorage. Call once at app startup
 * (e.g. in the root layout) so the very first request can use the last
 * known good URL while detection runs in the background.
 */
export const primeBaseUrlFromCache = async (): Promise<void> => {
  try {
    const cached = await storage.getItem(STORAGE_KEYS.RESOLVED_API_URL);
    if (cached) {
      currentBaseUrl = cached;
      log('primed from storage:', cached);
    }
  } catch {}
};

/**
 * Resolve the working base URL. Order of preference:
 *   1. User-configured custom URL (settings screen)        — highest priority
 *   2. Production env URL (in production builds)           — short-circuit
 *   3. Cached resolved URL from a previous launch          — verified by probe
 *   4. EXPO_PUBLIC_API_URL / EXPO_PUBLIC_DEV_API_URL       — verified by probe
 *   5. DEV_API_HOST_CANDIDATES list (parallel race)
 *   6. Final fallback: static env URL (no detection succeeded)
 *
 * The result is memoised for the rest of the session and persisted to
 * AsyncStorage. Subsequent calls return immediately.
 */
export const detectBaseUrl = (): Promise<string> => {
  if (detectionPromise) return detectionPromise;

  detectionPromise = (async () => {
    // 1. Custom URL set by the user wins absolutely
    try {
      const custom = await storage.getItem(STORAGE_KEYS.CUSTOM_SERVER_URL);
      if (custom) {
        log('using custom server URL:', custom);
        currentBaseUrl = custom;
        return custom;
      }
    } catch {}

    // 2. Production: never probe, always trust env
    if (!__DEV__) {
      currentBaseUrl = API_URLS.PRODUCTION;
      return currentBaseUrl;
    }

    // 3. Build candidate list (preserve insertion order, dedupe)
    const seen = new Set<string>();
    const candidates: string[] = [];
    const push = (u: string | null | undefined) => {
      if (!u) return;
      const norm = u.replace(/\/+$/, '');
      if (!seen.has(norm)) {
        seen.add(norm);
        candidates.push(norm);
      }
    };

    // last-known good (from previous launch)
    try {
      push(await storage.getItem(STORAGE_KEYS.RESOLVED_API_URL));
    } catch {}

    // explicit env URLs
    push(API_URLS.DEVELOPMENT);
    push(API_URLS.PRODUCTION);

    // hostname candidates
    DEV_API_HOST_CANDIDATES.forEach((host) => push(toApiUrl(host)));

    log('probing candidates:', candidates);

    // 4. Race them in parallel
    try {
      const winner = await raceBaseUrls(candidates);
      log('winner:', winner);
      currentBaseUrl = winner;
      try {
        await storage.setItem(STORAGE_KEYS.RESOLVED_API_URL, winner);
      } catch {}
      return winner;
    } catch (err) {
      // 5. Nothing answered — keep whatever we had and let the request fail
      // with a real network error. Reset the promise so the NEXT call
      // re-probes (the network may have come back).
      detectionPromise = null;
      log('detection failed, falling back to', currentBaseUrl, err);
      return currentBaseUrl;
    }
  })();

  return detectionPromise;
};
