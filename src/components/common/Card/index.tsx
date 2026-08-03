import { cn } from '@/utils/cn';
import styles from './Card.module.scss';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'sunken' | 'outline';
  bodyClassName?: string;
}

export function Card({
  eyebrow,
  title,
  description,
  action,
  padding = 'md',
  variant = 'default',
  className,
  bodyClassName,
  children,
  ...rest
}: CardProps) {
  const hasHeader = Boolean(eyebrow || title || description || action);

  return (
    <section
      className={cn(styles.card, styles[`card--${variant}`], styles[`card--pad-${padding}`], {
        [className ?? '']: !!className,
      })}
      {...rest}
    >
      {hasHeader ? (
        <header className={styles.card__header}>
          <div className={styles.card__heading}>
            {eyebrow ? <p className={styles.card__eyebrow}>{eyebrow}</p> : null}
            {title ? <h3 className={styles.card__title}>{title}</h3> : null}
            {description ? <p className={styles.card__description}>{description}</p> : null}
          </div>
          {action ? <div className={styles.card__action}>{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(styles.card__body, { [bodyClassName ?? '']: !!bodyClassName })}>{children}</div>
    </section>
  );
}
