import { useDashboard } from '../../hooks/useDashboard';
import StatCard from './StatCard';
import styles from './StatsBar.module.scss';

export default function StatsBar() {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className={styles.statsBar}>
        <StatCard label="활성 포트홀" value="—" />
        <StatCard label="긴급 보수 (위험도 80↑)" value="—" variant="urgent" />
        <StatCard label="보수 완료 (누적)" value="—" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.statsBar}>
        <div className={styles.errorMessage}>통계 데이터를 불러오지 못했습니다.</div>
      </div>
    );
  }

  const { counts } = data;

  // 활성 포트홀 = 보수전 + 보수중
  const activeCount = counts.status_counts.before_repair + counts.status_counts.in_progress;

  // 긴급 보수 = risk_level_counts.urgent
  const urgentCount = counts.risk_level_counts.urgent;

  // 보수 완료 (누적) = status_counts.completed
  const completedCount = counts.status_counts.completed;

  return (
    <div className={styles.statsBar}>
      <StatCard label="활성 포트홀" value={activeCount} />
      <StatCard label="긴급 보수 (위험도 80↑)" value={urgentCount} variant="urgent" />
      <StatCard label="보수 완료 (누적)" value={completedCount} />
    </div>
  );
}
