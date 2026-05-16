import styles from './StatsModal.module.scss';
import type { CountItem } from '../../../utils/statistics';

interface Props {
  title: string;
  data: CountItem[];
  skeleton?: boolean;
}

const SIZE = 140;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({ title, data, skeleton = false }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  let offsetAccum = 0;

  return (
    <div className={`${styles.chartCard} ${skeleton ? styles.skeletonChart : ''}`}>
      <h4 className={styles.chartTitle}>{title}</h4>

      <div className={styles.donutWrap}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {total === 0 ? (
              <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
            ) : (
              data.map((d) => {
                if (d.count === 0) return null;
                const fraction = d.count / total;
                const dash = fraction * CIRCUMFERENCE;
                const segment = (
                  <circle
                    key={d.label}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                    strokeDashoffset={-offsetAccum}
                  />
                );
                offsetAccum += dash;
                return segment;
              })
            )}
          </g>
          <text x="50%" y="46%" textAnchor="middle" className={styles.donutCenterNum}>
            {skeleton ? '' : total}
          </text>
          <text x="50%" y="60%" textAnchor="middle" className={styles.donutCenterLabel}>
            {skeleton ? '' : '건'}
          </text>
        </svg>

        <div className={styles.legend}>
          {data.map((d) => (
            <div key={d.label} className={styles.legendRow}>
              <span className={styles.legendDot} style={{ background: d.color }} />
              <span className={styles.legendLabel}>{d.label}</span>
              <span className={styles.legendValue}>
                {skeleton ? (
                  <span className={styles.shimmerText} />
                ) : (
                  <>
                    {d.count}건
                    {total > 0 && <span className={styles.legendPct}> ({Math.round((d.count / total) * 100)}%)</span>}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
