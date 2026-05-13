import { useFilterContext } from '../contexts/FilterContext';
import { fetchIncidents } from '../services/api';
import { useApi } from './useApi';

/**
 * FilterContext의 filters가 변경될 때마다 GET /api/incidents를 자동 재호출한다.
 * IncidentList, MapView 등에서 공유 사용.
 */
export function useIncidents() {
  const { filters } = useFilterContext();

  return useApi(
    () => fetchIncidents(filters),
    [
      filters.gu,
      filters.risk_level,
      filters.status,
      filters.date_from,
      filters.date_to,
      filters.sort_by,
      filters.order,
    ],
  );
}
