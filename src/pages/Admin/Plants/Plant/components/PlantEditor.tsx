import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { FormRow, FormSection, TextArea, TextField } from '@/components/common/Form';
import { formatCapacity, formatPhone } from '@/utils/format';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MaskedText } from '@/components/common/MaskedText';
import { maskName, maskPhone } from '@/utils/mask';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { RecordPicker } from '@/components/common/RecordPicker';
import { PickerField } from '@/components/common/RecordPicker';
import { REGION_CODES, regionNameOfCode } from '@/mocks/manageCodes';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { SEED_PYRANOMETERS } from '@/mocks/pyranometers';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import { useManagedUsers, usePlantAssets } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import useAssetStore from '@/stores/assetStore';
import type { AssetChange, PlantAsset } from '@/interface/asset';
import type { SchoolLevel } from '@/interface/energy';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { NONE, REGION_OPTIONS, toId, usePlantCapacity } from '../hooks/usePlantData';

/** 서버가 매기는 번호 자리. 시드가 10000 번대를 쓰므로 그 뒤에서 이어 붙인다. */
const PLANT_NO_BASE = 10000;

interface Draft {
  plantName: string;
  level: SchoolLevel;
  regionCode: string;
  address: string;
  addressDetail: string;
  installedAt: string;
  rtuEntName: string;
  builderName: string;
  builderPhone: string;
  monitoringName: string;
  monitoringPhone: string;
  customerName: string;
  customerPhone: string;
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
      level: asset.level,
      regionCode: asset.regionCode,
      address: asset.address,
      addressDetail: asset.addressDetail,
      installedAt: asset.installedAt,
      rtuEntName: asset.rtuEntName,
      builderName: asset.builder.name,
      builderPhone: asset.builder.phone,
      monitoringName: asset.monitoring.name,
      monitoringPhone: asset.monitoring.phone,
      customerName: asset.customer.name,
      customerPhone: asset.customer.phone,
      userId: asset.userId === null ? NONE : String(asset.userId),
      irradId: asset.irradId === null ? NONE : String(asset.irradId),
      etc: asset.etc,
    }
    : {
      plantName: '',
      level: SCHOOL_LEVELS[0],
      regionCode: REGION_CODES[0].regionCode,
      address: '',
      addressDetail: '',
      installedAt: NOW.format('YYYY-MM'),
      rtuEntName: '',
      builderName: '',
      builderPhone: '',
      monitoringName: '',
      monitoringPhone: '',
      customerName: '',
      customerPhone: '',
      userId: NONE,
      irradId: NONE,
      etc: '',
    };
}

/** 발전소 등록·수정 (SFR-016-01~04/06) */
export function PlantEditor({ powerPlantId }: { powerPlantId: number | null }) {
  const createPlant = useAssetStore((state) => state.createPlant);
  const saveAsset = useAssetStore((state) => state.saveAsset);
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const nextPlantId = useAssetStore((state) => state.nextPlantId);
  const assets = usePlantAssets();
  const users = useManagedUsers();
  const capacityOf = usePlantCapacity();
  const entryOf = usePlantChangeLog();
  const navigate = useNavigate();

  const asset = assets.find((item) => item.powerPlantId === powerPlantId) ?? null;
  const isNew = asset === null;
  const backTo = listPath('plants');

  const [draft, setDraft] = useState<Draft>(() => draftOf(asset));
  const [isPicking, setIsPicking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  const user = users.find((item) => String(item.userId) === draft.userId);
  const nameOfUser = (userId: number | null) =>
    (userId === null ? null : users.find((item) => item.userId === userId)?.name) ?? '—';

  // 일사량계는 발전소마다 서 있다 — 이 발전소에 달린 것만 고르게 한다.
  const irradOptions = useMemo(
    () => [
      { value: NONE, label: '연결 안 함' },
      ...SEED_PYRANOMETERS.filter((item) => item.plantId === asset?.plantId).map((item) => ({
        value: String(item.irradId),
        label: `${item.rtuCommId} · ${item.name}`,
      })),
    ],
    [asset?.plantId],
  );
  const irradNameOf = (irradId: number | null) =>
    (irradId === null ? null : SEED_PYRANOMETERS.find((item) => item.irradId === irradId)?.rtuCommId) ?? '—';

  const canSave = Boolean(draft.plantName.trim() && draft.address.trim() && draft.rtuEntName.trim() && draft.userId);
  const capacity = formatCapacity(asset ? capacityOf(asset.plantId) : 0);

  const create = () => {
    const regionName = regionNameOfCode(draft.regionCode);
    const created = nextPlantId();
    // 시·군 이름을 이미 적었다면 그대로 두고, 도로명만 적었다면 앞에 붙여 준다.
    const address = draft.address.includes(regionName)
      ? draft.address.trim()
      : `충청남도 ${regionName} ${draft.address.trim()}`;

    createPlant({
      plantId: created,
      powerPlantId: PLANT_NO_BASE + SCHOOLS.length + plantCreated.length + 1,
      plantName: draft.plantName.trim(),
      regionCode: draft.regionCode,
      address,
      addressDetail: draft.addressDetail.trim(),
      installedAt: draft.installedAt.trim(),
      rtuEntName: draft.rtuEntName.trim(),
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      monitoring: { name: draft.monitoringName.trim(), phone: draft.monitoringPhone.trim() },
      customer: { name: draft.customerName.trim(), phone: draft.customerPhone.trim() },
      userId: toId(draft.userId),
      // 일사량계는 일사량계 탭에서 따로 세운 뒤 이 발전소를 골라 잇는다.
      irradId: null,
      level: draft.level,
      etc: draft.etc.trim(),
    }, entryOf({ id: created, name: draft.plantName.trim() }, '신규 등록', '—', `${draft.level} · ${regionName}`));

    toast.success(MSG.createSuccess(draft.plantName.trim()));
    navigate(backTo);
  };

  const update = () => {
    if (!asset) return;

    const next: Partial<PlantAsset> = {
      plantName: draft.plantName.trim(),
      level: draft.level,
      regionCode: draft.regionCode,
      address: draft.address.trim(),
      addressDetail: draft.addressDetail.trim(),
      installedAt: draft.installedAt.trim(),
      rtuEntName: draft.rtuEntName.trim(),
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      monitoring: { name: draft.monitoringName.trim(), phone: draft.monitoringPhone.trim() },
      userId: toId(draft.userId),
      irradId: toId(draft.irradId),
      etc: draft.etc.trim(),
    };

    // 무엇이 바뀌었는지 필드 단위로 이력에 남긴다 (SFR-016-06).
    const plant = { id: asset.plantId, name: asset.plantName };
    const entries: AssetChange[] = [
      ['발전소 이름', asset.plantName, next.plantName ?? ''],
      ['구분', asset.level, next.level ?? ''],
      ['시·군', regionNameOfCode(asset.regionCode), regionNameOfCode(draft.regionCode)],
      ['주소', asset.address, next.address ?? ''],
      ['상세 주소', asset.addressDetail || '—', next.addressDetail || '—'],
      ['설치 시기', asset.installedAt, next.installedAt ?? ''],
      ['RTU 업체', asset.rtuEntName, next.rtuEntName ?? ''],
      ['시공 업체', asset.builder.name, next.builder?.name ?? ''],
      ['시공 업체 연락처', asset.builder.phone, next.builder?.phone ?? ''],
      ['유지관리 업체', asset.monitoring.name, next.monitoring?.name ?? ''],
      ['유지관리 업체 연락처', asset.monitoring.phone, next.monitoring?.phone ?? ''],
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

  return (
    <>
      <FormPage
        title={isNew ? '발전소 등록' : `${asset.plantName} 등록 정보`}
        description={isNew
          ? '설비용량은 설비 탭에서 설비를 등록하면 그 합으로 채워집니다.'
          : `${asset.address} · 설치 ${asset.installedAt}`}
        backTo={backTo}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={() => setIsConfirming(true)} disabled={!canSave}>저장</Button>
          </>
        )}
      >
        <FormSection
          legend="발전소 정보"
          hint={isNew ? '시·군은 지도 위 마커 자리를 정하는 데 쓰입니다.' : `발전소 ID ${asset.powerPlantId}`}
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
              value={draft.level}
              options={SCHOOL_LEVELS.map((item) => ({ value: item, label: item }))}
              onChange={(value) => change({ level: value })}
            />
          </FormRow>
          <FormRow cols={2}>
            <Select
              label="시·군"
              value={draft.regionCode}
              options={REGION_OPTIONS}
              onChange={(value) => change({ regionCode: value })}
            />
            <TextField
              label="설치 시기"
              value={draft.installedAt}
              onChange={(value) => change({ installedAt: value })}
              hint="YYYY-MM"
              ime="numeric"
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="주소"
              value={draft.address}
              onChange={(value) => change({ address: value })}
              placeholder="시·군 뒤 도로명 주소"
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
            <TextField
              label="유지관리 업체"
              value={draft.monitoringName}
              onChange={(value) => change({ monitoringName: value })}
              optional
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="유지관리 업체 연락처"
              value={draft.monitoringPhone}
              onChange={(value) => change({ monitoringPhone: formatPhone(value) })}
              ime="numeric"
              optional
            />
          </FormRow>
        </FormSection>

        <FormSection legend="연계 정보" hint="사용자는 사용자 관리에 등록된 계정 중에서 고릅니다.">
          <FormRow cols={2}>
            <PickerField
              label="사용자"
              value={user ? `${user.name} · ${user.orgName}` : ''}
              placeholder="사용자를 고르세요"
              onOpen={() => setIsPicking(true)}
              required
            />
            {isNew ? null : (
              <Select
                label="일사량계"
                value={draft.irradId}
                options={irradOptions}
                onChange={(value) => change({ irradId: value })}
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

        <FormSection legend="수용가" hint="개인정보라 목록·상세에서는 가려서 보여 줍니다.">
          {isNew ? (
            <FormRow cols={2}>
              <TextField
                label="수용가명"
                value={draft.customerName}
                onChange={(value) => change({ customerName: value })}
                optional
              />
              <TextField
                label="수용가 연락처"
                value={draft.customerPhone}
                onChange={(value) => change({ customerPhone: formatPhone(value) })}
                ime="numeric"
                optional
              />
            </FormRow>
          ) : (
            <dl className={styles.infoGrid}>
              <div>
                <dt>계약자</dt>
                <dd>
                  <MaskedText
                    masked={maskName(asset.customer.name)}
                    original={asset.customer.name}
                    label="계약자 이름"
                  />
                </dd>
              </div>
              <div>
                <dt>연락처</dt>
                <dd>
                  <MaskedText
                    masked={maskPhone(asset.customer.phone)}
                    original={asset.customer.phone}
                    label="계약자 연락처"
                  />
                </dd>
              </div>
              <div>
                <dt>등록 설비용량</dt>
                <dd>{capacity.value} {capacity.unit}</dd>
              </div>
            </dl>
          )}
        </FormSection>
      </FormPage>

      <Modal
        isOpen={isPicking}
        onClose={() => setIsPicking(false)}
        size="lg"
        title="사용자 검색"
        description="사용자 관리에 등록된 계정입니다."
      >
        <RecordPicker
          rows={users}
          getRowKey={(row) => String(row.userId)}
          selectedKey={draft.userId}
          caption="사용자 목록. ID, 사용자, 소속, 이메일 순입니다."
          placeholder="이름·소속·이메일로 검색"
          match={(row, word) => row.name.includes(word)
            || row.orgName.includes(word)
            || row.email.includes(word)
            || String(row.userId).includes(word)}
          columns={[
            { key: 'userId', header: 'ID', width: '80px', render: (row) => row.userId },
            { key: 'name', header: '사용자', width: '120px', render: (row) => row.name },
            { key: 'org', header: '소속', render: (row) => row.orgName },
            { key: 'email', header: '이메일', width: '200px', hideOnTablet: true, render: (row) => row.email },
          ]}
          onPick={(row) => {
            change({ userId: String(row.userId) });
            setIsPicking(false);
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
    </>
  );
}
