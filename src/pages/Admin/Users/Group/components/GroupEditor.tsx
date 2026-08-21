import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { FormSection } from '@/components/common/Form';
import { formatCapacity, formatNumber } from '@/utils/format';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { PickerField, RecordPicker } from '@/components/common/RecordPicker';
import { PlusIcon } from '@/components/common/Icon';
import { ROLE_LABEL } from '@/mocks/accounts';
import { toast } from '@/stores/toastStore';
import { useManagedUsers, usePlantAssets } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import { usePlantCapacity } from '@/pages/Admin/Plants/Plant/hooks/usePlantData';
import useAssetStore from '@/stores/assetStore';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../../Account/hooks/useUserChangeLog';

/** 폼 위에 띄운 창. 한 번에 하나만 뜬다 */
type Picker = 'user' | 'plant';

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

  const [pickedId, setPickedId] = useState(() => (target ? String(target.userId) : ''));
  const [plantIds, setPlantIds] = useState<string[]>(() => target?.plantIds ?? []);
  const [error, setError] = useState<string | undefined>(undefined);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const user = users.find((row) => String(row.userId) === pickedId) ?? null;
  const picked = plantIds
    .map((plantId) => plants.find((item) => item.plantId === plantId))
    .filter((item) => item !== undefined);
  const totalKw = picked.reduce((sum, plant) => sum + capacityOf(plant.plantId), 0);
  const total = formatCapacity(totalKw);

  const submit = () => {
    if (!user) {
      setError(MSG.selectRequired('그룹관리자'));

      return;
    }

    if (plantIds.length === 0) {
      setError('맡을 발전소를 한 곳 이상 골라 주세요.');

      return;
    }

    setError(undefined);
    setIsConfirming(true);
  };

  const commit = () => {
    if (!user) return;

    const saved: ManagedUser = { ...user, role: 'group', plantIds };
    const before = target ? `발전소 ${target.plantIds.length}곳` : ROLE_LABEL[user.role];

    saveUser(saved, [entryOf(
      saved,
      isNew ? '그룹관리자 지정' : '맡은 발전소',
      before,
      `발전소 ${plantIds.length}곳`,
    )]);
    toast.success(isNew ? MSG.createSuccess(`${saved.name} 그룹관리자`) : MSG.updateSuccess(saved.name));
    setIsConfirming(false);
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={isNew ? '그룹관리자 등록' : `${target.name} 담당 발전소`}
        description="여기서 고른 발전소만 그 사람의 화면에 보입니다."
        backTo={backTo}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <FormSection legend="그룹관리자" hint="이미 등록된 계정 중에서 고릅니다. 고르면 권한이 그룹관리자로 올라갑니다.">
          <PickerField
            label="사용자"
            value={user ? `${user.name} · ${user.loginId} (${ROLE_LABEL[user.role]})` : ''}
            placeholder="사용자를 고르세요"
            onOpen={() => setPicker('user')}
            disabled={!isNew}
            required
            hint={isNew ? undefined : '계정을 바꾸려면 사용자 탭에서 다룹니다.'}
            error={error && !user ? error : undefined}
          />
        </FormSection>

        <FormSection
          legend="담당 발전소"
          hint={`${formatNumber(picked.length)}곳 · 합계 ${total.value}${total.unit}`}
        >
          {picked.length === 0 ? (
            <p className={styles.toolbar__note}>
              아직 고른 발전소가 없습니다.{error && plantIds.length === 0 ? ` ${error}` : ''}
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
                    onClick={() => setPlantIds(plantIds.filter((id) => id !== plant.plantId))}
                    aria-label={`${plant.plantName} 빼기`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.stringFoot}>
            <p className={styles.toolbar__note}>같은 발전소를 두 번 고를 수는 없습니다.</p>
            <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => setPicker('plant')}>
              발전소 추가
            </Button>
          </div>
        </FormSection>
      </FormPage>

      <Modal
        isOpen={picker === 'user'}
        onClose={() => setPicker(null)}
        size="lg"
        title="사용자 검색"
        description="고른 계정의 권한이 그룹관리자로 올라갑니다."
      >
        <RecordPicker
          rows={users}
          getRowKey={(row) => String(row.userId)}
          selectedKey={pickedId}
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
          onPick={(row) => {
            // 사람을 바꾸면 그 사람이 이미 맡고 있던 발전소를 그대로 불러온다.
            setPickedId(String(row.userId));
            setPlantIds(row.plantIds);
            setPicker(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={picker === 'plant'}
        onClose={() => setPicker(null)}
        size="lg"
        title="발전소 검색"
        description="이미 고른 발전소는 목록에서 빠집니다."
      >
        <RecordPicker
          rows={plants.filter((plant) => !plantIds.includes(plant.plantId))}
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
            setPlantIds([...plantIds, row.plantId]);
            setPicker(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('그룹관리자') : MSG.updateConfirm(target?.name ?? '그룹관리자')}
        description={`발전소 ${formatNumber(plantIds.length)}곳을 맡깁니다.`}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />

    </>
  );
}
