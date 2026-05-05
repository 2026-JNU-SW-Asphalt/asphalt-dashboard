import { useFilterContext } from '../../../contexts/FilterContext';
import {
  DISTRICT_OPTIONS,
  RISK_LEVEL_OPTIONS,
  STATUS_OPTIONS,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
  ALL_VALUE,
} from '../../../constants/filterOptions';
import type { SortBy, SortOrder } from '../../../types/incident';
import styles from './FilterBox.module.scss';

export default function FilterBox() {
  const { filters, setFilters, resetFilters } = useFilterContext();

  const handleSelectChange = (key: 'gu' | 'risk_level' | 'status') => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      [key]: value === ALL_VALUE ? '' : value,
    });
  };

  const handleDateChange = (key: 'date_from' | 'date_to') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let isoValue = '';
    if (value) {
      isoValue = key === 'date_from' ? `${value}T00:00:00Z` : `${value}T23:59:59Z`;
    }
    setFilters({ ...filters, [key]: isoValue });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, sort_by: e.target.value as SortBy });
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, order: e.target.value as SortOrder });
  };

  const toDateInputValue = (iso: string): string => {
    if (!iso) return '';
    return iso.slice(0, 10);
  };

  const displayValue = (value: string) => value || ALL_VALUE;

  return (
    <div className={styles.filterBox}>
      <div className={styles.field}>
        <label htmlFor="filter-gu" className={styles.label}>
          자치구별
        </label>
        <select
          id="filter-gu"
          className={styles.select}
          value={displayValue(filters.gu)}
          onChange={handleSelectChange('gu')}
        >
          {DISTRICT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-risk-level" className={styles.label}>
          위험도별
        </label>
        <select
          id="filter-risk-level"
          className={styles.select}
          value={displayValue(filters.risk_level)}
          onChange={handleSelectChange('risk_level')}
        >
          {RISK_LEVEL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-status" className={styles.label}>
          보수 상태별
        </label>
        <select
          id="filter-status"
          className={styles.select}
          value={displayValue(filters.status)}
          onChange={handleSelectChange('status')}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>기한 (신고일 기준)</label>
        <div className={styles.dateRange}>
          <input
            id="filter-date-from"
            type="date"
            aria-label="시작일"
            className={styles.dateInput}
            value={toDateInputValue(filters.date_from)}
            onChange={handleDateChange('date_from')}
            max={toDateInputValue(filters.date_to) || undefined}
          />
          <span className={styles.separator}>~</span>
          <input
            id="filter-date-to"
            type="date"
            aria-label="종료일"
            className={styles.dateInput}
            value={toDateInputValue(filters.date_to)}
            onChange={handleDateChange('date_to')}
            min={toDateInputValue(filters.date_from) || undefined}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>정렬</label>
        <div className={styles.sortRow}>
          <select
            id="filter-sort-by"
            aria-label="정렬 기준"
            className={styles.select}
            value={filters.sort_by}
            onChange={handleSortByChange}
          >
            {SORT_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            id="filter-sort-order"
            aria-label="정렬 방향"
            className={styles.select}
            value={filters.order}
            onChange={handleOrderChange}
          >
            {SORT_ORDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className={styles.resetButton} onClick={resetFilters}>
        필터 초기화
      </button>
    </div>
  );
}
