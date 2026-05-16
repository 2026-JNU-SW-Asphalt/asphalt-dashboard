import { useState, useEffect, useMemo } from 'react';
import { fetchIncidents } from '../../../services/api';
import { computeSummary, computeByGu, computeByStatus, computeByRisk, computeCross } from '../../../utils/statistics';
import DonutChart from './DonutChart';
import BarChart from './BarChart';
import StackedBarChart from './StackedBarChart';
import styles from './StatsModal.module.scss';

import type { IncidentSummary, FilterState } from '../../../types/incident';

interface Props {
  onClose: () => void;
}

const GU_OPTIONS = ['전체', '동구', '서구', '남구', '북구', '광산구'];
const RISK_OPTIONS = ['전체', '긴급', '주의', '낮음'];

const FULL_QUERY: FilterState = {
  gu: '',
  risk_level: '',
  status: '',
  date_from: '',
  date_to: '',
  sort_by: 'risk_score',
  order: 'desc',
};

// ─── 스켈레톤용 임시 데이터 (회색 톤) ───
const SKEL_GRAY = '#d1d5db';

const SKEL_SUMMARY_LABELS = ['전체 포트홀', '미처리', '긴급', '보수 완료율'];

const SKEL_DONUT_STATUS = [
  { label: '보수전', count: 4, color: SKEL_GRAY },
  { label: '보수중', count: 3, color: '#c4c8ce' },
  { label: '보수완료', count: 3, color: '#b8bcc3' },
];
const SKEL_DONUT_RISK = [
  { label: '긴급', count: 3, color: SKEL_GRAY },
  { label: '주의', count: 4, color: '#c4c8ce' },
  { label: '낮음', count: 3, color: '#b8bcc3' },
];

const SKEL_BAR = ['서구', '북구', '광산구', '남구', '동구'].map((label, i) => ({
  label,
  count: [5, 4, 3, 2, 1][i],
  color: SKEL_GRAY,
}));

const SKEL_CROSS = ['서구', '북구', '광산구', '남구', '동구'].map((gu, i) => ({
  gu,
  before: [2, 1, 1, 1, 0][i],
  progress: [2, 2, 1, 1, 1][i],
  done: [1, 1, 1, 0, 0][i],
  total: [5, 4, 3, 2, 1][i],
}));

export default function StatsModal({ onClose }: Props) {
  const [allItems, setAllItems] = useState<IncidentSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guFilter, setGuFilter] = useState('전체');
  const [riskFilter, setRiskFilter] = useState('전체');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchIncidents(FULL_QUERY)
      .then((res) => {
        if (!cancelled) setAllItems(res.items);
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
  }, []);

  const filtered = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((i) => {
      if (guFilter !== '전체' && i.gu !== guFilter) return false;
      if (riskFilter !== '전체' && i.risk_level !== riskFilter) return false;
      return true;
    });
  }, [allItems, guFilter, riskFilter]);

  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  const byGu = useMemo(() => computeByGu(filtered), [filtered]);
  const byStatus = useMemo(() => computeByStatus(filtered), [filtered]);
  const byRisk = useMemo(() => computeByRisk(filtered), [filtered]);
  const cross = useMemo(() => computeCross(filtered), [filtered]);

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

        {/* 필터 바 */}
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
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {/* ── 스켈레톤 ── */}
          {loading && (
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

              {/* 교차 스켈레톤 */}
              <StackedBarChart title="자치구별 보수 진행 현황" data={SKEL_CROSS} skeleton />
            </div>
          )}

          {/* ── 에러 ── */}
          {error && !loading && <div className={`${styles.stateMsg} ${styles.errorMsg}`}>{error}</div>}

          {/* ── 실제 데이터 ── */}
          {!loading && !error && (
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

              {filtered.length === 0 ? (
                <div className={styles.stateMsg}>선택한 조건에 해당하는 데이터가 없습니다.</div>
              ) : (
                <>
                  <div className={styles.chartRow}>
                    <DonutChart title="보수 상태 분포" data={byStatus} />
                    <DonutChart title="위험도 분포" data={byRisk} />
                  </div>
                  <BarChart title="자치구별 포트홀 분포" data={byGu} />
                  <StackedBarChart title="자치구별 보수 진행 현황" data={cross} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
