import { Plus, BarChart3, MapPin } from 'lucide-react';
import styles from './Header.module.scss';

export default function Header() {
  const handleReportClick = () => {
    // TODO: 포트홀 제보 기능 구현
  };

  const handleStatsClick = () => {
    // TODO: 데이터 통계 기능 구현
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleArea}>
        <div className={styles.iconWrapper}>
          <MapPin size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <h1 className={styles.title}>광주광역시 포트홀 통합 관제 시스템</h1>
      </div>

      <div className={styles.buttonArea}>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={handleReportClick}>
          <Plus size={16} strokeWidth={2.5} />
          <span>포트홀 제보</span>
        </button>

        <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={handleStatsClick}>
          <BarChart3 size={16} strokeWidth={2.5} />
          <span>데이터 통계</span>
        </button>
      </div>
    </header>
  );
}
