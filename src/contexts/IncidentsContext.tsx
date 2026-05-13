import { createContext, useContext } from 'react';
import { useIncidents } from '../hooks/useIncidents';

import type { ReactNode } from 'react';
import type { IncidentListResponse } from '../types/incident';

interface IncidentsContextValue {
  data: IncidentListResponse | null;
  loading: boolean;
  error: Error | null;
}

const IncidentsContext = createContext<IncidentsContextValue | null>(null);

/**
 * FilterContext의 필터 조건으로 인시던트 목록을 조회하고,
 * MapView · IncidentList 등 하위 컴포넌트에 동일한 데이터를 제공한다.
 * FilterProvider 안에 배치해야 한다.
 */
export function IncidentsProvider({ children }: { children: ReactNode }) {
  const result = useIncidents();
  return <IncidentsContext.Provider value={result}>{children}</IncidentsContext.Provider>;
}

export function useIncidentsContext(): IncidentsContextValue {
  const ctx = useContext(IncidentsContext);
  if (!ctx) throw new Error('IncidentsProvider 외부에서 useIncidentsContext 호출');
  return ctx;
}
