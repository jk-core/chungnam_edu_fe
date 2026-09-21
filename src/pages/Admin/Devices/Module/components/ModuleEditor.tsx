import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { CELL_TYPE } from '@/configs/codes';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { MSG } from '@/configs/messages';
import { PageSkeleton } from '@/components/common/Skeleton';
import { useModuleEditor } from '../hooks/useModuleEditor';
import { moduleFormSchema, NUMERIC } from './form';
import { EMPTY_VALUES, toFormValues } from './values';
import type { ModuleFormValues, NumericKey } from './form';

const Form = createForm<ModuleFormValues>();

/** 표에 적어 둔 범위·단위를 그대로 입력 칸에 옮긴다. */
function NumberSpec({ name }: { name: NumericKey }) {
  const spec = NUMERIC.find((item) => item.key === name);

  if (!spec) return null;

  return (
    <Form.Number
      label={spec.label}
      name={name}
      min={spec.min}
      max={spec.max}
      step={0.01}
      unit={spec.unit}
      placeholder={`${spec.min} ~ ${spec.max}`}
      required
    />
  );
}

interface ModuleEditorProps {
  /** 고칠 제품의 서버 식별자. 없으면 새로 세우는 자리다 */
  moduleId: number | null;
}

/** 모듈 제품 등록·수정 (SFR-016-01, SFR-017-05) */
export function ModuleEditor({ moduleId }: ModuleEditorProps) {
  const editor = useModuleEditor(moduleId);

  if (editor.isLoading) return <PageSkeleton />;

  return <ModuleForm editor={editor} />;
}

function ModuleForm({ editor }: { editor: ReturnType<typeof useModuleEditor> }) {
  const { target, save, remove, backTo } = editor;
  const navigate = useNavigate();
  const isNew = target === undefined;

  const methods = useForm<ModuleFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(moduleFormSchema),
    mode: 'onChange',
  });

  // 확인창을 거쳐 저장하므로 검증을 통과한 값을 잠시 들고 있는다.
  const [pending, setPending] = useState<ModuleFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '모듈 제품 등록' : '모듈 제품 수정'}
          description="제조사 데이터시트의 STC 기준 값을 넣습니다."
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="제품 정보">
            <FormRow cols={2}>
              <Form.Text label="모듈명" name="moduleName" required />
              <Form.Text label="업체명" name="moduleEnterpriseName" required />
            </FormRow>
            <FormRow cols={2}>
              <NumberSpec name="pwrMp" />
              <Form.Radio
                label="셀 종류"
                name="cellTypeCode"
                options={[
                  { value: CELL_TYPE.CODE.단면, label: CELL_TYPE.NAME[CELL_TYPE.CODE.단면] },
                  { value: CELL_TYPE.CODE.양면, label: CELL_TYPE.NAME[CELL_TYPE.CODE.양면] },
                ]}
                required
              />
            </FormRow>
          </FormSection>

          <FormSection legend="전기 특성" hint="최대 출력 동작점과 개방·단락 값입니다.">
            <FormRow cols={2}>
              <NumberSpec name="vltMp" />
              <NumberSpec name="curMp" />
            </FormRow>
            <FormRow cols={2}>
              <NumberSpec name="vltOc" />
              <NumberSpec name="curSc" />
            </FormRow>
          </FormSection>

          <FormSection legend="온도계수" hint="전압은 음수, 전류는 양수입니다.">
            <FormRow cols={2}>
              <NumberSpec name="tempVltCof" />
              <NumberSpec name="tempCurCof" />
            </FormRow>
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('모듈 제품') : MSG.updateConfirm(pending?.moduleName ?? '모듈 제품')}
        confirmLabel="저장"
        onConfirm={() => pending && save.mutate(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.moduleName ?? '모듈 제품')}
        description="이 제품을 쓰는 설비가 있으면 그 설비의 모듈을 다시 골라야 합니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => remove.mutate()}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
