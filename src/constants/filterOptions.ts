import type { RiskLevel, RepairStatus, District, SortBy, SortOrder } from '../types/incident';

export const ALL_VALUE = '전체';

export const DISTRICT_OPTIONS: (typeof ALL_VALUE | District)[] = [ALL_VALUE, '광산구', '서구', '동구', '남구', '북구'];

export const RISK_LEVEL_OPTIONS: (typeof ALL_VALUE | RiskLevel)[] = [ALL_VALUE, '긴급', '주의', '낮음'];

export const STATUS_OPTIONS: (typeof ALL_VALUE | RepairStatus)[] = [ALL_VALUE, '보수전', '보수중', '보수완료'];

export const SORT_BY_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'occurred_at', label: '신고일순' },
  { value: 'risk_score', label: '위험도순' },
];

export const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'desc', label: '내림차순' },
  { value: 'asc', label: '오름차순' },
];
