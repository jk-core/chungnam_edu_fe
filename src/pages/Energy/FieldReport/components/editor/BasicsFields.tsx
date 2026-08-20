import { FormRow, FormSection, RadioGroup, TextField } from '@/components/common/Form';
import {
  INSPECTOR_ROLE_OPTIONS,
  INSTALL_FORM_OPTIONS,
  OPERATION_OPTIONS,
  PROGRAM_OPTIONS,
} from '@/mocks/fieldReport';
import type { ReportBasics } from '@/interface/fieldReport';

interface BasicsFieldsProps {
  basics: ReportBasics;
  onChange: (patch: Partial<ReportBasics>) => void;
  /** 지금 걸린 오류 문구. 이 칸에 해당할 때만 붙는다 */
  error?: string;
}

/**
 * 체크리스트 머리 표.
 * 종이 양식이 문항보다 먼저 두는 표라, 화면에서도 같은 자리에 둔다 — 뒤에 남는 기록은
 * 문항 답만으로 읽히지 않고 「어떤 설비를 누가 점검했는가」 와 함께 읽힌다.
 */
export function BasicsFields({ basics, onChange, error }: BasicsFieldsProps) {
  return (
    <FormSection legend="설비 정보" hint="점검 대상 설비의 기본 사항입니다.">
      <FormRow cols={2}>
        <TextField
          label="사용자(기관)"
          value={basics.ownerName}
          onChange={(value) => onChange({ ownerName: value })}
          required
          error={error?.includes('사용자') ? error : undefined}
        />
        <TextField
          label="용량"
          value={String(basics.capacityKw)}
          onChange={(value) => onChange({ capacityKw: Number(value.replace(/[^0-9.]/g, '')) || 0 })}
          ime="numeric"
          width="sm"
          hint="kW"
        />
      </FormRow>

      <TextField label="주소" value={basics.address} onChange={(value) => onChange({ address: value })} />

      <FormRow cols={2}>
        <RadioGroup
          legend="가동여부"
          value={basics.operation}
          onChange={(value) => onChange({ operation: value })}
          options={OPERATION_OPTIONS.map((item) => ({ value: item, label: item }))}
        />
        <RadioGroup
          legend="설치형태"
          value={basics.installForm}
          onChange={(value) => onChange({ installForm: value })}
          options={INSTALL_FORM_OPTIONS.map((item) => ({ value: item, label: item }))}
        />
      </FormRow>

      {/* 「기타」 를 고른 사람만 적는다 — 늘 띄워 두면 채우지 않아도 되는 칸이 하나 늘어난다 */}
      {basics.installForm === '기타' ? (
        <TextField
          label="설치형태 (기타)"
          value={basics.installFormEtc}
          onChange={(value) => onChange({ installFormEtc: value })}
          placeholder="어떤 형태인지 적어 주세요."
        />
      ) : null}

      <RadioGroup
        legend="보급사업 종류"
        value={basics.program}
        onChange={(value) => onChange({ program: value })}
        options={PROGRAM_OPTIONS.map((item) => ({ value: item, label: item }))}
      />

      {basics.program === '기타' ? (
        <TextField
          label="보급사업 종류 (기타)"
          value={basics.programEtc}
          onChange={(value) => onChange({ programEtc: value })}
          placeholder="어떤 사업인지 적어 주세요."
        />
      ) : null}

      <FormRow cols={2}>
        <RadioGroup
          legend="점검자 구분"
          value={basics.inspectorRole}
          onChange={(value) => onChange({ inspectorRole: value })}
          options={INSPECTOR_ROLE_OPTIONS.map((item) => ({ value: item, label: item }))}
        />
        <TextField
          label="연락처"
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
