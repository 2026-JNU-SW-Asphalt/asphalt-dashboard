import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useFilterContext } from './FilterContext';
import { fetchIncidents } from '../services/api';

import type { ReactNode } from 'react';
import type { IncidentListResponse } from '../types/incident';

interface IncidentsContextValue {
  data: IncidentListResponse | null;
  loading: boolean;
  error: Error | null;
  /** 현재 필터 조건으로 목록을 강제 재조회 */
  refetch: () => void;
}

const IncidentsContext = createContext<IncidentsContextValue | null>(null);

export function IncidentsProvider({ children }: { children: ReactNode }) {
  const { filters } = useFilterContext();
  const [data, setData] = useState<IncidentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const controllerRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    fetchIncidents(filters)
      .then((res) => {
        if (!controller.signal.aborted) setData(res);
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    filters.gu,
    filters.risk_level,
    filters.status,
    filters.date_from,
    filters.date_to,
    filters.sort_by,
    filters.order,
    refreshKey,
  ]);

  return <IncidentsContext.Provider value={{ data, loading, error, refetch }}>{children}</IncidentsContext.Provider>;
}

export function useIncidentsContext(): IncidentsContextValue {
  const ctx = useContext(IncidentsContext);
  if (!ctx) throw new Error('IncidentsProvider 외부에서 useIncidentsContext 호출');
  return ctx;
}
