import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSearchModal } from '@/components/common/AddressSearch';
import { geocode } from '@/mocks/addresses';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { formatCapacity, formatPhone } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { plantFormSchema } from '@/service/plant/type';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { RecordPicker } from '@/components/common/RecordPicker';
import { regionNameOfCode } from '@/configs/regions';
import { toast } from '@/stores/toastStore';
import { useManagedUsers, usePlantAssets } from '@/hooks/usePlantAssets';
import { usePyranometerRows } from '@/pages/Admin/Plants/Pyranometer/hooks/usePyranometerRows';
import useAssetStore from '@/stores/assetStore';
import type { PlantFormValues } from '@/service/plant/type';
import type { ChangeLog } from '@/interface/changeLog';
import type { PlantAsset } from '@/interface/asset';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { usePlantCapacity } from '../hooks/usePlantData';
import { EMPTY_VALUES, irradLabelOf, toFormValues, userLabelOf } from './values';

/** 서버가 매기는 번호 자리. 시드가 10000 번대를 쓰므로 그 뒤에서 이어 붙인다. */
const PLANT_NO_BASE = 10000;

const Form = createForm<PlantFormValues>();

/** 빈 문자열을 서버가 쓰는 null 로 되돌린다. */
function toId(value: string): number | null {
  return value === '' ? null : Number(value);
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

  const methods = useForm<PlantFormValues>({
    defaultValues: asset ? toFormValues(asset, users, pyranometers) : EMPTY_VALUES,
    resolver: zodResolver(plantFormSchema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<PlantFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const regionCode = useWatch({ control: methods.control, name: 'regionCode' });
  const address = useWatch({ control: methods.control, name: 'address' });
  const userId = useWatch({ control: methods.control, name: 'userId' });
  const irradId = useWatch({ control: methods.control, name: 'irradId' });

  // 일사량계는 발전소마다 서 있다 — 이 발전소에 달린 것만 고르게 한다.
  const ownIrrads = pyranometers.filter((item) => item.plantId === asset?.plantId);
  const nameOfUser = (id: number | null) =>
    (id === null ? null : users.find((item) => item.userId === id)?.name) ?? '—';
  const irradNameOf = (id: number | null) =>
    (id === null ? null : pyranometers.find((item) => item.irradId === id)?.rtuCommId) ?? '—';

  const capacity = formatCapacity(asset ? capacityOf(asset.plantId) : 0);

  const create = (values: PlantFormValues) => {
    const created = nextPlantId();

    createPlant({
      plantId: created,
      powerPlantId: PLANT_NO_BASE + SCHOOLS.length + plantCreated.length + 1,
      plantName: values.plantName,
      regionCode: values.regionCode,
      address: values.address,
      addressDetail: values.addressDetail.trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      rtuEntName: values.rtuEntName,
      builder: { name: values.builderName.trim(), phone: values.builderPhone.trim() },
      managerEnterprise: {
        name: values.managerEnterpriseName.trim(),
        phone: values.managerEnterprisePhone.trim(),
      },
      userId: toId(values.userId),
      // 일사량계는 일사량계 탭에서 따로 세운 뒤 이 발전소를 골라 잇는다.
      irradId: null,
      plantType: values.plantType,
      etc: values.etc.trim(),
    }, entryOf(
      { id: created, name: values.plantName },
      '신규 등록',
      '—',
      `${values.plantType} · ${regionNameOfCode(values.regionCode)}`,
    ));

    toast.success(MSG.createSuccess(values.plantName));
    navigate(backTo);
  };

  const update = (values: PlantFormValues) => {
    if (!asset) return;

    const next: Partial<PlantAsset> = {
      plantName: values.plantName,
      plantType: values.plantType,
      regionCode: values.regionCode,
      address: values.address,
      addressDetail: values.addressDetail.trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      rtuEntName: values.rtuEntName,
      builder: { name: values.builderName.trim(), phone: values.builderPhone.trim() },
      managerEnterprise: {
        name: values.managerEnterpriseName.trim(),
        phone: values.managerEnterprisePhone.trim(),
      },
      userId: toId(values.userId),
      irradId: toId(values.irradId),
      etc: values.etc.trim(),
    };

    // 무엇이 바뀌었는지 필드 단위로 이력에 남긴다 (SFR-016-06).
    const plant = { id: asset.plantId, name: asset.plantName };
    const entries: ChangeLog[] = [
      ['발전소 이름', asset.plantName, next.plantName ?? ''],
      ['구분', asset.plantType, next.plantType ?? ''],
      ['주소', asset.address, next.address ?? ''],
      ['상세 주소', asset.addressDetail || '—', next.addressDetail || '—'],
      ['RTU 업체', asset.rtuEntName, next.rtuEntName ?? ''],
      ['시공 업체', asset.builder.name, next.builder?.name ?? ''],
      ['시공 업체 연락처', asset.builder.phone, next.builder?.phone ?? ''],
      ['담당 업체', asset.managerEnterprise.name || '—', next.managerEnterprise?.name || '—'],
      ['담당 업체 연락처', asset.managerEnterprise.phone || '—', next.managerEnterprise?.phone || '—'],
      ['사용자', nameOfUser(asset.userId), nameOfUser(toId(values.userId))],
      ['연결 일사량계', irradNameOf(asset.irradId), irradNameOf(toId(values.irradId))],
      ['비고', asset.etc || '—', next.etc || '—'],
    ]
      .filter(([, before, after]) => before !== after)
      .map(([field, before, after]) => entryOf(plant, field, before, after));

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
      '삭제',
      `${capacity.value}${capacity.unit} · ${regionNameOfCode(asset.regionCode)}`,
      '—',
    ));
    toast.success(MSG.deleteSuccess(asset.plantName));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '발전소 등록' : `${asset.plantName} 등록 정보`}
          description={isNew
            ? '설비용량은 설비 탭에서 설비를 등록하면 그 합으로 채워집니다.'
            : asset.address}
          backTo={backTo}
          danger={isNew ? null : (
            <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>
          )}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection
            legend="발전소 정보"
            hint={isNew ? undefined : `발전소 ID ${asset.powerPlantId}`}
          >
            <FormRow cols={2}>
              <Form.Text label="발전소 이름" name="plantName" placeholder="예: 온양초등학교" maxLength={120} required />
              <Form.Select
                label="구분"
                name="plantType"
                options={SCHOOL_LEVELS.map((item) => ({ value: item, label: item }))}
              />
            </FormRow>
            <FormRow cols={2}>
              {/* 시·군 코드는 검색 결과가 함께 돌려준다 — 손으로 고르는 칸을 두지 않는다. */}
              <Form.Picker
                label="주소"
                name="address"
                displayName="address"
                placeholder="주소를 검색하세요"
                hint={address ? regionNameOfCode(regionCode) : undefined}
                required
                modal={({ onSelect, onClose }) => (
                  <AddressSearchModal
                    isOpen
                    onClose={onClose}
                    onSelect={(picked) => {
                      // 우편번호 서비스는 좌표를 주지 않는다 — 고른 주소로 한 번 더 찍는다.
                      const point = geocode(picked.roadAddress);

                      onSelect({
                        address: picked.roadAddress,
                        regionCode: picked.sigunguCode,
                        latitude: point ? String(point.lat) : '',
                        longitude: point ? String(point.lng) : '',
                      });
                    }}
                  />
                )}
              />
              <Form.Text label="상세주소" name="addressDetail" placeholder="예: 본관 옥상" optional />
            </FormRow>
            <FormRow cols={2}>
              {/* 주소를 고르면 채워진다. 옥상이 아닌 부지는 지도에서 어긋나므로 손으로 보정한다. */}
              <Form.Text label="위도" name="latitude" hint="지도 마커가 서는 자리" ime="numeric" required />
              <Form.Text label="경도" name="longitude" hint="주소를 고르면 채워집니다" ime="numeric" required />
            </FormRow>
          </FormSection>

          <FormSection legend="업체" hint="연락처는 고장 대응 시 바로 쓰입니다.">
            <FormRow cols={2}>
              <Form.Text label="RTU업체" name="rtuEntName" maxLength={120} required />
              <Form.Text label="시공업체" name="builderName" maxLength={120} optional />
            </FormRow>
            <FormRow cols={2}>
              <Form.Text
                label="시공업체 연락처"
                name="builderPhone"
                transform={formatPhone}
                ime="numeric"
                optional
              />
              <Form.Text label="담당업체" name="managerEnterpriseName" maxLength={120} optional />
            </FormRow>
            <FormRow cols={2}>
              <Form.Text
                label="담당업체 연락처"
                name="managerEnterprisePhone"
                transform={formatPhone}
                ime="numeric"
                optional
              />
            </FormRow>
          </FormSection>

          <FormSection legend="연계 정보" hint="사용자는 사용자 관리에 등록된 계정 중에서 고릅니다.">
            <FormRow cols={2}>
              <Form.Picker
                label="사용자"
                name="userId"
                displayName="userLabel"
                placeholder="사용자를 고르세요"
                required
                modal={({ onSelect, onClose }) => (
                  <Modal
                    isOpen
                    onClose={onClose}
                    size="lg"
                    title="사용자 검색"
                    description="사용자 관리에 등록된 계정입니다."
                  >
                    <RecordPicker
                      rows={users}
                      getRowKey={(row) => String(row.userId)}
                      selectedKey={userId}
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
                        {
                          key: 'email',
                          header: '이메일',
                          width: '200px',
                          hideOnTablet: true,
                          render: (row) => row.email,
                        },
                      ]}
                      onPick={(row) => onSelect({ userId: String(row.userId), userLabel: userLabelOf(row) })}
                    />
                  </Modal>
                )}
              />
              {isNew ? null : (
                <Form.Picker
                  label="일사량계"
                  name="irradId"
                  displayName="irradLabel"
                  placeholder={ownIrrads.length > 0 ? '일사량계를 고르세요' : '이 발전소에 등록된 일사량계가 없습니다'}
                  disabled={ownIrrads.length === 0}
                  optional
                  modal={({ onSelect, onClose }) => (
                    <Modal
                      isOpen
                      onClose={onClose}
                      size="lg"
                      title="일사량계 검색"
                      description="이 발전소에 등록된 일사량계입니다."
                    >
                      <RecordPicker
                        rows={ownIrrads}
                        getRowKey={(row) => String(row.irradId)}
                        selectedKey={irradId}
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
                        onPick={(row) => onSelect({ irradId: String(row.irradId), irradLabel: irradLabelOf(row) })}
                      />
                    </Modal>
                  )}
                />
              )}
            </FormRow>
            <Form.Area
              label="비고"
              name="etc"
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
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('발전소') : MSG.updateConfirm(asset?.plantName ?? '발전소')}
        description={isNew ? undefined : '바뀐 항목만 수정 이력에 남습니다.'}
        confirmLabel="저장"
        onConfirm={() => pending && (isNew ? create(pending) : update(pending))}
        onClose={() => setPending(null)}
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
