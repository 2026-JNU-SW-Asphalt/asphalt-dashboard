export type RiskLevel = '긴급' | '주의' | '낮음';
export type RepairStatus = '보수전' | '보수중' | '보수완료';
export type District = '동구' | '서구' | '남구' | '북구' | '광산구';
export type SortBy = 'risk_score' | 'occurred_at';
export type SortOrder = 'asc' | 'desc';

/** GET /api/incidents 응답 items 항목 */
export interface IncidentSummary {
  incident_id: string;
  lat: number;
  lng: number;
  gps_accuracy_m: number;
  gu: string;
  address: string;
  risk_score: number;
  risk_level: RiskLevel;
  status: RepairStatus;
  occurred_at: string;
}

/** GET /api/incidents 응답 전체 */
export interface IncidentListResponse {
  status: string;
  count: number;
  items: IncidentSummary[];
}

/** GET /api/incidents/{id} 응답 item */
export interface IncidentDetail {
  incident_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  status: RepairStatus;
  latitude: number;
  longitude: number;
  gps_accuracy_m: number;
  gu: string;
  address: string;
  size_label: '대형' | '중형' | '소형';
  photo_url: string;
  first_detected_at: string;
  last_detected_at: string;
  recovered_at: string | null;
}

/** GET /api/incidents/dashboard 응답 */
export interface DashboardResponse {
  status: string;
  counts: {
    total: number;
    status_counts: {
      before_repair: number;
      in_progress: number;
      completed: number;
    };
    risk_level_counts: {
      urgent: number;
      caution: number;
      low: number;
    };
  };
}

/** FilterContext에서 관리하는 필터 상태 */
export interface FilterState {
  gu: string; // '전체' or District
  risk_level: string; // '전체' or RiskLevel
  status: string; // '전체' or RepairStatus
  date_from: string; // ISO 8601, 빈 문자열이면 미적용
  date_to: string;
  sort_by: SortBy;
  order: SortOrder;
}
