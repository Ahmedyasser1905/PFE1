/**
 * useLocalCalculations — Centralized hook for local (offline) calculation storage.
 *
 * Eliminates the identical AsyncStorage read/write/delete pattern duplicated in:
 *  - projects/[id]/index.tsx  (line 155)
 *  - estimation-history/index.tsx  (lines 18–57)
 *  - all-calculations/index.tsx   (line 17)
 *  - calculation-details/[id].tsx (lines 21–44)
 *
 * All screens now share one storage layer.
 */
import { useState, useCallback } from 'react';
import { useFeedback } from '~/context/FeedbackContext';
import { useFocusEffect } from 'expo-router';
import { storage } from '~/utils/storage';
import { STORAGE_KEYS } from '~/constants/config';
import { logger } from '~/utils/errorHandler';
import type { MaterialLine } from '~/api/types';

export interface LocalCalculation {
  id: string;
  projectId: string;
  category: string;
  category_name?: string;
  categoryId?: string;
  subCategory?: string;
  type?: string;
  formula_name?: string;
  selectedFormulaId?: string;
  inputs: Record<string, any>;
  result: number;
  results?: Record<string, any>;
  createdAt: string;
  created_at?: string;
  isLocal: boolean;
  materialLines?: MaterialLine[];
  serviceLines?: any[];
}

interface UseLocalCalculationsOptions {
  /** If provided, filters calculations to only those matching this project */
  projectId?: string;
  /** Auto-load on focus (default: true) */
  autoLoadOnFocus?: boolean;
}

interface UseLocalCalculationsResult {
  calculations: LocalCalculation[];
  loading: boolean;
  totalCost: number;
  reload: () => Promise<void>;
  deleteById: (id: string) => void;
}

async function readAllFromStorage(): Promise<LocalCalculation[]> {
  try {
    const raw = await storage.getItem(STORAGE_KEYS.CALCULATIONS);
    if (!raw) return [];
    return JSON.parse(raw) as LocalCalculation[];
  } catch (e) {
    logger.warn('useLocalCalculations', 'Failed to parse stored calculations:', e);
    return [];
  }
}

async function writeAllToStorage(list: LocalCalculation[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.CALCULATIONS, JSON.stringify(list));
}

export function useLocalCalculations({
  projectId,
  autoLoadOnFocus = true,
}: UseLocalCalculationsOptions = {}): UseLocalCalculationsResult {
  const [calculations, setCalculations] = useState<LocalCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const { showFeedback } = useFeedback();

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const all = await readAllFromStorage();
      const filtered = projectId ? all.filter((c) => c.projectId === projectId) : all;
      const sorted = [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      setCalculations(sorted);
    } catch (e) {
      logger.error('useLocalCalculations', 'Reload failed:', e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Auto-reload whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoLoadOnFocus) reload();
    }, [autoLoadOnFocus, reload])
  );

  const deleteById = useCallback(
    (id: string) => {
      showFeedback({
        title: 'Delete Calculation',
        message: 'Are you sure you want to remove this record?',
        type: 'warning',
        primaryText: 'Delete',
        secondaryText: 'Cancel',
        onPrimary: async () => {
          try {
            const all = await readAllFromStorage();
            const updated = all.filter((c) => c.id !== id);
            await writeAllToStorage(updated);
            setCalculations((prev) => prev.filter((c) => c.id !== id));
          } catch (e) {
            logger.error('useLocalCalculations', 'Delete failed:', e);
          }
        },
      });
    },
    [showFeedback]
  );

  const totalCost = calculations.reduce(
    (sum, c) => sum + (Number(c.result || c.results?.total_cost || 0) || 0),
    0
  );

  return { calculations, loading, totalCost, reload, deleteById };
}

// ─── Utility: save a new calculation (used by calculations/index.tsx) ─────────
export async function saveLocalCalculation(calc: Omit<LocalCalculation, 'isLocal'>): Promise<void> {
  const all = await readAllFromStorage();
  const newEntry: LocalCalculation = { ...calc, isLocal: true };
  await writeAllToStorage([newEntry, ...all]);
}

// ─── Utility: read a single calculation by id ─────────────────────────────────
export async function getLocalCalculationById(id: string): Promise<LocalCalculation | null> {
  const all = await readAllFromStorage();
  return all.find((c) => c.id === id) ?? null;
}
