import styles from './StatsModal.module.scss';
import type { CountItem } from '../../../utils/statistics';

interface Props {
  title: string;
  data: CountItem[];
  skeleton?: boolean;
}

export default function BarChart({ title, data, skeleton = false }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={`${styles.chartCard} ${skeleton ? styles.skeletonChart : ''}`}>
      <h4 className={styles.chartTitle}>{title}</h4>

      {data.length === 0 ? (
        <p className={styles.emptyChart}>데이터가 없습니다.</p>
      ) : (
        <div className={styles.barList}>
          {data.map((d) => (
            <div key={d.label} className={styles.barRow}>
              <span className={styles.barLabel}>{d.label}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${(d.count / max) * 100}%`,
                    background: d.color,
                  }}
                />
              </div>
              <span className={styles.barValue}>{skeleton ? <span className={styles.shimmerText} /> : d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
