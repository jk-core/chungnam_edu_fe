import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormField, FormRow, FormSection, NumberControl } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { IRRAD_RTU_PORT } from '@/configs/rtu';
import { MSG } from '@/configs/messages';
import { PageSkeleton } from '@/components/common/Skeleton';
import { usePowerPlantOptions } from '@/hooks/usePowerPlantList';
import styles from '@/pages/Admin/Admin.module.scss';
import type { PowerPlantListItem } from '@/service/powerPlant/type';
import { usePyranometerEditor } from '../hooks/usePyranometerEditor';
import { FACTOR_MAX, FACTOR_MIN, irradFormSchema, NAME_MAX } from './form';
import { EMPTY_VALUES, toFormValues } from './values';
import type { IrradFormValues } from './form';

const YES_NO = [
  { value: true, label: '있음' },
  { value: false, label: '없음' },
];

const Form = createForm<IrradFormValues>();

interface PyranometerEditorProps {
  /** 고칠 일사량계의 서버 식별자. 없으면 새로 세우는 자리다 */
  irradId: number | null;
}

/**
 * 일사량계 등록·수정 (SFR-016-01).
 * 폼의 기본값은 한 번만 잡히므로 고칠 값과 고를 발전소가 모두 도착한 뒤에 세운다.
 */
export function PyranometerEditor({ irradId }: PyranometerEditorProps) {
  const editor = usePyranometerEditor(irradId);
  const { plants, isLoading } = usePowerPlantOptions();

  if (editor.isLoading || isLoading) return <PageSkeleton />;

  return <PyranometerForm editor={editor} plants={plants} />;
}

interface PyranometerFormProps {
  editor: ReturnType<typeof usePyranometerEditor>;
  plants: PowerPlantListItem[];
}

function PyranometerForm({ editor, plants }: PyranometerFormProps) {
  const { target, save, remove, backTo } = editor;
  const navigate = useNavigate();
  const isNew = target === undefined;

  const methods = useForm<IrradFormValues>({
    /*
      발전소는 셀렉트라 기본값이 옵션 중 하나여야 한다 — 옵션에 없는 값을 두면 브라우저가 첫
      항목을 선택해 보여 주면서 폼은 그 값을 갖지 않아, 그 발전소를 눌러도 change 가 나지 않는다.
    */
    defaultValues: target
      ? toFormValues(target)
      : { ...EMPTY_VALUES, powerPlantId: plants[0]?.powerPlantId ?? Number.NaN },
    resolver: zodResolver(irradFormSchema),
    mode: 'onChange',
  });

  // 확인창을 거쳐 저장하므로 검증을 통과한 값을 잠시 들고 있는다.
  const [pending, setPending] = useState<IrradFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '일사량계 등록' : '일사량계 수정'}
          description={`RTU ${IRRAD_RTU_PORT}번 포트는 일사량계 몫이라 바꿀 수 없습니다.`}
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="설치 위치">
            {/* 고를 발전소가 없으면 셀렉트가 비어 저장이 막히므로, 왜 막히는지를 적어 준다. */}
            {plants.length === 0 ? (
              <p className={styles.toolbar__note}>
                등록된 발전소가 없습니다. 발전소를 먼저 등록한 뒤 일사량계를 세워 주세요.
              </p>
            ) : null}
            <FormRow cols={2}>
              <Form.Select
                label="발전소"
                name="powerPlantId"
                options={plants.map((plant) => ({ value: plant.powerPlantId, label: plant.powerPlantName }))}
              />
              <Form.Text label="설비 이름" name="irradName" required hint={`${NAME_MAX}자 이내`} />
            </FormRow>
          </FormSection>

          <FormSection legend="계측·통신">
            <FormRow cols={2}>
              <Form.Number
                label="캘리브레이션 인수"
                name="calibrationFactor"
                min={FACTOR_MIN}
                max={FACTOR_MAX}
                step={0.001}
                required
              />
              <Form.Text label="RTU 통신 ID" name="rtuCommunicationId" ime="latin" required />
            </FormRow>
            <FormRow cols={2}>
              {/* 고를 수 없는 값이라 폼 밖에 둔다 — 보여 주기만 한다. */}
              <FormField label="RTU 포트" hint="일사량계 고정">
                <NumberControl value={IRRAD_RTU_PORT} onChange={() => undefined} disabled />
              </FormField>
              <Form.Radio label="모듈 온도계" name="isModTemp" options={YES_NO} />
            </FormRow>
          </FormSection>

          <FormSection legend="비고">
            <Form.Area
              label="메모"
              name="etc"
              optional
              placeholder="설치 위치나 점검 시 주의할 점을 적어 두세요."
            />
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('일사량계') : MSG.updateConfirm(pending?.irradName ?? '일사량계')}
        confirmLabel="저장"
        onConfirm={() => pending && save.mutate(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.irradName ?? '일사량계')}
        description="일사량 값이 없으면 그 발전소의 AI 진단은 기대 발전량을 계산하지 못합니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => remove.mutate()}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
