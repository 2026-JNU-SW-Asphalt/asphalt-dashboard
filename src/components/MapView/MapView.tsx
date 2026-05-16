import { useEffect, useRef, useState, useCallback } from 'react';
import { useIncidentsContext } from '../../contexts/IncidentsContext';
import { useSelectedIncident } from '../../contexts/SelectedIncidentContext';
import { useHoveredIncident } from '../../contexts/HoveredIncidentContext';
import styles from './MapView.module.scss';

import type { RiskLevel, RepairStatus, IncidentSummary } from '../../types/incident';

const GWANGJU_CENTER = { lat: 35.1595, lng: 126.8526 };
const DEFAULT_LEVEL = 7;

type ColorMode = 'risk_level' | 'status';

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

function getPinColor(item: IncidentSummary, mode: ColorMode): string {
  return mode === 'risk_level' ? RISK_COLORS[item.risk_level] : STATUS_COLORS[item.status];
}

// ─── 핀 SVG (일반 / 강조) ───
const PIN_NORMAL = { w: 28, h: 40 };
const PIN_HIGHLIGHT = { w: 33, h: 47 };

function createPinSvg(fillColor: string, w: number, h: number, strokeW = 1.5, strokeColor = '#fff'): string {
  // viewBox에 stroke 두께만큼 padding을 줘서 테두리 잘림 방지
  const pad = strokeW;
  const vbX = -pad;
  const vbY = -pad;
  const vbW = 28 + pad * 2;
  const vbH = 40 + pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeW}"/><circle cx="14" cy="14" r="5.5" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 캐시: "color|size|strokeColor" → MarkerImage
const imageCache = new Map<string, kakao.maps.MarkerImage>();

function getMarkerImage(color: string, highlight = false): kakao.maps.MarkerImage {
  const { w, h } = highlight ? PIN_HIGHLIGHT : PIN_NORMAL;
  const strokeColor = highlight ? '#000' : '#fff';
  const strokeW = 1.5;
  const key = `${color}|${w}|${strokeColor}`;
  if (imageCache.has(key)) return imageCache.get(key)!;
  const img = new kakao.maps.MarkerImage(createPinSvg(color, w, h, strokeW, strokeColor), new kakao.maps.Size(w, h), {
    offset: new kakao.maps.Point(w / 2, h),
  });
  imageCache.set(key, img);
  return img;
}

// ─── SDK 로드 ───
let sdkPromise: Promise<void> | null = null;
function loadKakaoMapSDK(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!apiKey) return Promise.reject(new Error('VITE_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다.'));
  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

// ─── 범례 ───
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

  // incidentId → { marker, color } 매핑 (hover 시 빠른 조회용)
  const markerMapRef = useRef<Map<string, { marker: kakao.maps.Marker; color: string }>>(new Map());

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('risk_level');

  const { data } = useIncidentsContext();
  const { setSelectedId } = useSelectedIncident();
  const { hoveredId } = useHoveredIncident();

  // 이전 hover 대상 복원용
  const prevHoveredRef = useRef<string | null>(null);

  useEffect(() => {
    loadKakaoMapSDK()
      .then(() => setSdkReady(true))
      .catch((err: Error) => setSdkError(err.message));
  }, []);

  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;
    mapRef.current = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(GWANGJU_CENTER.lat, GWANGJU_CENTER.lng),
      level: DEFAULT_LEVEL,
    });
  }, [sdkReady]);

  const handleMarkerClick = useCallback((item: IncidentSummary) => setSelectedId(item.incident_id), [setSelectedId]);

  // 마커 생성/갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sdkReady || !data) return;

    // 기존 마커 제거
    markerMapRef.current.forEach(({ marker }) => marker.setMap(null));
    markerMapRef.current.clear();

    data.items.forEach((item) => {
      const color = getPinColor(item, colorMode);
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(item.lat, item.lng),
        map,
        image: getMarkerImage(color, false),
        title: item.address,
        zIndex: 0,
      });
      kakao.maps.event.addListener(marker, 'click', () => handleMarkerClick(item));
      markerMapRef.current.set(item.incident_id, { marker, color });
    });

    prevHoveredRef.current = null;
  }, [data, sdkReady, colorMode, handleMarkerClick]);

  // ─── hover 강조 / 해제 ───
  useEffect(() => {
    const mMap = markerMapRef.current;

    // 이전 hover 해제
    const prevId = prevHoveredRef.current;
    if (prevId && prevId !== hoveredId) {
      const entry = mMap.get(prevId);
      if (entry) {
        entry.marker.setImage(getMarkerImage(entry.color, false));
        entry.marker.setZIndex(0);
      }
    }

    // 새 hover 강조
    if (hoveredId) {
      const entry = mMap.get(hoveredId);
      if (entry) {
        entry.marker.setImage(getMarkerImage(entry.color, true));
        entry.marker.setZIndex(999);
      }
    }

    prevHoveredRef.current = hoveredId;
  }, [hoveredId]);

  const legend = colorMode === 'risk_level' ? RISK_LEGEND : STATUS_LEGEND;

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
      {sdkReady && (
        <div className={styles.mapControl}>
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
