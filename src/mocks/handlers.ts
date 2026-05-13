import { http, HttpResponse } from 'msw';
import { mockIncidents, mockIncidentDetails } from './data/incidents';

import type { RepairStatus } from '../types/incident';

// ─── 관리자 인증 상태 (메모리) ───
const ADMIN_KEY = 'capstone-secret-key';
const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1시간

let adminToken: string | null = null;
let tokenExpiresAt: Date | null = null;

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function isTokenValid(token: string): boolean {
  if (!adminToken || adminToken !== token) return false;
  if (!tokenExpiresAt || new Date() > tokenExpiresAt) return false;
  return true;
}

const VALID_STATUSES: RepairStatus[] = ['보수전', '보수중', '보수완료'];

// ─── 핸들러 ───
export const handlers = [
  // ──────────────────────────────────────
  // 1. 대시보드 집계  GET /api/incidents/dashboard
  // ──────────────────────────────────────
  http.get('/api/incidents/dashboard', () => {
    const counts = {
      total: mockIncidents.length,
      status_counts: {
        before_repair: mockIncidents.filter((i) => i.status === '보수전').length,
        in_progress: mockIncidents.filter((i) => i.status === '보수중').length,
        completed: mockIncidents.filter((i) => i.status === '보수완료').length,
      },
      risk_level_counts: {
        urgent: mockIncidents.filter((i) => i.risk_level === '긴급').length,
        caution: mockIncidents.filter((i) => i.risk_level === '주의').length,
        low: mockIncidents.filter((i) => i.risk_level === '낮음').length,
      },
    };
    return HttpResponse.json({ status: 'success', counts });
  }),

  // ──────────────────────────────────────
  // 2. Incident 목록 조회  GET /api/incidents
  // ──────────────────────────────────────
  http.get('/api/incidents', ({ request }) => {
    const url = new URL(request.url);
    const gu = url.searchParams.get('gu');
    const status = url.searchParams.get('status');
    const riskLevel = url.searchParams.get('risk_level');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const sortBy = url.searchParams.get('sort_by') ?? 'risk_score';
    const order = url.searchParams.get('order') ?? 'desc';
    const limit = url.searchParams.get('limit');

    let result = [...mockIncidents];

    if (gu) result = result.filter((i) => i.gu === gu);
    if (status) result = result.filter((i) => i.status === status);
    if (riskLevel) result = result.filter((i) => i.risk_level === riskLevel);
    if (dateFrom) result = result.filter((i) => i.occurred_at >= dateFrom);
    if (dateTo) result = result.filter((i) => i.occurred_at <= dateTo);

    result.sort((a, b) => {
      const aVal = sortBy === 'risk_score' ? a.risk_score : a.occurred_at;
      const bVal = sortBy === 'risk_score' ? b.risk_score : b.occurred_at;
      if (aVal === bVal) return 0;
      const cmp = aVal < bVal ? -1 : 1;
      return order === 'asc' ? cmp : -cmp;
    });

    if (limit) result = result.slice(0, Number(limit));

    return HttpResponse.json({
      status: 'success',
      count: result.length,
      items: result,
    });
  }),

  // ──────────────────────────────────────
  // 3. Incident 상세 조회  GET /api/incidents/:id
  // ──────────────────────────────────────
  http.get('/api/incidents/:id', ({ params }) => {
    const { id } = params;
    const detail = mockIncidentDetails.find((d) => d.incident_id === id);

    if (!detail) {
      return HttpResponse.json({ detail: 'Incident를 찾을 수 없습니다.' }, { status: 404 });
    }

    return HttpResponse.json({ status: 'success', item: detail });
  }),

  // ──────────────────────────────────────
  // 4. 관리자 키 확인  POST /api/admin/verify-key
  // ──────────────────────────────────────
  http.post('/api/admin/verify-key', ({ request }) => {
    const key = request.headers.get('X-Admin-Key');

    if (!key || key !== ADMIN_KEY) {
      return HttpResponse.json({ detail: '관리자 키가 올바르지 않습니다.' }, { status: 403 });
    }

    adminToken = generateToken();
    tokenExpiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);

    return HttpResponse.json({
      status: 'success',
      message: '관리자 키가 확인되었습니다.',
      admin_token: adminToken,
      expires_at: tokenExpiresAt.toISOString(),
    });
  }),

  // ──────────────────────────────────────
  // 5. 상태 변경  PATCH /api/incidents/:id/status
  // ──────────────────────────────────────
  http.patch('/api/incidents/:id/status', async ({ params, request }) => {
    // 토큰 검증
    const token = request.headers.get('X-Admin-Token');

    if (!token) {
      return HttpResponse.json({ detail: '관리자 토큰이 필요합니다.' }, { status: 401 });
    }

    if (!isTokenValid(token)) {
      return HttpResponse.json({ detail: '관리자 토큰이 유효하지 않거나 만료되었습니다.' }, { status: 403 });
    }

    // 요청 바디 파싱
    const body = (await request.json()) as { status?: string };
    const newStatus = body.status as RepairStatus | undefined;

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return HttpResponse.json({ detail: `허용되지 않은 status 입니다: ${newStatus ?? '(없음)'}` }, { status: 400 });
    }

    // Incident 검색
    const { id } = params;
    const summaryIdx = mockIncidents.findIndex((i) => i.incident_id === id);
    const detailIdx = mockIncidentDetails.findIndex((d) => d.incident_id === id);

    if (summaryIdx === -1 || detailIdx === -1) {
      return HttpResponse.json({ detail: 'Incident를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 보수완료 → 다른 상태로 되돌리기 금지
    if (mockIncidents[summaryIdx].status === '보수완료' && newStatus !== '보수완료') {
      return HttpResponse.json(
        { detail: '보수완료 상태의 Incident는 일반 상태변경으로 되돌릴 수 없습니다.' },
        { status: 400 },
      );
    }

    // 상태 반영 (메모리 mutation)
    mockIncidents[summaryIdx].status = newStatus;
    mockIncidentDetails[detailIdx].status = newStatus;

    if (newStatus === '보수완료') {
      mockIncidentDetails[detailIdx].recovered_at = new Date().toISOString();
    }

    return HttpResponse.json({
      status: 'success',
      incident_id: id,
      requested_status: newStatus,
      updated_status: newStatus,
    });
  }),
];
