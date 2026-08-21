import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { computeCapacity } from '@/mocks/assetMaster';
import { FormRow, FormSection, NumberField, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { REGION_CODES, regionNameOfCode } from '@/mocks/manageCodes';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { PlantAsset } from '@/interface/asset';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { capacityOf, NONE, REGION_OPTIONS, toId, useCustomerAccounts } from '../hooks/usePlantData';

/** 서버가 매기는 번호 자리. 시드가 10000 번대를 쓰므로 그 뒤에서 이어 붙인다. */
const PLANT_NO_BASE = 10000;

/** 신규 등록 초안 — 수정 초안과 달리 발전소 자체를 세우므로 소재·설치 정보까지 받는다 (SFR-016-01) */
interface NewDraft {
  plantName: string;
  regionCode: string;
  level: string;
  address: string;
  addressDetail: string;
  installedAt: string;
  inverterModel: string;
  builderName: string;
  builderPhone: string;
  monitoringName: string;
  monitoringPhone: string;
  customerName: string;
  customerPhone: string;
  userId: string;
  moduleModel: string;
  wattPerPanel: number | '';
  panelCount: number | '';
  etc: string;
}

const EMPTY_DRAFT: NewDraft = {
  plantName: '',
  regionCode: REGION_CODES[0].regionCode,
  level: SCHOOL_LEVELS[0],
  address: '',
  addressDetail: '',
  installedAt: NOW.format('YYYY-MM'),
  inverterModel: '',
  builderName: '',
  builderPhone: '',
  monitoringName: '',
  monitoringPhone: '',
  customerName: '',
  customerPhone: '',
  userId: NONE,
  moduleModel: '',
  wattPerPanel: '',
  panelCount: '',
  etc: '',
};

/** 발전소 신규 등록 (SFR-016-01~04) */
export function PlantCreator({ onClose }: { onClose: () => void }) {
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const createPlant = useAssetStore((state) => state.createPlant);
  const nextPlantId = useAssetStore((state) => state.nextPlantId);
  const accounts = useCustomerAccounts();
  const entryOf = usePlantChangeLog();

  const [draft, setDraft] = useState<NewDraft>(EMPTY_DRAFT);

  const change = (next: Partial<NewDraft>) => setDraft({ ...draft, ...next });

  // 모듈 스펙만 넣으면 총 용량이 바로 잡힌다 (SFR-016-03) — 등록 폼도 수정 폼과 같은 셈을 쓴다.
  const capacity = capacityOf(draft.moduleModel, draft.wattPerPanel, draft.panelCount);
  const canCreate = Boolean(draft.plantName.trim() && draft.address.trim() && draft.moduleModel.trim())
    && capacity !== null;

  const commit = () => {
    if (!canCreate || draft.wattPerPanel === '' || draft.panelCount === '') return;

    const regionName = regionNameOfCode(draft.regionCode);
    const plantId = nextPlantId();
    // 시·군 이름을 이미 적었다면 그대로 두고, 도로명만 적었다면 앞에 붙여 준다.
    const address = draft.address.includes(regionName)
      ? draft.address.trim()
      : `충청남도 ${regionName} ${draft.address.trim()}`;

    const asset: PlantAsset = {
      plantId,
      powerPlantId: PLANT_NO_BASE + SCHOOLS.length + plantCreated.length + 1,
      plantName: draft.plantName.trim(),
      regionCode: draft.regionCode,
      address,
      addressDetail: draft.addressDetail.trim(),
      installedAt: draft.installedAt.trim(),
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      monitoring: { name: draft.monitoringName.trim(), phone: draft.monitoringPhone.trim() },
      customer: { name: draft.customerName.trim(), phone: draft.customerPhone.trim() },
      userId: toId(draft.userId),
      // 일사량계는 설비 등록 화면에서 따로 세운 뒤 이 발전소를 골라 잇는다.
      irradId: null,
      inverterModel: draft.inverterModel.trim(),
      module: {
        model: draft.moduleModel.trim(),
        wattPerPanel: draft.wattPerPanel,
        panelCount: draft.panelCount,
        seriesCount: 1,
      },
      etc: draft.etc.trim(),
    };

    createPlant(asset, entryOf(
      { id: plantId, name: asset.plantName },
      '신규 등록',
      '—',
      `${formatNumber(computeCapacity(asset.module), 1)}kW · ${draft.level}`,
    ));

    toast.success(MSG.createSuccess(asset.plantName));
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title="발전소 등록"
      description="설비용량은 모듈 정보에서 자동으로 계산됩니다."
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={commit} disabled={!canCreate}>등록</Button>
        </>
      )}
    >
      <div className={styles.form}>
        <FormSection legend="발전소 정보" hint="지역은 지도 위 마커 자리를 정하는 데 쓰입니다.">
          <FormRow cols={2}>
            <TextField
              label="발전소명"
              value={draft.plantName}
              onChange={(value) => change({ plantName: value })}
              placeholder="예: 온양초등학교"
              required
            />
            <Select
              label="지역"
              value={draft.regionCode}
              options={REGION_OPTIONS}
              onChange={(value) => change({ regionCode: value })}
            />
          </FormRow>
          <FormRow cols={2}>
            <Select
              label="학교급"
              value={draft.level}
              options={SCHOOL_LEVELS.map((item) => ({ value: item, label: item }))}
              onChange={(value) => change({ level: value })}
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
              placeholder="지역 뒤 도로명 주소"
              required
            />
            <TextField
              label="상세 주소"
              value={draft.addressDetail}
              onChange={(value) => change({ addressDetail: value })}
              placeholder="예: 본관 옥상"
            />
          </FormRow>
        </FormSection>

        <FormSection legend="시공·유지관리 업체" hint="연락처는 고장 대응 시 바로 쓰입니다.">
          <FormRow cols={2}>
            <TextField
              label="시공 업체"
              value={draft.builderName}
              onChange={(value) => change({ builderName: value })}
            />
            <TextField
              label="시공 업체 연락처"
              value={draft.builderPhone}
              onChange={(value) => change({ builderPhone: value })}
              ime="numeric"
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="유지관리 업체"
              value={draft.monitoringName}
              onChange={(value) => change({ monitoringName: value })}
            />
            <TextField
              label="유지관리 업체 연락처"
              value={draft.monitoringPhone}
              onChange={(value) => change({ monitoringPhone: value })}
              ime="numeric"
            />
          </FormRow>
        </FormSection>

        <FormSection legend="수용가" hint="개인정보라 목록·상세에서는 가려서 보여 줍니다.">
          <FormRow cols={2}>
            <TextField
              label="수용가명"
              value={draft.customerName}
              onChange={(value) => change({ customerName: value })}
            />
            <TextField
              label="수용가 연락처"
              value={draft.customerPhone}
              onChange={(value) => change({ customerPhone: value })}
              ime="numeric"
            />
          </FormRow>
          <Select
            label="수용가 계정"
            value={draft.userId}
            options={accounts.options}
            onChange={(value) => change({ userId: value })}
          />
        </FormSection>

        <FormSection legend="설비 정보" hint="출력과 장수를 넣으면 총 설비용량이 자동 계산됩니다.">
          <FormRow cols={3}>
            <TextField
              label="모듈 모델"
              value={draft.moduleModel}
              onChange={(value) => change({ moduleModel: value })}
              ime="latin"
              required
            />
            <NumberField
              label="1장 출력"
              value={draft.wattPerPanel}
              onChange={(value) => change({ wattPerPanel: value })}
              unit="W"
              required
            />
            <NumberField
              label="모듈 장수"
              value={draft.panelCount}
              onChange={(value) => change({ panelCount: value })}
              unit="장"
              required
            />
          </FormRow>
          <TextField
            label="인버터 모델"
            value={draft.inverterModel}
            onChange={(value) => change({ inverterModel: value })}
            ime="latin"
          />

          <div className={styles.capacity}>
            <span className={styles.capacity__label}>산출 설비용량</span>
            <span className={styles.capacity__value}>
              {capacity === null ? '—' : `${formatNumber(capacity, 1)} kW`}
            </span>
            <span className={styles.capacity__note}>모듈 출력 × 장수로 계산합니다</span>
          </div>

          <TextArea
            label="비고"
            value={draft.etc}
            onChange={(value) => change({ etc: value })}
            placeholder="점검 주기, 접근 경로처럼 담당자가 알아야 할 내용"
          />
        </FormSection>
      </div>
    </Modal>
  );
}
