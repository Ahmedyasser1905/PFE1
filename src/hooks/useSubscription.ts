/**
 * useSubscription — Fetches live subscription and usage data from the backend.
 *
 * Replaces all hardcoded subscription data in the settings screens.
 * Uses the same architecture as useProjects: fetch on mount + pull-to-refresh.
 */
import { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '~/api/api';
import type { Subscription, Usage } from '~/api/types';
import { parseError } from '~/utils/errorHandler';

interface UseSubscriptionResult {
  subscription: Subscription | null;
  usage: Usage | null;
  loading: boolean;
  error: string | null;
  hasSubscription: boolean;
  refresh: () => Promise<void>;
  incrementCalculationUsage: () => void;
  incrementAIUsage: () => void;
}

import { useAuth } from '~/context/AuthContext';

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();
  // Depend on a stable identity, not the user object reference. AuthContext
  // calls setUser twice during startup (storage restore -> profile verify),
  // and each call swaps the object reference. Without this, the effect below
  // re-fires and we fetch /subscriptions/me + /usage twice on every login.
  const userId = user?.id ?? null;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // ─── Step 1: Fetch subscription ───────────────────────────────────
      // Free-plan users have NO subscription row in the database.
      // The server returns 404 (getMine → notFound) or 403 (checkSubscription
      // → NO_SUBSCRIPTION). Both are valid "no subscription" states.
      let subData = null;
      try {
        subData = await subscriptionApi.getMine();
      } catch (subErr: any) {
        const subStatus = subErr?.status || subErr?.response?.status;
        const subCode = subErr?.code || subErr?.data?.error?.code;
        if (subStatus === 404 || subStatus === 403 || subCode === 'NO_SUBSCRIPTION') {
          // Free plan user — perfectly normal, not an error
          console.log('[useSubscription] No active subscription (free plan user)');
          subData = null;
        } else {
          throw subErr; // re-throw real errors
        }
      }
      setSubscription(subData);

      // ─── Step 2: Fetch usage (only if subscription exists) ────────────
      // The usage endpoint at /subscriptions/me/usage passes through
      // checkSubscription middleware, which returns 403 for free plan users.
      // We must NOT call it when subData is null.
      if (subData) {
        try {
          const usageData = await subscriptionApi.getUsage();
          
          // Patch usage limits using features_snapshot values.
          // The server sends limits as strings ("10", "15") in features_snapshot.
          // The usage endpoint may return 0 for limits — override from features_snapshot.
          const features = subData?.features;
          if (features && typeof features === 'object' && Object.keys(features).length > 0) {
            const resolveLimit = (key: string, currentLimit: number): number => {
              const val = features[key];
              if (val === undefined || val === null) return currentLimit;
              if (val === 'unlimited' || val === -1) return -1;
              const parsed = parseInt(String(val), 10);
              return isNaN(parsed) ? currentLimit : parsed;
            };

            usageData.projectsLimit.limit = resolveLimit('projects_limit', usageData.projectsLimit.limit);
            usageData.aiUsageLimit.limit = resolveLimit('ai_usage_limit', usageData.aiUsageLimit.limit);

            // Try all known key names for leaf/estimation limit
            let estLimit = usageData.leafCalculationsLimit.limit;
            for (const key of ['leaf_calculations_limit', 'estimations_limit', 'estimation_limit', 'calculations_limit']) {
              const resolved = resolveLimit(key, -999);
              if (resolved !== -999) { estLimit = resolved; break; }
            }
            usageData.leafCalculationsLimit.limit = estLimit;
          }

          setUsage(usageData);
        } catch (usageErr: any) {
          const usageStatus = usageErr?.status || usageErr?.response?.status;
          const usageCode = usageErr?.code || usageErr?.data?.error?.code;
          if (usageStatus === 403 || usageCode === 'NO_SUBSCRIPTION') {
            // Free plan — usage endpoint blocked by checkSubscription. Expected.
            console.log('[useSubscription] Usage blocked (no subscription) — expected for free plan');
          }
          // Usage may fail if subscription is inactive — not a critical error
          setUsage(null);
        }
      } else {
        setUsage(null);
      }
    } catch (err: any) {
      // 404 = no subscription is valid state, not an error
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.data?.error?.code;
      if (status === 404 || status === 403 || code === 'NO_SUBSCRIPTION') {
        setSubscription(null);
        setUsage(null);
      } else {
        // On network error or 500, KEEP last known subscription (do not set to null or FREE)
        setError(parseError(err, 'Failed to load subscription info'));
        console.warn('[useSubscription] Error fetching, keeping last known state.', err);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const incrementCalculationUsage = useCallback(() => {
    setUsage((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        leafCalculationsLimit: {
          ...prev.leafCalculationsLimit,
          used: prev.leafCalculationsLimit.used + 1,
        },
      };
    });
  }, []);

  const incrementAIUsage = useCallback(() => {
    setUsage((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        aiUsageLimit: {
          ...prev.aiUsageLimit,
          used: prev.aiUsageLimit.used + 1,
        },
      };
    });
  }, []);

  return {
    subscription,
    usage,
    loading,
    error,
    hasSubscription: !!subscription,
    refresh: fetchData,
    incrementCalculationUsage,
    incrementAIUsage,
  };
}
