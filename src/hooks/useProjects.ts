import { useState, useEffect, useCallback } from 'react';
import { estimationApi } from '~/api/api';
import type { Project } from '~/api/types';
import { parseError } from '~/utils/errorHandler';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOffline: boolean;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchProjects = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await estimationApi.listProjects();
      
      // Detection of mock data via IDs (mapped projectId, not raw project_id)
      const hasMockData = data.some(p => p.projectId.startsWith('offline-'));
      setIsOffline(hasMockData);
      
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // 403/NO_SUBSCRIPTION is expected for free-plan users — show empty list, not an error
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.data?.error?.code;
      if (status === 403 && (code === 'NO_SUBSCRIPTION' || err?.isSubscriptionError)) {
        console.log('[useProjects] No subscription — showing empty project list');
        setProjects([]);
        setIsOffline(false);
      } else {
        setError(parseError(err, 'Failed to load projects.'));
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(false);
  }, [fetchProjects]);

  const refresh = useCallback(() => fetchProjects(true), [fetchProjects]);
  const refetch = useCallback(() => fetchProjects(false), [fetchProjects]);

  return { projects, loading, refreshing, error, isOffline, refresh, refetch };
}
