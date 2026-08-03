import { AlertIcon } from '@/components/common/Icon';
import styles from './Form.module.scss';
import type { ReactNode } from 'react';

/** 입력 성격에 맞는 자판 힌트 (SIF-001-05) */
export type ImeMode = 'hangul' | 'latin' | 'numeric';

/** 담기는 데이터 길이에 맞춘 입력창 크기 (SIF-001-06) */
export type FieldWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  /** SIF-001-02 필수 항목 표시 */
  required?: boolean;
  /** 필수가 아님을 분명히 밝히고 싶을 때 */
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/**
 * 모든 입력의 껍데기.
 * 라벨·필수 표시·도움말·오류를 한 자리에서 붙여 화면마다 어긋나지 않게 한다.
 */
export function FormField({ label, htmlFor, required, optional, hint, error, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.field__label} htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className={styles.field__required} aria-hidden="true">
            *
          </span>
        ) : null}
        {optional && !required ? <span className={styles.field__optional}>(선택)</span> : null}
      </label>

      {children}

      {hint && !error ? (
        <p className={styles.field__hint} id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className={styles.field__error} id={`${htmlFor}-error`} role="alert">
          <AlertIcon width={14} height={14} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** 자판 힌트를 실제 속성으로 옮긴다. */
export function imeProps(ime: ImeMode | undefined) {
  if (ime === 'hangul') return { lang: 'ko', autoCapitalize: 'off' as const };
  if (ime === 'latin') return { lang: 'en', inputMode: 'text' as const, autoCapitalize: 'off' as const };
  if (ime === 'numeric') return { inputMode: 'numeric' as const };

  return {};
}

/** 도움말·오류를 스크린리더에 이어 붙인다. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;

  return undefined;
}
