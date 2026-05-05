import FilterBox from './FilterBox/FilterBox';
import styles from './FilterPanel.module.scss';

export default function FilterPanel() {
  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>상세 목록 및 필터</h2>
      <FilterBox />
      {/* PotholeList는 8단계에서 추가 */}
    </aside>
  );
}
