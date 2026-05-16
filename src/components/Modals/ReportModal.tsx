import { useState, useEffect, useRef } from 'react';
import styles from './ReportModal.module.scss';

interface Props {
  onClose: () => void;
}

interface LocationInfo {
  lat: number;
  lng: number;
  address: string; // "~동" 까지
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * 포트홀 제보 데이터 — 추후 전송 기능 확장 시 이 인터페이스를 사용
 */
export interface ReportPayload {
  lat: number;
  lng: number;
  address: string;
  detailAddress: string;
  photo: File | null;
}

/**
 * 제보 전송 함수 — 현재는 콘솔 로그만 출력.
 * 추후 실제 API 연동 시 이 함수만 교체하면 된다.
 */
async function submitReport(payload: ReportPayload): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[ReportModal] 제보 데이터:', payload);

  // 실제 전송 예시 (추후 활성화):
  // const formData = new FormData();
  // formData.append('lat', String(payload.lat));
  // formData.append('lng', String(payload.lng));
  // formData.append('address', payload.address);
  // formData.append('detail_address', payload.detailAddress);
  // if (payload.photo) formData.append('photo', payload.photo);
  // await fetch('/api/incidents/report', { method: 'POST', body: formData });

  // 가짜 딜레이
  await new Promise((r) => setTimeout(r, 800));
}

/** 카카오맵 SDK Geocoder로 "~동" 주소 추출 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // SDK가 로드되어 있는지 확인 (MapView에서 이미 로드됨)
  if (!window.kakao?.maps?.services) {
    // SDK가 아직 로드되지 않은 경우 대기
    await new Promise<void>((resolve, reject) => {
      const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
      if (!apiKey) {
        reject(new Error('VITE_KAKAO_MAP_KEY 미설정'));
        return;
      }

      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
        return;
      }

      // MapView보다 먼저 열릴 수 있으므로 SDK 직접 로드
      const existing = document.querySelector<HTMLScriptElement>('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
      if (existing) {
        existing.onload = () => window.kakao.maps.load(() => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
      script.onload = () => window.kakao.maps.load(() => resolve());
      script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
      document.head.appendChild(script);
    });
  }

  return new Promise<string>((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lng, lat, (result: kakao.maps.services.RegionCode[], status: string) => {
      if (status !== kakao.maps.services.Status.OK || !result.length) {
        reject(new Error('역지오코딩 실패'));
        return;
      }

      // region_type === 'H' 가 행정동
      const dong = result.find((r) => r.region_type === 'H');
      if (dong) {
        resolve(`${dong.region_1depth_name} ${dong.region_2depth_name} ${dong.region_3depth_name}`);
        return;
      }

      // H가 없으면 첫 번째 결과 사용
      const first = result[0];
      resolve(`${first.region_1depth_name} ${first.region_2depth_name} ${first.region_3depth_name}`);
    });
  });
}

export default function ReportModal({ onClose }: Props) {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [detailAddress, setDetailAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 위치 권한 요청 + 역지오코딩 ───
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 서비스를 사용할 수 없습니다.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const addr = await reverseGeocode(latitude, longitude);
          setLocation({ lat: latitude, lng: longitude, address: addr });
        } catch {
          setLocationError('주소를 가져오는 데 실패했습니다.');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError('위치 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.');
            break;
          case err.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다.');
            break;
          default:
            setLocationError('위치를 가져오는 데 실패했습니다.');
        }
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // ─── 사진 선택 ───
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  }

  function handleRemovePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ─── 제보하기 ───
  async function handleSubmit() {
    if (!location) return;

    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      await submitReport({
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        detailAddress: detailAddress.trim(),
        photo,
      });
      setSubmitStatus('success');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : '제보에 실패했습니다.');
      setSubmitStatus('error');
    }
  }

  const canSubmit = !!location && submitStatus !== 'submitting';

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h3 className={styles.title}>포트홀 제보</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {/* 성공 화면 */}
          {submitStatus === 'success' ? (
            <div className={styles.successWrap}>
              <div className={styles.successIcon}>✓</div>
              <p className={styles.successText}>제보가 접수되었습니다.</p>
              <p className={styles.successSub}>확인 후 신속히 처리하겠습니다.</p>
              <button type="button" className={styles.primaryBtn} onClick={onClose}>
                확인
              </button>
            </div>
          ) : (
            <>
              {/* 현재 위치 */}
              <div className={styles.field}>
                <label className={styles.label}>현재 위치</label>
                {locationLoading && (
                  <div className={styles.locationLoading}>
                    <span className={styles.spinner} />
                    위치를 확인하는 중…
                  </div>
                )}
                {locationError && <p className={styles.locationError}>{locationError}</p>}
                {location && <p className={styles.locationValue}>{location.address}</p>}
              </div>

              {/* 상세 위치 */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="detail-address">
                  상세 위치 <span className={styles.optional}>(선택)</span>
                </label>
                <input
                  id="detail-address"
                  type="text"
                  className={styles.input}
                  placeholder="예: OO마트 앞 횡단보도"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  disabled={submitStatus === 'submitting'}
                />
              </div>

              {/* 사진 첨부 */}
              <div className={styles.field}>
                <label className={styles.label}>
                  사진 첨부 <span className={styles.optional}>(선택)</span>
                </label>

                {photoPreview ? (
                  <div className={styles.previewWrap}>
                    <img src={photoPreview} alt="첨부 사진 미리보기" className={styles.previewImg} />
                    <button type="button" className={styles.removePhotoBtn} onClick={handleRemovePhoto}>
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitStatus === 'submitting'}
                  >
                    <span className={styles.uploadIcon}>📷</span>
                    사진 선택
                  </button>
                )}

                <input
                  id="report-photo-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="포트홀 사진 첨부"
                  className={styles.hiddenInput}
                  onChange={handlePhotoChange}
                />
              </div>

              {/* 에러 메시지 */}
              <div className={styles.errorSlot}>{submitError && <p className={styles.error}>{submitError}</p>}</div>

              {/* 제보하기 버튼 */}
              <button type="button" className={styles.primaryBtn} onClick={handleSubmit} disabled={!canSubmit}>
                {submitStatus === 'submitting' ? '제보 중…' : '제보하기'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
