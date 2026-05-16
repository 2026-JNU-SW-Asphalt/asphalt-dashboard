import type { IncidentSummary, RepairStatus, RiskLevel, District } from '../types/incident';

export interface StatsSummary {
  total: number;
  unresolved: number;
  urgent: number;
  completionRate: number;
}

export interface CountItem {
  label: string;
  count: number;
  color: string;
}

export interface CrossRow {
  gu: string;
  before: number;
  progress: number;
  done: number;
  total: number;
}

const STATUS_COLORS: Record<RepairStatus, string> = {
  보수전: '#ef4444',
  보수중: '#3b82f6',
  보수완료: '#10b981',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  긴급: '#ea5a52',
  주의: '#efaa3a',
  낮음: '#f3d746',
};

const GU_COLOR = '#2563eb';

/** 모든 자치구 목록 — 데이터 0건인 구도 항상 표시 */
const ALL_GU: District[] = ['동구', '서구', '남구', '북구', '광산구'];

/** 핵심 지표 */
export function computeSummary(items: IncidentSummary[]): StatsSummary {
  const total = items.length;
  const unresolved = items.filter((i) => i.status === '보수전' || i.status === '보수중').length;
  const urgent = items.filter((i) => i.risk_level === '긴급').length;
  const done = items.filter((i) => i.status === '보수완료').length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, unresolved, urgent, completionRate };
}

/** 자치구별 분포 (고정 순서, 0건 포함) */
export function computeByGu(items: IncidentSummary[]): CountItem[] {
  const map = new Map<string, number>();
  ALL_GU.forEach((gu) => map.set(gu, 0));
  items.forEach((i) => map.set(i.gu, (map.get(i.gu) ?? 0) + 1));
  return ALL_GU.map((gu) => ({ label: gu, count: map.get(gu) ?? 0, color: GU_COLOR }));
}

/** 보수 상태 분포 */
export function computeByStatus(items: IncidentSummary[]): CountItem[] {
  const order: RepairStatus[] = ['보수전', '보수중', '보수완료'];
  return order.map((s) => ({
    label: s,
    count: items.filter((i) => i.status === s).length,
    color: STATUS_COLORS[s],
  }));
}

/** 위험도 분포 */
export function computeByRisk(items: IncidentSummary[]): CountItem[] {
  const order: RiskLevel[] = ['긴급', '주의', '낮음'];
  return order.map((r) => ({
    label: r,
    count: items.filter((i) => i.risk_level === r).length,
    color: RISK_COLORS[r],
  }));
}

/** 자치구 × 보수상태 교차 (고정 순서, 0건 포함) */
export function computeCross(items: IncidentSummary[]): CrossRow[] {
  const map = new Map<string, CrossRow>();
  ALL_GU.forEach((gu) => map.set(gu, { gu, before: 0, progress: 0, done: 0, total: 0 }));
  items.forEach((i) => {
    const row = map.get(i.gu);
    if (!row) return;
    if (i.status === '보수전') row.before += 1;
    else if (i.status === '보수중') row.progress += 1;
    else row.done += 1;
    row.total += 1;
  });
  return ALL_GU.map((gu) => map.get(gu)!);
}
