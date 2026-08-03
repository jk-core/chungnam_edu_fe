import styles from './EmptyState.module.scss';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.empty__title}>{title}</p>
      {description ? <p className={styles.empty__description}>{description}</p> : null}
      {action ? <div className={styles.empty__action}>{action}</div> : null}
    </div>
  );
}
