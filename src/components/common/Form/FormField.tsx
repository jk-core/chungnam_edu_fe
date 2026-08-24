import { cloneElement, isValidElement, useId } from 'react';
import { AlertIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from './Form.module.scss';
import type { ReactNode } from 'react';

/*
  라벨을 그리는 주체가 여섯이던 시절에 높이·간격·글자가 제각각 어긋났다. 여기 하나로 모은다.

  `id`·`aria-*` 는 자식에 주입한다 — 호출부가 `useId` 를 들고 다니며 라벨과 컨트롤 양쪽에 같은
  값을 넘기게 하면, 필드가 아홉 종이고 호출부가 수십 곳이라 한 곳만 빠뜨려도 조용히 깨진다.
*/

interface ControlSlotProps {
  id?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-describedby'?: string;
}

export interface FormFieldProps {
  label: string;
  /** SIF-001-02 */
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  /** 바깥 제목이 이미 같은 말을 하고 있을 때 */
  hideLabel?: boolean;
  /**
   * 라디오 묶음처럼 가리킬 컨트롤이 여럿이면 `<label for>` 로 이름을 붙일 수 없다.
   * 그때만 fieldset/legend 로 바꿔 묶음 전체에 이름을 준다.
   */
  as?: 'label' | 'fieldset';
  children: ReactNode;
}

export function FormField({
  label,
  required,
  optional,
  hint,
  error,
  hideLabel,
  as = 'label',
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const control = isValidElement<ControlSlotProps>(children) ? children : null;
  const id = control?.props.id ?? generatedId;
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const name = (
    <>
      {label}
      {required ? (
        <span className={styles.field__required} aria-hidden="true">
          *
        </span>
      ) : null}
      {optional && !required ? <span className={styles.field__optional}>(선택)</span> : null}
    </>
  );

  const message = (
    <>
      {hint && !error ? (
        <p className={styles.field__hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className={styles.field__error} id={`${id}-error`} role="alert">
          <AlertIcon width={14} height={14} />
          {error}
        </p>
      ) : null}
    </>
  );

  if (as === 'fieldset') {
    return (
      <fieldset className={cn(styles.field, styles['field--fieldset'])} aria-describedby={messageId}>
        <legend className={hideLabel ? styles['field__label--hidden'] : styles.field__label}>{name}</legend>
        {children}
        {message}
      </fieldset>
    );
  }

  return (
    <div className={styles.field}>
      <label
        id={`${id}-label`}
        className={hideLabel ? styles['field__label--hidden'] : styles.field__label}
        htmlFor={id}
      >
        {name}
      </label>

      {control
        ? cloneElement(control, {
          id,
          'aria-invalid': error ? true : control.props['aria-invalid'],
          'aria-required': required || control.props['aria-required'],
          'aria-describedby': control.props['aria-describedby'] ?? messageId,
        })
        : children}

      {message}
    </div>
  );
}
