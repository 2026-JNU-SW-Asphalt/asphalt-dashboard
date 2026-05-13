import { useState } from 'react';
import { verifyAdminKey, patchIncidentStatus } from '../../services/api';
import { useSelectedIncident } from '../../contexts/SelectedIncidentContext';
import { useIncidentsContext } from '../../contexts/IncidentsContext';
import styles from './RepairManageModal.module.scss';

import type { RepairStatus } from '../../types/incident';

interface Props {
  incidentId: string;
  currentStatus: RepairStatus;
  onClose: () => void;
}

type Step = 'auth' | 'change';

const STATUS_OPTIONS: RepairStatus[] = ['보수전', '보수중', '보수완료'];

export default function RepairManageModal({ incidentId, currentStatus, onClose }: Props) {
  const { refetchDetail } = useSelectedIncident();
  const { refetch: refetchList } = useIncidentsContext();

  const [step, setStep] = useState<Step>('auth');
  const [adminKey, setAdminKey] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RepairStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 1단계: 관리자 키 인증 */
  async function handleVerify() {
    if (!adminKey.trim()) {
      setError('관리자 키를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await verifyAdminKey(adminKey.trim());
      setAdminToken(res.admin_token);
      setStep('change');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  /** 2단계: 상태 변경 요청 */
  async function handleChangeStatus() {
    if (selectedStatus === currentStatus) {
      setError('현재 상태와 동일합니다. 다른 상태를 선택해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await patchIncidentStatus(incidentId, selectedStatus, adminToken);
      // 성공 → 목록 + 상세 재조회 후 닫기
      refetchList();
      refetchDetail();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  /** Enter 키 처리 */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && step === 'auth') handleVerify();
  }

  const isCompleted = currentStatus === '보수완료';

  return (
    /* 딤드 바깥 클릭 차단: onClick 없음 */
    <div className={styles.backdrop}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h3 className={styles.title}>보수 관리</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {step === 'auth' && (
            <>
              <label className={styles.label} htmlFor="admin-key-input">
                관리자 키
              </label>
              <input
                id="admin-key-input"
                type="password"
                className={styles.input}
                placeholder="관리자 키를 입력하세요"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={loading}
              />
              {/* 에러 영역: 높이 고정으로 UI 점프 방지 */}
              <div className={styles.errorSlot}>{error && <p className={styles.error}>{error}</p>}</div>
              <button type="button" className={styles.primaryBtn} onClick={handleVerify} disabled={loading}>
                {loading ? '확인 중…' : '확인'}
              </button>
            </>
          )}

          {step === 'change' && (
            <>
              {isCompleted ? (
                <p className={styles.notice}>보수완료 상태는 변경할 수 없습니다.</p>
              ) : (
                <>
                  <label className={styles.label}>변경할 상태를 선택하세요</label>
                  <div className={styles.statusGroup}>
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.statusOption} ${selectedStatus === s ? styles.statusSelected : ''} ${s === currentStatus ? styles.statusCurrent : ''}`}
                        onClick={() => setSelectedStatus(s)}
                        disabled={loading}
                      >
                        {s}
                        {s === currentStatus && <span className={styles.currentTag}>현재</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className={styles.errorSlot}>{error && <p className={styles.error}>{error}</p>}</div>

              {!isCompleted && (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleChangeStatus}
                  disabled={loading || selectedStatus === currentStatus}
                >
                  {loading ? '변경 중…' : '변경 완료'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
