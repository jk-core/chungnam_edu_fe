import { FormRow, FormSection, RadioGroup, TextField } from '@/components/common/Form';
import { INSPECTOR_ROLE_OPTIONS } from '@/mocks/fieldReport';
import type { ReportBasics } from '@/interface/fieldReport';

interface BasicsFieldsProps {
  basics: ReportBasics;
  onChange: (patch: Partial<ReportBasics>) => void;
}

/**
 * 체크리스트 머리 표.
 * 발전소 정보는 등록 대장이 갖고 있어 여기서 다시 받지 않는다 — 누가 점검했는지만 남긴다.
 */
export function BasicsFields({ basics, onChange }: BasicsFieldsProps) {
  return (
    <FormSection legend="점검자 정보" hint="점검을 맡은 사람과 연락 닿을 번호입니다.">
      <FormRow cols={2}>
        <RadioGroup
          legend="점검자 구분"
          value={basics.inspectorRole}
          onChange={(value) => onChange({ inspectorRole: value })}
          options={INSPECTOR_ROLE_OPTIONS.map((item) => ({ value: item, label: item }))}
        />
        <TextField
          label="점검자 연락처"
          value={basics.contact}
          onChange={(value) => onChange({ contact: value })}
          ime="numeric"
          width="md"
          placeholder="000-0000-0000"
        />
      </FormRow>
    </FormSection>
  );
}
