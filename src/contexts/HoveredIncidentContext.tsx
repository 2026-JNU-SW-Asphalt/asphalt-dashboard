import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface HoveredIncidentContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

const HoveredIncidentContext = createContext<HoveredIncidentContextValue | null>(null);

export function HoveredIncidentProvider({ children }: { children: ReactNode }) {
  const [hoveredId, setHoveredIdRaw] = useState<string | null>(null);
  const setHoveredId = useCallback((id: string | null) => setHoveredIdRaw(id), []);

  return (
    <HoveredIncidentContext.Provider value={{ hoveredId, setHoveredId }}>{children}</HoveredIncidentContext.Provider>
  );
}

export function useHoveredIncident(): HoveredIncidentContextValue {
  const ctx = useContext(HoveredIncidentContext);
  if (!ctx) throw new Error('HoveredIncidentProvider 외부에서 useHoveredIncident 호출');
  return ctx;
}
