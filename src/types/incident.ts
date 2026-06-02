export type RiskLevel = '긴급' | '주의' | '낮음';
export type RepairStatus = '보수전' | '보수중' | '보수완료';
export type District = '동구' | '서구' | '남구' | '북구' | '광산구';
export type SortBy = 'risk_score' | 'recent_update';
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
    /** 활성 Incident 개수 (보수전 + 보수중) */
    active_total: number;
    /** 활성 Incident 중 긴급 개수 (보수완료 제외) */
    urgent_active_total: number;
    /** 이번 주 보수완료 처리 개수 */
    completed_this_week: number;
    /** 이번 주 범위 */
    weekly_range: {
      from: string;
      to: string;
    };
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

/** GET /api/incidents/statistics 응답 */
export interface StatisticsResponse {
  status: string;
  statistics: {
    /** 전체 Incident 개수 */
    total_detected: number;
    /** 활성 Incident 개수 (보수전 + 보수중) */
    active_total: number;
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
    /** 자치구별 개수 배열 (gu가 비어 있으면 '미분류') */
    gu_counts: { gu: string; count: number }[];
  };
}

/** 통계 필터 (statistics API 쿼리 파라미터) */
export interface StatisticsFilter {
  gu?: string;
  risk_level?: string;
  status?: string;
}

/** POST /api/admin/verify-key 성공 응답 */
export interface AdminVerifyResponse {
  status: string;
  message: string;
  admin_token: string;
  expires_at: string;
}

/** PATCH /api/incidents/{id}/status 성공 응답 */
export interface StatusChangeResponse {
  status: string;
  incident_id: string;
  requested_status: RepairStatus;
  updated_status: RepairStatus;
}

/** FilterContext에서 관리하는 필터 상태 */
export interface FilterState {
  gu: string;
  risk_level: string;
  status: string;
  date_from: string;
  date_to: string;
  sort_by: SortBy;
  order: SortOrder;
}
