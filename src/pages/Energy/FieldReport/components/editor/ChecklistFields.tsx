import { CHECK_OPTIONS, FormSection, TextField } from '@/components/common/Form';
import { CHECKLIST_NOTICE } from '@/mocks/fieldReport';
import { cn } from '@/utils/cn';
import { RadioGroup } from '@/components/common/Form';
import type { CheckResult } from '@/interface/fieldReport';
import styles from '../../FieldReport.module.scss';
import type { TemplateQuestion } from './question';

interface ChecklistFieldsProps {
  questions: TemplateQuestion[];
  results: Record<string, CheckResult | null>;
  notes: Record<string, string>;
  onResult: (id: string, value: CheckResult) => void;
  onNote: (id: string, value: string) => void;
  /** 지금 걸린 오류 문구. 그 번호의 항목에만 붙는다 */
  error?: string;
}

/** 점검 항목 (SFR-021). 전부 골라야 제출할 수 있다. */
export function ChecklistFields({ questions, results, notes, onResult, onNote, error }: ChecklistFieldsProps) {
  const hasAbnormal = questions.some((question) => results[question.id] === 'abnormal');

  return (
    <>
      <FormSection
        legend="점검 항목"
        hint="항목마다 양호·미흡·해당없음 중 하나를 골라 주세요. 전부 골라야 제출할 수 있습니다."
      >
        {questions.map((question, index) => {
          const result = results[question.id] ?? null;

          return (
            <div
              key={question.id}
              className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: result === 'abnormal' })}
            >
              <RadioGroup
                legend={`${index + 1}. ${question.label}`}
                value={result}
                onChange={(value) => onResult(question.id, value)}
                options={CHECK_OPTIONS}
                required
                error={error?.includes(`${index + 1}번`) ? error : undefined}
              />
              {result === 'abnormal' ? (
                <TextField
                  label="미흡 내용"
                  value={notes[question.id] ?? ''}
                  onChange={(value) => onNote(question.id, value)}
                  placeholder="무엇이 어떻게 미흡한지 적어 주세요."
                />
              ) : null}
            </div>
          );
        })}
      </FormSection>

      {/* 미흡이 하나라도 있으면 종이 양식 하단과 같은 안내를 띄운다 */}
      {hasAbnormal ? <p className={styles.checklistNotice}>{CHECKLIST_NOTICE}</p> : null}
    </>
  );
}
