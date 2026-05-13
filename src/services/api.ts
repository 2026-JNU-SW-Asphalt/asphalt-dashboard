import type {
  IncidentListResponse,
  IncidentDetail,
  DashboardResponse,
  FilterState,
  AdminVerifyResponse,
  StatusChangeResponse,
} from '../types/incident';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';
const BASE_URL = isMock ? '/api' : import.meta.env.VITE_API_BASE_URL || '/api';
const defaultHeaders = {
  'ngrok-skip-browser-warning': '69420',
};

// ─── 필터 파라미터 빌드 ───

function buildIncidentParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.gu && filters.gu !== '전체') params.set('gu', filters.gu);
  if (filters.risk_level && filters.risk_level !== '전체') params.set('risk_level', filters.risk_level);
  if (filters.status && filters.status !== '전체') params.set('status', filters.status);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  params.set('sort_by', filters.sort_by);
  params.set('order', filters.order);
  return params;
}

// ─── Incident 조회 ───

export async function fetchIncidents(filters: FilterState): Promise<IncidentListResponse> {
  const params = buildIncidentParams(filters);
  // ⭐ 추가된 부분: 두 번째 인자로 headers 전달
  const res = await fetch(`${BASE_URL}/incidents?${params.toString()}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('incidents 조회 실패');
  return res.json();
}

export async function fetchIncidentDetail(id: string): Promise<IncidentDetail> {
  const res = await fetch(`${BASE_URL}/incidents/${id}`);
  if (!res.ok) throw new Error('incident 상세 조회 실패');
  const data = await res.json();
  return data.item;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${BASE_URL}/incidents/dashboard`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('dashboard 조회 실패');
  return res.json();
}

// ─── 관리자 인증 ───

export async function verifyAdminKey(adminKey: string): Promise<AdminVerifyResponse> {
  const res = await fetch(`${BASE_URL}/admin/verify-key`, {
    method: 'POST',
    headers: {
      ...defaultHeaders, // ⭐ 추가된 부분: 기존 헤더에 공통 헤더 병합
      'X-Admin-Key': adminKey,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '관리자 키 인증 실패');
  }

  return res.json();
}

// ─── 상태 변경 ───

export async function patchIncidentStatus(
  incidentId: string,
  newStatus: string,
  adminToken: string,
): Promise<StatusChangeResponse> {
  const res = await fetch(`${BASE_URL}/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: {
      ...defaultHeaders, // ⭐ 추가된 부분: 기존 헤더에 공통 헤더 병합
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '상태 변경 실패');
  }

  return res.json();
}
