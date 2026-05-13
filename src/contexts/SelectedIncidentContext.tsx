import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchIncidentDetail } from '../services/api';

import type { ReactNode } from 'react';
import type { IncidentDetail } from '../types/incident';

interface SelectedIncidentContextValue {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  detail: IncidentDetail | null;
  loading: boolean;
  error: string | null;
  /** 상세 데이터를 강제 재조회 (상태 변경 후 갱신용) */
  refetchDetail: () => void;
}

const SelectedIncidentContext = createContext<SelectedIncidentContextValue | null>(null);

export function SelectedIncidentProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetchDetail = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchIncidentDetail(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, refreshKey]);

  return (
    <SelectedIncidentContext.Provider value={{ selectedId, setSelectedId, detail, loading, error, refetchDetail }}>
      {children}
    </SelectedIncidentContext.Provider>
  );
}

export function useSelectedIncident(): SelectedIncidentContextValue {
  const ctx = useContext(SelectedIncidentContext);
  if (!ctx) throw new Error('SelectedIncidentProvider 외부에서 useSelectedIncident 호출');
  return ctx;
}
