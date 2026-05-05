import { http, HttpResponse } from 'msw';
import { mockIncidents } from './data/incidents';

export const handlers = [
  // 대시보드 집계
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

  // Incident 목록 (필터링 + 정렬 지원)
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
];
