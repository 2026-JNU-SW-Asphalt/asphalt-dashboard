import { useState, useEffect, useMemo } from 'react';
import { fetchStatistics } from '../../../services/api';
import DonutChart from './DonutChart';
import BarChart from './BarChart';
import styles from './StatsModal.module.scss';

import type { StatisticsResponse } from '../../../types/incident';
import type { CountItem } from '../../../utils/statistics';

interface Props {
  onClose: () => void;
}

const GU_OPTIONS = ['전체', '동구', '서구', '남구', '북구', '광산구'];
const RISK_OPTIONS = ['전체', '긴급', '주의', '낮음'];

const ALL_GU = ['동구', '서구', '남구', '북구', '광산구'];

const STATUS_COLORS = { before: '#ef4444', progress: '#3b82f6', done: '#10b981' };
const RISK_COLORS = { urgent: '#ea5a52', caution: '#efaa3a', low: '#f3d746' };
const GU_COLOR = '#2563eb';

// ─── 스켈레톤용 임시 데이터 (회색 톤) ───
const SKEL_GRAY = '#d1d5db';

const SKEL_SUMMARY_LABELS = ['전체 포트홀', '미처리', '긴급', '보수 완료율'];

const SKEL_DONUT_STATUS: CountItem[] = [
  { label: '보수전', count: 4, color: SKEL_GRAY },
  { label: '보수중', count: 3, color: '#c4c8ce' },
  { label: '보수완료', count: 3, color: '#b8bcc3' },
];
const SKEL_DONUT_RISK: CountItem[] = [
  { label: '긴급', count: 3, color: SKEL_GRAY },
  { label: '주의', count: 4, color: '#c4c8ce' },
  { label: '낮음', count: 3, color: '#b8bcc3' },
];

const SKEL_BAR: CountItem[] = ALL_GU.map((label, i) => ({
  label,
  count: [1, 5, 2, 4, 3][i],
  color: SKEL_GRAY,
}));

export default function StatsModal({ onClose }: Props) {
  const [stats, setStats] = useState<StatisticsResponse['statistics'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guFilter, setGuFilter] = useState('전체');
  const [riskFilter, setRiskFilter] = useState('전체');

  // 필터 변경 시 statistics API 재조회
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStatistics({ gu: guFilter, risk_level: riskFilter })
      .then((res) => {
        if (!cancelled) setStats(res.statistics);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guFilter, riskFilter]);

  // ─── 집계 → 차트 데이터 변환 ───
  const summary = useMemo(() => {
    if (!stats) return { total: 0, unresolved: 0, urgent: 0, completionRate: 0 };
    const total = stats.total_detected;
    const completionRate = total === 0 ? 0 : Math.round((stats.status_counts.completed / total) * 100);
    return {
      total,
      unresolved: stats.active_total,
      urgent: stats.risk_level_counts.urgent,
      completionRate,
    };
  }, [stats]);

  const byStatus: CountItem[] = useMemo(() => {
    if (!stats) return [];
    return [
      { label: '보수전', count: stats.status_counts.before_repair, color: STATUS_COLORS.before },
      { label: '보수중', count: stats.status_counts.in_progress, color: STATUS_COLORS.progress },
      { label: '보수완료', count: stats.status_counts.completed, color: STATUS_COLORS.done },
    ];
  }, [stats]);

  const byRisk: CountItem[] = useMemo(() => {
    if (!stats) return [];
    return [
      { label: '긴급', count: stats.risk_level_counts.urgent, color: RISK_COLORS.urgent },
      { label: '주의', count: stats.risk_level_counts.caution, color: RISK_COLORS.caution },
      { label: '낮음', count: stats.risk_level_counts.low, color: RISK_COLORS.low },
    ];
  }, [stats]);

  // gu_counts → 전체 자치구 고정 순서 (없는 구는 0건)
  const byGu: CountItem[] = useMemo(() => {
    if (!stats) return [];
    const map = new Map<string, number>();
    stats.gu_counts.forEach((g) => map.set(g.gu, g.count));
    return ALL_GU.map((gu) => ({ label: gu, count: map.get(gu) ?? 0, color: GU_COLOR }));
  }, [stats]);

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h3 className={styles.title}>데이터 통계</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {/* 필터 바 + 에러 안내 */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="stats-gu">
              자치구
            </label>
            <select
              id="stats-gu"
              className={styles.select}
              value={guFilter}
              onChange={(e) => setGuFilter(e.target.value)}
              disabled={loading}
            >
              {GU_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="stats-risk">
              위험도
            </label>
            <select
              id="stats-risk"
              className={styles.select}
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              disabled={loading}
            >
              {RISK_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {error && <span className={styles.filterError}>데이터를 불러오지 못했습니다.</span>}
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {/* ── 스켈레톤: 로딩 중이거나 에러일 때 모두 표시 ── */}
          {(loading || error) && (
            <div className={styles.skeletonWrap}>
              {/* 지표 카드 스켈레톤 */}
              <div className={styles.summaryGrid}>
                {SKEL_SUMMARY_LABELS.map((label) => (
                  <div key={label} className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>{label}</span>
                    <span className={styles.shimmerValue} />
                  </div>
                ))}
              </div>

              {/* 도넛 스켈레톤 */}
              <div className={styles.chartRow}>
                <DonutChart title="보수 상태 분포" data={SKEL_DONUT_STATUS} skeleton />
                <DonutChart title="위험도 분포" data={SKEL_DONUT_RISK} skeleton />
              </div>

              {/* 막대 스켈레톤 */}
              <BarChart title="자치구별 포트홀 분포" data={SKEL_BAR} skeleton />
            </div>
          )}

          {/* ── 실제 데이터 ── */}
          {!loading && !error && stats && (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>전체 포트홀</span>
                  <span className={styles.summaryValue}>{summary.total}</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.cardWarn}`}>
                  <span className={styles.summaryLabel}>미처리</span>
                  <span className={styles.summaryValue}>{summary.unresolved}</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.cardDanger}`}>
                  <span className={styles.summaryLabel}>긴급</span>
                  <span className={styles.summaryValue}>{summary.urgent}</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.cardGood}`}>
                  <span className={styles.summaryLabel}>보수 완료율</span>
                  <span className={styles.summaryValue}>
                    {summary.completionRate}
                    <span className={styles.summaryUnit}>%</span>
                  </span>
                </div>
              </div>

              {summary.total === 0 ? (
                <div className={styles.stateMsg}>선택한 조건에 해당하는 데이터가 없습니다.</div>
              ) : (
                <>
                  <div className={styles.chartRow}>
                    <DonutChart title="보수 상태 분포" data={byStatus} />
                    <DonutChart title="위험도 분포" data={byRisk} />
                  </div>
                  <BarChart title="자치구별 포트홀 분포" data={byGu} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
