import type { IncidentSummary, IncidentDetail, RepairStatus } from '../../types/incident';
import { deriveRiskLevel } from '../../utils/risk';

/**
 * Mock 시드 데이터 — 5건
 *
 * 필터 테스트 커버리지:
 *   자치구  : 서구(2) · 북구(2) · 광산구(1)
 *   상태    : 보수전(2) · 보수중(2) · 보수완료(1)
 *   위험도  : 긴급(2) · 주의(2) · 낮음(1)
 *   크기    : 대형(2) · 중형(2) · 소형(1)
 *   날짜    : 04-10 ~ 04-25 (범위 필터 테스트)
 */
interface Seed {
  id: string;
  gu: string;
  address: string;
  lat: number;
  lng: number;
  risk_score: number;
  status: RepairStatus;
  size_label: '대형' | '중형' | '소형';
  photo_url: string;
  occurred_at: string;
  last_detected_at: string;
  recovered_at: string | null;
}

const seeds: Seed[] = [
  {
    id: '00000001',
    gu: '서구',
    address: '광주 서구 상무평화로 11',
    lat: 35.1525,
    lng: 126.8896,
    risk_score: 92,
    status: '보수전',
    size_label: '대형',
    photo_url: 'https://example.com/images/pothole_001.webp',
    occurred_at: '2026-04-22T06:30:00Z',
    last_detected_at: '2026-04-22T06:35:00Z',
    recovered_at: null,
  },
  {
    id: '00000002',
    gu: '북구',
    address: '광주 북구 용봉로 100',
    lat: 35.1745,
    lng: 126.9123,
    risk_score: 65,
    status: '보수중',
    size_label: '중형',
    photo_url: 'https://example.com/images/pothole_002.webp',
    occurred_at: '2026-04-18T09:15:00Z',
    last_detected_at: '2026-04-18T09:20:00Z',
    recovered_at: null,
  },
  {
    id: '00000003',
    gu: '광산구',
    address: '광주 광산구 첨단중앙로 333',
    lat: 35.1395,
    lng: 126.7935,
    risk_score: 35,
    status: '보수완료',
    size_label: '소형',
    photo_url: 'https://example.com/images/pothole_003.webp',
    occurred_at: '2026-04-10T14:00:00Z',
    last_detected_at: '2026-04-10T14:05:00Z',
    recovered_at: '2026-04-12T10:30:00Z',
  },
  {
    id: '00000004',
    gu: '서구',
    address: '광주 서구 풍암동 22길',
    lat: 35.149,
    lng: 126.891,
    risk_score: 78,
    status: '보수전',
    size_label: '중형',
    photo_url: 'https://example.com/images/pothole_004.webp',
    occurred_at: '2026-04-25T07:45:00Z',
    last_detected_at: '2026-04-25T07:50:00Z',
    recovered_at: null,
  },
  {
    id: '00000005',
    gu: '북구',
    address: '광주 북구 첨단과기로 75',
    lat: 35.1762,
    lng: 126.9085,
    risk_score: 88,
    status: '보수중',
    size_label: '대형',
    photo_url: 'https://example.com/images/pothole_005.webp',
    occurred_at: '2026-04-15T11:20:00Z',
    last_detected_at: '2026-04-15T11:25:00Z',
    recovered_at: null,
  },
];

/** GET /api/incidents — 목록 조회용 요약 데이터 (mutable: 상태 변경 반영) */
export const mockIncidents: IncidentSummary[] = seeds.map((s) => ({
  incident_id: `INC-${s.id}`,
  lat: s.lat,
  lng: s.lng,
  gps_accuracy_m: 5.0,
  gu: s.gu,
  address: s.address,
  risk_score: s.risk_score,
  risk_level: deriveRiskLevel(s.risk_score),
  status: s.status,
  occurred_at: s.occurred_at,
}));

/** GET /api/incidents/:id — 상세 조회용 데이터 (mutable: 상태 변경 반영) */
export const mockIncidentDetails: IncidentDetail[] = seeds.map((s) => ({
  incident_id: `INC-${s.id}`,
  risk_score: s.risk_score,
  risk_level: deriveRiskLevel(s.risk_score),
  status: s.status,
  latitude: s.lat,
  longitude: s.lng,
  gps_accuracy_m: 5.0,
  gu: s.gu,
  address: s.address,
  size_label: s.size_label,
  photo_url: s.photo_url,
  first_detected_at: s.occurred_at,
  last_detected_at: s.last_detected_at,
  recovered_at: s.recovered_at,
}));
