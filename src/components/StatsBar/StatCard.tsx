import styles from './StatCard.module.scss';

interface StatCardProps {
  label: string;
  value: number | string;
  variant?: 'default' | 'urgent';
}

export default function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`${styles.card} ${variant === 'urgent' ? styles.urgent : ''}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value.toLocaleString()}</div>
    </div>
  );
}
