import { fetchDashboard } from '../services/api';
import { useApi } from './useApi';

export function useDashboard() {
  return useApi(fetchDashboard, []);
}
