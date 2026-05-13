import { useEffect, useRef, useState, useCallback } from 'react';
import { useIncidentsContext } from '../../contexts/IncidentsContext';
import styles from './MapView.module.scss';

import type { RiskLevel, RepairStatus, IncidentSummary } from '../../types/incident';

// ─── 상수 ───
const GWANGJU_CENTER = { lat: 35.1595, lng: 126.8526 };
const DEFAULT_LEVEL = 7;

type ColorMode = 'risk_level' | 'status';

// ─── 색상 매핑 ───
const RISK_COLORS: Record<RiskLevel, string> = {
  긴급: '#ea5a52',
  주의: '#efaa3a',
  낮음: '#f3d746',
};

const STATUS_COLORS: Record<RepairStatus, string> = {
  보수전: '#ef4444',
  보수중: '#3b82f6',
  보수완료: '#10b981',
};

/** 아이템의 색상 모드에 따라 핀 색상 결정 */
function getPinColor(item: IncidentSummary, mode: ColorMode): string {
  if (mode === 'risk_level') return RISK_COLORS[item.risk_level];
  return STATUS_COLORS[item.status];
}

/** SVG 핀 마커 data URI */
function createPinDataUri(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${fillColor}" stroke="#fff" stroke-width="1.5"/><circle cx="14" cy="14" r="5.5" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** MarkerImage 캐시 (색상 hex → MarkerImage) */
const imageCache = new Map<string, kakao.maps.MarkerImage>();

function getMarkerImage(color: string): kakao.maps.MarkerImage {
  if (imageCache.has(color)) return imageCache.get(color)!;
  const img = new kakao.maps.MarkerImage(createPinDataUri(color), new kakao.maps.Size(28, 40), {
    offset: new kakao.maps.Point(14, 40),
  });
  imageCache.set(color, img);
  return img;
}

// ─── SDK 동적 로드 (싱글턴) ───
let sdkPromise: Promise<void> | null = null;

function loadKakaoMapSDK(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다.'));
  }

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

// ─── 범례 데이터 ───
const RISK_LEGEND: { label: RiskLevel; color: string }[] = [
  { label: '긴급', color: RISK_COLORS['긴급'] },
  { label: '주의', color: RISK_COLORS['주의'] },
  { label: '낮음', color: RISK_COLORS['낮음'] },
];

const STATUS_LEGEND: { label: RepairStatus; color: string }[] = [
  { label: '보수전', color: STATUS_COLORS['보수전'] },
  { label: '보수중', color: STATUS_COLORS['보수중'] },
  { label: '보수완료', color: STATUS_COLORS['보수완료'] },
];

// ─── 컴포넌트 ───
export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('risk_level');

  const { data } = useIncidentsContext();

  // 1) SDK 로드
  useEffect(() => {
    loadKakaoMapSDK()
      .then(() => setSdkReady(true))
      .catch((err: Error) => setSdkError(err.message));
  }, []);

  // 2) 지도 초기화 (SDK 로드 완료 후 1회)
  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;

    mapRef.current = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(GWANGJU_CENTER.lat, GWANGJU_CENTER.lng),
      level: DEFAULT_LEVEL,
    });
  }, [sdkReady]);

  /** 핀 클릭 핸들러 — 다음 작업에서 상세 패널 연동 예정 */
  const handleMarkerClick = useCallback((item: IncidentSummary) => {
    // eslint-disable-next-line no-console
    console.log('[MapView] 마커 클릭:', item.incident_id, item.address);
  }, []);

  // 3) 마커 동기화 — data 또는 colorMode 변경 시 갱신
  //    ★ sdkReady도 의존성에 포함하여, SDK 로드 후 data가 이미 있으면 즉시 마커 생성
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sdkReady || !data) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 새 마커 생성
    markersRef.current = data.items.map((item) => {
      const color = getPinColor(item, colorMode);
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(item.lat, item.lng),
        map,
        image: getMarkerImage(color),
        title: item.address,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        handleMarkerClick(item);
      });

      return marker;
    });
  }, [data, sdkReady, colorMode, handleMarkerClick]);

  // ─── 범례 선택 ───
  const legend = colorMode === 'risk_level' ? RISK_LEGEND : STATUS_LEGEND;

  // ─── 렌더 ───
  if (sdkError) {
    return (
      <div className={styles.container}>
        <div className={`${styles.overlay} ${styles.error}`}>{sdkError}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!sdkReady && <div className={styles.overlay}>지도를 불러오는 중…</div>}
      <div ref={containerRef} className={styles.map} />

      {/* ── 지도 위 필터 토글 + 범례 ── */}
      {sdkReady && (
        <div className={styles.mapControl}>
          {/* 세그먼트 토글 */}
          <div className={styles.segmented}>
            <button
              type="button"
              className={`${styles.segBtn} ${colorMode === 'risk_level' ? styles.segActive : ''}`}
              onClick={() => setColorMode('risk_level')}
            >
              위험도
            </button>
            <button
              type="button"
              className={`${styles.segBtn} ${colorMode === 'status' ? styles.segActive : ''}`}
              onClick={() => setColorMode('status')}
            >
              보수 상태
            </button>
          </div>

          {/* 범례 */}
          <div className={styles.legend}>
            {legend.map((item) => (
              <div key={item.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: item.color }} />
                <span className={styles.legendLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
