import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { FormRow, FormSection, TextArea, TextField } from '@/components/common/Form';
import { formatCapacity, formatPhone } from '@/utils/format';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { PickerField, RecordPicker } from '@/components/common/RecordPicker';
import { PLANT_TYPES, SCHOOLS } from '@/mocks/schools';
import { REGION_CODES, regionNameOfCode } from '@/mocks/manageCodes';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import { useManagedUsers, usePlantAssets } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import { usePyranometerRows } from '@/pages/Admin/Plants/Pyranometer/hooks/usePyranometerRows';
import useAssetStore from '@/stores/assetStore';
import type { AssetChange, PlantAsset } from '@/interface/asset';
import type { PlantType } from '@/interface/energy';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { NONE, toId, usePlantCapacity } from '../hooks/usePlantData';

/** 서버가 매기는 번호 자리. 시드가 10000 번대를 쓰므로 그 뒤에서 이어 붙인다. */
const PLANT_NO_BASE = 10000;

/** 폼 위에 띄운 창. 한 번에 하나만 뜬다 */
type Picker = 'user' | 'irrad';

interface Draft {
  plantName: string;
  plantType: PlantType;
  /** 시·군 코드. 주소 검색이 함께 돌려주는 값이라 폼에 세우지 않는다 */
  regionCode: string;
  address: string;
  addressDetail: string;
  installedAt: string;
  rtuEntName: string;
  builderName: string;
  builderPhone: string;
  /** 사용자 번호. 빈 문자열이면 지정하지 않은 것 */
  userId: string;
  /** 연결한 일사량계 번호. 빈 문자열이면 연결하지 않은 것 */
  irradId: string;
  etc: string;
}

function draftOf(asset: PlantAsset | null): Draft {
  return asset
    ? {
      plantName: asset.plantName,
      plantType: asset.plantType,
      regionCode: asset.regionCode,
      address: asset.address,
      addressDetail: asset.addressDetail,
      installedAt: asset.installedAt,
      rtuEntName: asset.rtuEntName,
      builderName: asset.builder.name,
      builderPhone: asset.builder.phone,
      userId: asset.userId === null ? NONE : String(asset.userId),
      irradId: asset.irradId === null ? NONE : String(asset.irradId),
      etc: asset.etc,
    }
    : {
      plantName: '',
      plantType: PLANT_TYPES[0],
      regionCode: REGION_CODES[0].regionCode,
      address: '',
      addressDetail: '',
      installedAt: NOW.format('YYYY-MM'),
      rtuEntName: '',
      builderName: '',
      builderPhone: '',
      userId: NONE,
      irradId: NONE,
      etc: '',
    };
}

/** 발전소 등록·수정 (SFR-016-01~04/06) */
export function PlantEditor({ powerPlantId }: { powerPlantId: number | null }) {
  const createPlant = useAssetStore((state) => state.createPlant);
  const saveAsset = useAssetStore((state) => state.saveAsset);
  const removePlant = useAssetStore((state) => state.removePlant);
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const nextPlantId = useAssetStore((state) => state.nextPlantId);
  const assets = usePlantAssets();
  const users = useManagedUsers();
  const pyranometers = usePyranometerRows();
  const capacityOf = usePlantCapacity();
  const entryOf = usePlantChangeLog();
  const navigate = useNavigate();

  const asset = assets.find((item) => item.powerPlantId === powerPlantId) ?? null;
  const isNew = asset === null;
  const backTo = listPath('plants');

  const [draft, setDraft] = useState<Draft>(() => draftOf(asset));
  const [picker, setPicker] = useState<Picker | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  const user = users.find((item) => String(item.userId) === draft.userId);
  const nameOfUser = (userId: number | null) =>
    (userId === null ? null : users.find((item) => item.userId === userId)?.name) ?? '—';

  // 일사량계는 발전소마다 서 있다 — 이 발전소에 달린 것만 고르게 한다.
  const ownIrrads = pyranometers.filter((item) => item.plantId === asset?.plantId);
  const irrad = ownIrrads.find((item) => String(item.irradId) === draft.irradId);
  const irradNameOf = (irradId: number | null) =>
    (irradId === null ? null : pyranometers.find((item) => item.irradId === irradId)?.rtuCommId) ?? '—';

  const canSave = Boolean(draft.plantName.trim() && draft.address.trim() && draft.rtuEntName.trim() && draft.userId);
  const capacity = formatCapacity(asset ? capacityOf(asset.plantId) : 0);

  const create = () => {
    const created = nextPlantId();

    createPlant({
      plantId: created,
      powerPlantId: PLANT_NO_BASE + SCHOOLS.length + plantCreated.length + 1,
      plantName: draft.plantName.trim(),
      regionCode: draft.regionCode,
      address: draft.address.trim(),
      addressDetail: draft.addressDetail.trim(),
      installedAt: draft.installedAt.trim(),
      rtuEntName: draft.rtuEntName.trim(),
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      userId: toId(draft.userId),
      // 일사량계는 일사량계 탭에서 따로 세운 뒤 이 발전소를 골라 잇는다.
      irradId: null,
      plantType: draft.plantType,
      etc: draft.etc.trim(),
    }, entryOf(
      { id: created, name: draft.plantName.trim() },
      '신규 등록',
      '—',
      `${draft.plantType} · ${regionNameOfCode(draft.regionCode)}`,
    ));

    toast.success(MSG.createSuccess(draft.plantName.trim()));
    navigate(backTo);
  };

  const update = () => {
    if (!asset) return;

    const next: Partial<PlantAsset> = {
      plantName: draft.plantName.trim(),
      plantType: draft.plantType,
      regionCode: draft.regionCode,
      address: draft.address.trim(),
      addressDetail: draft.addressDetail.trim(),
      installedAt: draft.installedAt.trim(),
      rtuEntName: draft.rtuEntName.trim(),
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      userId: toId(draft.userId),
      irradId: toId(draft.irradId),
      etc: draft.etc.trim(),
    };

    // 무엇이 바뀌었는지 필드 단위로 이력에 남긴다 (SFR-016-06).
    const plant = { id: asset.plantId, name: asset.plantName };
    const entries: AssetChange[] = [
      ['발전소 이름', asset.plantName, next.plantName ?? ''],
      ['구분', asset.plantType, next.plantType ?? ''],
      ['주소', asset.address, next.address ?? ''],
      ['상세 주소', asset.addressDetail || '—', next.addressDetail || '—'],
      ['설치 시기', asset.installedAt, next.installedAt ?? ''],
      ['RTU 업체', asset.rtuEntName, next.rtuEntName ?? ''],
      ['시공 업체', asset.builder.name, next.builder?.name ?? ''],
      ['시공 업체 연락처', asset.builder.phone, next.builder?.phone ?? ''],
      ['사용자', nameOfUser(asset.userId), nameOfUser(toId(draft.userId))],
      ['연결 일사량계', irradNameOf(asset.irradId), irradNameOf(toId(draft.irradId))],
      ['비고', asset.etc || '—', next.etc || '—'],
    ]
      .filter(([, before, after]) => before !== after)
      .map(([field, before, after], index) => entryOf(plant, field, before, after, index));

    if (entries.length === 0) {
      toast.info('바뀐 내용이 없습니다.');
      navigate(backTo);

      return;
    }

    saveAsset(asset.plantId, next, entries);
    toast.success(MSG.updateSuccess(asset.plantName));
    navigate(backTo);
  };

  const remove = () => {
    if (!asset) return;

    removePlant(asset.plantId, entryOf(
      { id: asset.plantId, name: asset.plantName },
      '발전소 삭제',
      `${capacity.value}${capacity.unit} · ${regionNameOfCode(asset.regionCode)}`,
      '—',
      // 같은 발전소의 등록 이력과 id 가 겹치지 않게 갈래를 붙인다 — 목록 key 로 쓰인다.
      'del',
    ));
    toast.success(MSG.deleteSuccess(asset.plantName));
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={isNew ? '발전소 등록' : `${asset.plantName} 등록 정보`}
        description={isNew
          ? '설비용량은 설비 탭에서 설비를 등록하면 그 합으로 채워집니다.'
          : `${asset.address} · 설치 ${asset.installedAt}`}
        backTo={backTo}
        danger={isNew ? null : (
          <Button variant="solar" onClick={() => setIsDeleting(true)}>발전소 삭제</Button>
        )}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={() => setIsConfirming(true)} disabled={!canSave}>저장</Button>
          </>
        )}
      >
        <FormSection
          legend="발전소 정보"
          hint={isNew ? undefined : `발전소 ID ${asset.powerPlantId}`}
        >
          <FormRow cols={2}>
            <TextField
              label="발전소 이름"
              value={draft.plantName}
              onChange={(value) => change({ plantName: value })}
              placeholder="예: 온양초등학교"
              maxLength={120}
              required
            />
            <Select
              label="구분"
              value={draft.plantType}
              options={PLANT_TYPES.map((item) => ({ value: item, label: item }))}
              onChange={(value) => change({ plantType: value })}
            />
          </FormRow>
          <FormRow cols={2}>
            {/* 시·군 코드는 주소 검색이 함께 돌려준다 — 손으로 고르는 칸을 두지 않는다. */}
            <TextField
              label="주소"
              value={draft.address}
              onChange={(value) => change({ address: value })}
              placeholder="도로명 주소"
              required
            />
            <TextField
              label="상세주소"
              value={draft.addressDetail}
              onChange={(value) => change({ addressDetail: value })}
              placeholder="예: 본관 옥상"
              optional
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="설치 시기"
              value={draft.installedAt}
              onChange={(value) => change({ installedAt: value })}
              hint="YYYY-MM"
              ime="numeric"
            />
          </FormRow>
        </FormSection>

        <FormSection legend="업체" hint="연락처는 고장 대응 시 바로 쓰입니다.">
          <FormRow cols={2}>
            <TextField
              label="RTU업체"
              value={draft.rtuEntName}
              onChange={(value) => change({ rtuEntName: value })}
              maxLength={120}
              required
            />
            <TextField
              label="시공업체"
              value={draft.builderName}
              onChange={(value) => change({ builderName: value })}
              maxLength={120}
              optional
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="시공업체 연락처"
              value={draft.builderPhone}
              onChange={(value) => change({ builderPhone: formatPhone(value) })}
              ime="numeric"
              optional
            />
          </FormRow>
        </FormSection>

        <FormSection legend="연계 정보" hint="사용자는 사용자 관리에 등록된 계정 중에서 고릅니다.">
          <FormRow cols={2}>
            <PickerField
              label="사용자"
              value={user ? `${user.name} · ${user.loginId}` : ''}
              placeholder="사용자를 고르세요"
              onOpen={() => setPicker('user')}
              required
            />
            {isNew ? null : (
              <PickerField
                label="일사량계"
                value={irrad ? `${irrad.rtuCommId} · ${irrad.name}` : ''}
                placeholder={ownIrrads.length > 0 ? '일사량계를 고르세요' : '이 발전소에 등록된 일사량계가 없습니다'}
                onOpen={() => setPicker('irrad')}
                disabled={ownIrrads.length === 0}
                optional
              />
            )}
          </FormRow>
          <TextArea
            label="비고"
            value={draft.etc}
            onChange={(value) => change({ etc: value })}
            optional
            placeholder="점검 주기, 접근 경로처럼 담당자가 알아야 할 내용"
          />
        </FormSection>

        {isNew ? null : (
          <FormSection legend="설비용량" hint="설비 탭에서 등록한 설비들의 용량을 더한 값입니다.">
            <div className={styles.capacity}>
              <span className={styles.capacity__label}>등록 설비용량</span>
              <span className={styles.capacity__value}>{capacity.value} {capacity.unit}</span>
              <span className={styles.capacity__note}>여기서 고치는 값이 아닙니다</span>
            </div>
          </FormSection>
        )}
      </FormPage>

      <Modal
        isOpen={picker === 'user'}
        onClose={() => setPicker(null)}
        size="lg"
        title="사용자 검색"
        description="사용자 관리에 등록된 계정입니다."
      >
        <RecordPicker
          rows={users}
          getRowKey={(row) => String(row.userId)}
          selectedKey={draft.userId}
          caption="사용자 목록. ID, 사용자, 로그인 ID, 이메일 순입니다."
          placeholder="이름·로그인 ID·이메일로 검색"
          match={(row, word) => row.name.includes(word)
            || row.loginId.includes(word)
            || row.email.includes(word)
            || String(row.userId).includes(word)}
          columns={[
            { key: 'userId', header: 'ID', width: '80px', render: (row) => row.userId },
            { key: 'name', header: '사용자', width: '120px', render: (row) => row.name },
            { key: 'loginId', header: '로그인 ID', render: (row) => row.loginId },
            { key: 'email', header: '이메일', width: '200px', hideOnTablet: true, render: (row) => row.email },
          ]}
          onPick={(row) => {
            change({ userId: String(row.userId) });
            setPicker(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={picker === 'irrad'}
        onClose={() => setPicker(null)}
        size="lg"
        title="일사량계 검색"
        description="이 발전소에 등록된 일사량계입니다."
      >
        <RecordPicker
          rows={ownIrrads}
          getRowKey={(row) => String(row.irradId)}
          selectedKey={draft.irradId}
          caption="일사량계 목록. ID, 이름, RTU 통신 ID 순입니다."
          placeholder="이름·RTU 통신 ID로 검색"
          emptyTitle="이 발전소에 등록된 일사량계가 없습니다"
          match={(row, word) => row.name.includes(word)
            || row.rtuCommId.includes(word)
            || String(row.irradId).includes(word)}
          columns={[
            { key: 'irradId', header: 'ID', width: '80px', render: (row) => row.irradId },
            { key: 'name', header: '일사량계 이름', render: (row) => row.name },
            { key: 'comm', header: 'RTU 통신 ID', width: '160px', render: (row) => row.rtuCommId },
          ]}
          onPick={(row) => {
            change({ irradId: String(row.irradId) });
            setPicker(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('발전소') : MSG.updateConfirm(asset?.plantName ?? '발전소')}
        description={isNew ? undefined : '바뀐 항목만 수정 이력에 남습니다.'}
        confirmLabel="저장"
        onConfirm={isNew ? create : update}
        onClose={() => setIsConfirming(false)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(asset?.plantName ?? '발전소')}
        description="딸린 설비·스트링·일사량계도 함께 감춰집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
