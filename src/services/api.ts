import type { IncidentListResponse, IncidentDetail, DashboardResponse, FilterState } from '../types/incident';

const BASE_URL = '/api';

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

export async function fetchIncidents(filters: FilterState): Promise<IncidentListResponse> {
  const params = buildIncidentParams(filters);
  const res = await fetch(`${BASE_URL}/incidents?${params.toString()}`);
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
  const res = await fetch(`${BASE_URL}/incidents/dashboard`);
  if (!res.ok) throw new Error('dashboard 조회 실패');
  return res.json();
}
