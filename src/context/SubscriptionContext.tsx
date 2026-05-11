/**
 * SubscriptionContext — Global subscription state provider.
 *
 * Makes subscription + usage data available to ANY screen via useSubscriptionContext().
 * Project screens can check `hasSubscription` / `isSubscriptionActive` before rendering actions.
 *
 * ARCHITECTURE:
 *  - Fetches subscription on mount (after auth)
 *  - Exposes: subscription, usage, hasSubscription, isSubscriptionActive, canCreateProject, refresh
 *  - Does NOT block UI — it provides data for components to decide
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useSubscription } from '~/hooks/useSubscription';
import { useAuth } from './AuthContext';
import type { Subscription, Usage } from '~/api/types';

interface SubscriptionContextType {
  subscription: Subscription | null;
  usage: Usage | null;
  loading: boolean;
  error: string | null;
  hasSubscription: boolean;
  /** True if subscription exists AND status is 'active' */
  isSubscriptionActive: boolean;
  /** True if user can create more projects (under limit or unlimited) */
  canCreateProject: boolean;
  /** True if user can perform more calculations (under limit or unlimited) */
  canCalculate: boolean;
  /** True if user can send another AI expert request (under limit or unlimited) */
  canUseAI: boolean;
  /** Remaining AI requests for the current period (-1 = unlimited, 0 = blocked) */
  remainingAIRequests: number;
  refresh: () => Promise<void>;
  /** Increment usage locally after a calculation */
  incrementCalculationUsage: () => void;
  /** Increment usage locally after a successful AI request */
  incrementAIUsage: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Only fetch subscription data when user is authenticated
  const { subscription, usage, loading, error, hasSubscription, refresh, incrementCalculationUsage, incrementAIUsage } = useSubscription();

  const isSubscriptionActive = useMemo(() => {
    if (!subscription) return false;
    return subscription.isActive;
  }, [subscription]);

  const canCreateProject = useMemo(() => {
    if (!subscription) return true; // allow if API fails or no sub info
    if (!subscription.isActive) return false; // block if inactive
    if (!usage) return true;

    const { used, limit } = usage.projectsLimit;
    if (limit === -1) return true;  // explicitly unlimited
    if (limit === 0) return true;   // unresolved from backend — allow by default
    return used < limit;
  }, [subscription, usage]);

  const canCalculate = useMemo(() => {
    if (!subscription) return true;
    if (!subscription.isActive) return false;
    if (!usage) return true;

    const { used, limit } = usage.leafCalculationsLimit;
    if (limit === -1) return true;   // unlimited
    if (limit === 0) return true;    // unresolved from backend — allow by default
    return used < limit;
  }, [subscription, usage]);

  // ─── AI usage gate ──────────────────────────────────────────────────────────
  // Mirrors `canCalculate` but reads `aiUsageLimit`. Returns true when the
  // user has remaining AI requests OR when the limit is unresolved/unlimited.
  const canUseAI = useMemo(() => {
    if (!subscription) return true;            // no sub info -> allow (server still gates)
    if (!subscription.isActive) return false;  // inactive sub -> block
    if (!usage) return true;                   // no usage data -> allow
    const { used, limit } = usage.aiUsageLimit;
    if (limit === -1) return true;             // unlimited
    if (limit === 0) return true;              // unresolved -> allow
    return used < limit;
  }, [subscription, usage]);

  const remainingAIRequests = useMemo(() => {
    if (!usage) return -1;                     // unknown -> treat as unlimited for UI
    const { used, limit } = usage.aiUsageLimit;
    if (limit === -1 || limit === 0) return -1;
    return Math.max(0, limit - used);
  }, [usage]);

  const value = useMemo(
    () => ({
      subscription,
      usage,
      loading,
      error,
      hasSubscription,
      isSubscriptionActive,
      canCreateProject,
      canCalculate,
      canUseAI,
      remainingAIRequests,
      refresh,
      incrementCalculationUsage,
      incrementAIUsage,
    }),
    [subscription, usage, loading, error, hasSubscription, isSubscriptionActive, canCreateProject, canCalculate, canUseAI, remainingAIRequests, refresh, incrementCalculationUsage, incrementAIUsage]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // Graceful fallback — returns safe defaults if provider is missing
    return {
      subscription: null,
      usage: null,
      loading: false,
      error: null,
      hasSubscription: false,
      isSubscriptionActive: false,
      canCreateProject: true,
      canCalculate: true,
      canUseAI: true,
      remainingAIRequests: -1,
      refresh: async () => {},
      incrementCalculationUsage: () => {},
      incrementAIUsage: () => {},
    };
  }
  return context;
};
