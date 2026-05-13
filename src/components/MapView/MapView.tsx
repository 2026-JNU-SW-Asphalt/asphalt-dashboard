import { useEffect, useRef, useState, useCallback } from 'react';
import { useIncidentsContext } from '../../contexts/IncidentsContext';
import { useSelectedIncident } from '../../contexts/SelectedIncidentContext';
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

function createPinDataUri(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${fillColor}" stroke="#fff" stroke-width="1.5"/><circle cx="14" cy="14" r="5.5" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const imageCache = new Map<string, kakao.maps.MarkerImage>();
function getMarkerImage(color: string): kakao.maps.MarkerImage {
  if (imageCache.has(color)) return imageCache.get(color)!;
  const img = new kakao.maps.MarkerImage(createPinDataUri(color), new kakao.maps.Size(28, 40), {
    offset: new kakao.maps.Point(14, 40),
  });
  imageCache.set(color, img);
  return img;
}

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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

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

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('risk_level');

  const { data } = useIncidentsContext();
  const { setSelectedId } = useSelectedIncident();

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

  const handleMarkerClick = useCallback(
    (item: IncidentSummary) => {
      setSelectedId(item.incident_id);
    },
    [setSelectedId],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sdkReady || !data) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    markersRef.current = data.items.map((item) => {
      const color = getPinColor(item, colorMode);
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(item.lat, item.lng),
        map,
        image: getMarkerImage(color),
        title: item.address,
      });
      kakao.maps.event.addListener(marker, 'click', () => handleMarkerClick(item));
      return marker;
    });
  }, [data, sdkReady, colorMode, handleMarkerClick]);

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
