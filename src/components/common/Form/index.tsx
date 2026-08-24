import styles from './Form.module.scss';
import type { CSSProperties, ReactNode } from 'react';

export { createFields, createForm } from './createForm';
export { FormField } from './FormField';
export { withUnit } from './controls/shared';
export type { FieldWidth } from './controls/shared';
export { DateControl } from './controls/DateControl';
export { NumberControl } from './controls/NumberControl';
export { PasswordControl } from './controls/PasswordControl';
export { PickerControl } from './controls/PickerControl';
export { RadioControl } from './controls/RadioControl';
export { SelectControl } from './controls/SelectControl';
export { TextAreaControl } from './controls/TextAreaControl';
export { TextControl } from './controls/TextControl';
export { PasswordField, TextArea, TextField } from './fields';
export { CHECK_OPTIONS, RadioGroup } from './RadioGroup';
export type { OptionTone, RadioOption } from './controls/RadioControl';
export { FileUpload } from './FileUpload';
export type { UploadFile } from './FileUpload';

interface FormSectionProps {
  legend: string;
  hint?: string;
  children: ReactNode;
}

/** 제목이 붙은 입력 묶음. fieldset/legend 로 짜 스크린리더가 묶음을 읽는다. */
export function FormSection({ legend, hint, children }: FormSectionProps) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.section__legend}>{legend}</legend>
      {hint ? <p className={styles.section__hint}>{hint}</p> : null}
      {children}
    </fieldset>
  );
}

interface FormRowProps {
  /** 한 줄에 놓을 칸 수. 모바일에서는 무조건 한 칸으로 접힌다. */
  cols?: number;
  children: ReactNode;
}

export function FormRow({ cols = 2, children }: FormRowProps) {
  return (
    <div className={styles.row} style={{ '--row-cols': cols } as CSSProperties}>
      {children}
    </div>
  );
}
