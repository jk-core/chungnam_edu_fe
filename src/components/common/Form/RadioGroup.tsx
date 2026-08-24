import { FormField } from './FormField';
import { RadioControl } from './controls/RadioControl';
import type { RadioOption } from './controls/RadioControl';

export type { OptionTone, RadioOption } from './controls/RadioControl';

/** 점검 결과 — 표준 체크리스트가 쓰는 「양호 / 미흡」 에 「해당없음」 을 더한 셋 (SFR-021-02) */
export const CHECK_OPTIONS: RadioOption<'normal' | 'abnormal' | 'na'>[] = [
  { value: 'normal', label: '양호', tone: 'ok' },
  { value: 'abnormal', label: '미흡', tone: 'critical' },
  { value: 'na', label: '해당없음', tone: 'offline' },
];

interface RadioGroupProps<T extends string> {
  legend: string;
  value: T | null;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  inline?: boolean;
  error?: string;
}

/** 라벨 붙은 라디오 묶음 — `FormField` 와 `RadioControl` 을 붙여 놓은 것뿐이다. */
export function RadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  required,
  inline,
  error,
}: RadioGroupProps<T>) {
  return (
    <FormField as="fieldset" label={legend} required={required} error={error}>
      <RadioControl value={value} options={options} onChange={onChange} required={required} inline={inline} />
    </FormField>
  );
}
