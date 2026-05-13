import { useIncidentsContext } from '../../../contexts/IncidentsContext';
import styles from './IncidentList.module.scss';

import type { RiskLevel, RepairStatus } from '../../../types/incident';

/** 위험도 배지 스타일 매핑 */
function riskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case '긴급':
      return styles.riskUrgent;
    case '주의':
      return styles.riskCaution;
    case '낮음':
      return styles.riskLow;
  }
}

/** 상태 배지 스타일 매핑 */
function statusBadgeClass(status: RepairStatus): string {
  switch (status) {
    case '보수전':
      return styles.statusBefore;
    case '보수중':
      return styles.statusProgress;
    case '보수완료':
      return styles.statusDone;
  }
}

/** ISO 8601 → 'YYYY-MM-DD' */
function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/** incident_id에서 짧은 번호 추출 (INC-00000001 → 001) */
function shortId(incidentId: string): string {
  const num = incidentId.replace(/^INC-0*/, '');
  return num.padStart(3, '0');
}

export default function IncidentList() {
  const { data, loading, error } = useIncidentsContext();

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.emptyState}>불러오는 중…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorState}>목록을 불러오지 못했습니다.</div>
      </div>
    );
  }

  const { items, count } = data;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.listTitle}>포트홀 목록</span>
        <span className={styles.count}>{count}건</span>
      </div>

      <div className={styles.tableWrap}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>조건에 맞는 포트홀이 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>위험도</th>
                <th>ID</th>
                <th>위치</th>
                <th>신고일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.incident_id}>
                  <td>
                    <span className={`${styles.riskBadge} ${riskBadgeClass(item.risk_level)}`}>{item.risk_level}</span>
                  </td>
                  <td className={styles.incidentId}>{shortId(item.incident_id)}</td>
                  <td className={styles.address}>{item.address}</td>
                  <td className={styles.date}>{formatDate(item.occurred_at)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${statusBadgeClass(item.status)}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
