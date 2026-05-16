import styles from './StatsModal.module.scss';
import type { CrossRow } from '../../../utils/statistics';

interface Props {
  title: string;
  data: CrossRow[];
  skeleton?: boolean;
}

const SEGMENTS = [
  { key: 'before' as const, label: '보수전', color: '#ef4444', skelColor: '#d1d5db' },
  { key: 'progress' as const, label: '보수중', color: '#3b82f6', skelColor: '#c4c8ce' },
  { key: 'done' as const, label: '보수완료', color: '#10b981', skelColor: '#b8bcc3' },
];

export default function StackedBarChart({ title, data, skeleton = false }: Props) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className={`${styles.chartCard} ${skeleton ? styles.skeletonChart : ''}`}>
      <div className={styles.stackedHeader}>
        <h4 className={styles.chartTitle}>{title}</h4>
        <div className={styles.stackedLegend}>
          {SEGMENTS.map((s) => (
            <span key={s.key} className={styles.legendRow}>
              <span className={styles.legendDot} style={{ background: skeleton ? s.skelColor : s.color }} />
              <span className={styles.legendLabel}>{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className={styles.emptyChart}>데이터가 없습니다.</p>
      ) : (
        <div className={styles.barList}>
          {data.map((row) => (
            <div key={row.gu} className={styles.barRow}>
              <span className={styles.barLabel}>{row.gu}</span>
              <div className={styles.barTrack}>
                {row.total > 0 && (
                  <div className={styles.stackedFill} style={{ width: `${(row.total / max) * 100}%` }}>
                    {SEGMENTS.map((s) => {
                      const v = row[s.key];
                      if (v === 0) return null;
                      return (
                        <div
                          key={s.key}
                          className={styles.stackedSegment}
                          style={{ flexGrow: v, background: skeleton ? s.skelColor : s.color }}
                          title={`${s.label} ${v}건`}
                        >
                          {skeleton ? '' : v}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className={styles.barValue}>{skeleton ? <span className={styles.shimmerText} /> : row.total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
