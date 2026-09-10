import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormSection } from '@/components/common/Form';
import { formatCapacity, formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { groupFormSchema } from '@/service/user/type';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { RecordPicker } from '@/components/common/RecordPicker';
import { ROLE_LABEL } from '@/mocks/accounts';
import { toast } from '@/stores/toastStore';
import { useManagedUsers, usePlantAssets } from '@/hooks/usePlantAssets';
import { usePlantCapacity } from '@/pages/Admin/Plants/Plant/hooks/usePlantData';
import useAssetStore from '@/stores/assetStore';
import type { GroupFormValues } from '@/service/user/type';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../../Account/hooks/useUserChangeLog';

const Form = createForm<GroupFormValues>();

interface GroupEditorProps {
  /** 고칠 그룹관리자의 서버 번호. 없으면 새로 세우는 자리다 */
  userId: number | null;
}

/**
 * 그룹관리자 편집 (SFR-018, SFR-023).
 *
 * 계정 자체는 사용자 탭이 다룬다 — 여기서 정하는 것은 **그 사람이 볼 수 있는 발전소**뿐이다.
 * 새로 세울 때는 이미 있는 계정을 골라 그룹관리자로 올린다.
 */
export function GroupEditor({ userId }: GroupEditorProps) {
  const saveUser = useAssetStore((state) => state.saveUser);
  const users = useManagedUsers();
  const plants = usePlantAssets();
  const capacityOf = usePlantCapacity();
  const entryOf = useUserChangeLog();
  const navigate = useNavigate();

  const target = users.find((row) => row.userId === userId) ?? null;
  const isNew = target === null;
  const backTo = listPath('users', 'group');

  /*
    지운 발전소는 걸러 낸다 — 번호를 못 찾은 자리에 NaN 을 두면 칩으로 그려지지도, 빼지지도
    않는 값이 배열에 남아 저장이 영구히 막힌다.
  */
  const toPowerPlantIds = (plantIds: string[]) => plantIds
    .map((plantId) => plants.find((item) => item.plantId === plantId)?.powerPlantId)
    .filter((powerPlantId) => powerPlantId !== undefined);

  const methods = useForm<GroupFormValues>({
    defaultValues: target
      ? { userId: target.userId, userLabel: labelOf(target), powerPlantIds: toPowerPlantIds(target.plantIds) }
      : { userId: Number.NaN, userLabel: '', powerPlantIds: [] },
    resolver: zodResolver(groupFormSchema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<GroupFormValues | null>(null);

  const pickedId = useWatch({ control: methods.control, name: 'userId' });
  const powerPlantIds = useWatch({ control: methods.control, name: 'powerPlantIds' });

  const picked = powerPlantIds
    .map((powerPlantId) => plants.find((item) => item.powerPlantId === powerPlantId))
    .filter((item) => item !== undefined);
  const total = formatCapacity(picked.reduce((sum, plant) => sum + capacityOf(plant.plantId), 0));
  // 칩 목록에는 오류를 붙일 자리가 없어 빈 상태 문구에 이어 붙인다.
  const plantsError = methods.getFieldState('powerPlantIds', methods.formState).error?.message;

  const setPowerPlantIds = (next: number[]) =>
    methods.setValue('powerPlantIds', next, { shouldValidate: true, shouldDirty: true });

  const commit = (values: GroupFormValues) => {
    const user = users.find((row) => row.userId === values.userId);

    if (!user) return;

    // 스토어는 목업 발전소 키로 묶여 있다 — 계약이 쓰는 번호를 그 키로 옮겨 준다.
    const plantIds = values.powerPlantIds
      .map((powerPlantId) => plants.find((item) => item.powerPlantId === powerPlantId)?.plantId)
      .filter((plantId) => plantId !== undefined);
    const saved: ManagedUser = { ...user, role: 'group', plantIds };
    const before = target ? `발전소 ${target.plantIds.length}곳` : ROLE_LABEL[user.role];

    saveUser(saved, [entryOf(
      saved,
      isNew ? '그룹관리자 지정' : '맡은 발전소',
      before,
      `발전소 ${plantIds.length}곳`,
    )]);
    toast.success(isNew ? MSG.createSuccess(`${saved.name} 그룹관리자`) : MSG.updateSuccess(saved.name));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '그룹관리자 등록' : `${target.name} 담당 발전소`}
          description="여기서 고른 발전소만 그 사람의 화면에 보입니다."
          backTo={backTo}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="그룹관리자" hint="이미 등록된 계정 중에서 고릅니다. 고르면 권한이 그룹관리자로 올라갑니다.">
            <Form.Picker
              label="사용자"
              name="userId"
              displayName="userLabel"
              placeholder="사용자를 고르세요"
              disabled={!isNew}
              required
              hint={isNew ? undefined : '계정을 바꾸려면 사용자 탭에서 다룹니다.'}
              modal={({ onSelect, onClose }) => (
                <Modal
                  isOpen
                  onClose={onClose}
                  size="lg"
                  title="사용자 검색"
                  description="고른 계정의 권한이 그룹관리자로 올라갑니다."
                >
                  <RecordPicker
                    rows={users}
                    getRowKey={(row) => String(row.userId)}
                    selectedKey={String(pickedId)}
                    caption="사용자 목록. ID, 사용자, 로그인 ID, 권한 순입니다."
                    placeholder="이름·로그인 ID·이메일로 검색"
                    match={(row, word) => row.name.includes(word)
                      || row.loginId.includes(word)
                      || row.email.includes(word)
                      || String(row.userId).includes(word)}
                    columns={[
                      { key: 'userId', header: 'ID', width: '80px', render: (row) => row.userId },
                      { key: 'name', header: '사용자', width: '120px', render: (row) => row.name },
                      { key: 'loginId', header: '로그인 ID', render: (row) => row.loginId },
                      { key: 'role', header: '권한', width: '130px', render: (row) => ROLE_LABEL[row.role] },
                    ]}
                    // 사람을 바꾸면 그 사람이 이미 맡고 있던 발전소를 그대로 불러온다.
                    onPick={(row) => onSelect({
                      userId: row.userId,
                      userLabel: labelOf(row),
                      powerPlantIds: toPowerPlantIds(row.plantIds),
                    })}
                  />
                </Modal>
              )}
            />
          </FormSection>

          <FormSection
            legend="담당 발전소"
            hint={`${formatNumber(picked.length)}곳 · 합계 ${total.value}${total.unit}`}
          >
            {picked.length === 0 ? (
              <p className={styles.toolbar__note}>
                아직 고른 발전소가 없습니다.{plantsError ? ` ${plantsError}` : ''}
              </p>
            ) : (
              <ul className={styles.chipList}>
                {picked.map((plant) => (
                  <li key={plant.plantId} className={styles.chip}>
                    <span className={styles.chip__label}>
                      {plant.plantName}
                      <span className={styles.chip__sub}>{plant.powerPlantId}</span>
                    </span>
                    <button
                      type="button"
                      className={styles.chip__remove}
                      onClick={() => setPowerPlantIds(powerPlantIds.filter((id) => id !== plant.powerPlantId))}
                      aria-label={`${plant.plantName} 빼기`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.rowFoot}>
              <p className={styles.toolbar__note}>같은 발전소를 두 번 고를 수는 없습니다.</p>
              <PlantAdder
                rows={plants.filter((plant) => !powerPlantIds.includes(plant.powerPlantId))}
                onAdd={(powerPlantId) => setPowerPlantIds([...powerPlantIds, powerPlantId])}
              />
            </div>
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('그룹관리자') : MSG.updateConfirm(target?.name ?? '그룹관리자')}
        description={`발전소 ${formatNumber(pending?.powerPlantIds.length ?? 0)}곳을 맡깁니다.`}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />
    </>
  );
}

function labelOf(user: ManagedUser): string {
  return `${user.name} · ${user.loginId} (${ROLE_LABEL[user.role]})`;
}

/** 칩 목록에 한 곳씩 더하는 자리 — 고른 값이 한 칸에 담기지 않아 Form.Picker 를 쓰지 않는다. */
function PlantAdder({
  rows,
  onAdd,
}: {
  rows: ReturnType<typeof usePlantAssets>;
  onAdd: (powerPlantId: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => setIsOpen(true)}>
        발전소 추가
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="lg"
        title="발전소 검색"
        description="이미 고른 발전소는 목록에서 빠집니다."
      >
        <RecordPicker
          rows={rows}
          getRowKey={(row) => row.plantId}
          caption="발전소 목록. ID, 발전소 이름, 주소 순입니다."
          placeholder="발전소 이름·ID·주소로 검색"
          emptyTitle="더 고를 발전소가 없습니다"
          match={(row, word) => row.plantName.includes(word)
            || row.address.includes(word)
            || String(row.powerPlantId).includes(word)}
          columns={[
            { key: 'id', header: 'ID', width: '90px', render: (row) => row.powerPlantId },
            { key: 'name', header: '발전소 이름', width: '200px', render: (row) => row.plantName },
            { key: 'address', header: '주소', render: (row) => `${row.address} ${row.addressDetail}`.trim() },
          ]}
          onPick={(row) => {
            onAdd(row.powerPlantId);
            setIsOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
