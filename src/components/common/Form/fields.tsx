import type { ImeMode } from '@/utils/ime';
import { FormField } from './FormField';
import { PasswordControl } from './controls/PasswordControl';
import { TextAreaControl } from './controls/TextAreaControl';
import { TextControl } from './controls/TextControl';
import type { FieldWidth } from './controls/shared';

/*
  react-hook-form 을 쓰지 않는 화면(로컬 draft 로 도는 폼)이 아직 여럿이라 남겨 둔다.
  그쪽이 전부 옮겨 가면 이 파일은 사라지고, 호출부가 `FormField` 와 컨트롤을 직접 조립한다.
*/

interface BaseProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
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

export function PasswordField({ label, required, optional, hint, error, hideLabel, ...control }: BaseProps) {
  return (
    <FormField label={label} required={required} optional={optional} hint={hint} error={error} hideLabel={hideLabel}>
      <PasswordControl {...control} />
    </FormField>
  );
}
