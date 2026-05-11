/**
 * useCategories — Dynamic category state management hook.
 *
 * Provides lazy-loaded category navigation driven entirely by the backend:
 *   - Root categories: fetched on mount via GET /categories
 *   - Child categories: fetched on demand via GET /categories/:id/children
 *   - Full tree: optionally fetched via GET /categories/tree
 *
 * All data passes through mappers for type safety.
 * Inactive categories (is_active = false) are already filtered server-side.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { estimationApi } from '~/api/api';
import type { Category } from '~/api/types';
import { logger } from '~/utils/errorHandler';

interface UseCategoriesOptions {
  /** If set, fetches children of this parent on mount instead of roots */
  parentId?: string | null;
  /** If true, fetches the full tree (single request) instead of lazy loading */
  useTree?: boolean;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** Fetch root categories */
  fetchRoots: () => Promise<Category[]>;
  /** Fetch children of a given parent */
  fetchChildren: (parentId: string) => Promise<Category[]>;
  /** Fetch the full recursive tree */
  fetchTree: () => Promise<Category[]>;
  /** Refresh current view */
  refresh: () => Promise<void>;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { parentId, useTree = false } = options;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRoots = useCallback(async (): Promise<Category[]> => {
    try {
      const data = await estimationApi.getCategories();
      return data.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (err: any) {
      logger.error('[useCategories]', 'Failed to fetch roots:', err);
      throw err;
    }
  }, []);

  const fetchChildren = useCallback(async (pid: string): Promise<Category[]> => {
    try {
      const data = await estimationApi.getCategoryChildren(pid);
      return data.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (err: any) {
      logger.error('[useCategories]', `Failed to fetch children for ${pid}:`, err);
      throw err;
    }
  }, []);

  const fetchTree = useCallback(async (): Promise<Category[]> => {
    try {
      const data = await estimationApi.getCategoryTree();
      return data.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (err: any) {
      logger.error('[useCategories]', 'Failed to fetch tree:', err);
      throw err;
    }
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      let data: Category[];
      if (useTree) {
        data = await fetchTree();
      } else if (parentId) {
        data = await fetchChildren(parentId);
      } else {
        data = await fetchRoots();
      }

      if (mountedRef.current) {
        setCategories(data);
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const msg = err?.message || 'Failed to load categories';
        setError(msg);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [parentId, useTree, fetchRoots, fetchChildren, fetchTree]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  return {
    categories,
    loading,
    refreshing,
    error,
    fetchRoots,
    fetchChildren,
    fetchTree,
    refresh,
  };
}
