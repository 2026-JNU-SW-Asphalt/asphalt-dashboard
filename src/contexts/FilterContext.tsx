import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { FilterState } from '../types/incident';

const DEFAULT_FILTER: FilterState = {
  gu: '전체',
  risk_level: '전체',
  status: '전체',
  date_from: '',
  date_to: '',
  sort_by: 'risk_score',
  order: 'desc',
};

interface FilterContextValue {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const resetFilters = () => setFilters(DEFAULT_FILTER);
  return <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>{children}</FilterContext.Provider>;
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('FilterProvider 외부에서 useFilterContext 호출');
  return ctx;
}
