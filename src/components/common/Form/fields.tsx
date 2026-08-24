import { FormField } from './FormField';
import { NumberControl } from './controls/NumberControl';
import { PasswordControl } from './controls/PasswordControl';
import { TextAreaControl } from './controls/TextAreaControl';
import { TextControl } from './controls/TextControl';
import type { FieldWidth, ImeMode } from './controls/shared';

/*
  라벨 붙은 칸 한 줄짜리 — `FormField` 와 컨트롤을 붙여 놓은 것뿐이다.

  react-hook-form 을 쓰지 않는 화면(로컬 draft 로 도는 폼)이 아직 여럿이라 남겨 둔다.
  그쪽이 전부 옮겨 가면 이 파일은 사라지고, 호출부가 `FormField` 와 컨트롤을 직접 조립한다.
*/

interface ShellProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
}

interface BaseProps extends ShellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  ime?: ImeMode;
  width?: FieldWidth;
}

export function TextField({ label, required, optional, hint, error, hideLabel, ...control }: BaseProps) {
  return (
    <FormField label={label} required={required} optional={optional} hint={hint} error={error} hideLabel={hideLabel}>
      <TextControl {...control} />
    </FormField>
  );
}

export function TextArea({
  label,
  required,
  optional,
  hint,
  error,
  hideLabel,
  ...control
}: Omit<BaseProps, 'width'>) {
  return (
    <FormField label={label} required={required} optional={optional} hint={hint} error={error} hideLabel={hideLabel}>
      <TextAreaControl {...control} />
    </FormField>
  );
}

interface NumberFieldProps extends Omit<BaseProps, 'value' | 'onChange' | 'ime'> {
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  /** 값 뒤에 붙는 단위 표기 */
  unit?: string;
}

export function NumberField({
  label,
  required,
  optional,
  hint,
  error,
  hideLabel,
  unit,
  ...control
}: NumberFieldProps) {
  return (
    <FormField
      label={label}
      required={required}
      optional={optional}
      // 단위는 도움말에 실어 보낸다 — 칸 안에 적을 자리가 없고, 스크린리더도 이 줄로 읽는다.
      hint={unit ? `${hint ? `${hint} · ` : ''}단위 ${unit}` : hint}
      error={error}
      hideLabel={hideLabel}
    >
      <NumberControl {...control} />
    </FormField>
  );
}

export function PasswordField({ label, required, optional, hint, error, hideLabel, ...control }: BaseProps) {
  return (
    <FormField label={label} required={required} optional={optional} hint={hint} error={error} hideLabel={hideLabel}>
      <PasswordControl {...control} />
    </FormField>
  );
}
