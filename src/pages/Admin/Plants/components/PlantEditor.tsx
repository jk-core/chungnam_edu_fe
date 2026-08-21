import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, TextArea, TextField } from '@/components/common/Form';
import { MaskedText } from '@/components/common/MaskedText';
import { maskName, maskPhone } from '@/utils/mask';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { regionNameOfCode } from '@/mocks/manageCodes';
import { SEED_PYRANOMETERS } from '@/mocks/pyranometers';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { AssetChange, PlantAsset } from '@/interface/asset';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { capacityOf, NONE, REGION_OPTIONS, toId, useCustomerAccounts } from '../hooks/usePlantData';

/** 수정 초안. 발전소명은 다른 화면이 함께 쓰는 이름이라 여기서 바꾸지 않는다. */
interface Draft {
  regionCode: string;
  address: string;
  addressDetail: string;
  installedAt: string;
  builderName: string;
  builderPhone: string;
  monitoringName: string;
  monitoringPhone: string;
  /** 수용가 계정 번호. 빈 문자열이면 지정하지 않은 것 */
  userId: string;
  /** 연결한 일사량계 번호. 빈 문자열이면 연결하지 않은 것 */
  irradId: string;
  inverterModel: string;
  moduleModel: string;
  wattPerPanel: number | '';
  panelCount: number | '';
  etc: string;
}

function draftOf(asset: PlantAsset): Draft {
  return {
    regionCode: asset.regionCode,
    address: asset.address,
    addressDetail: asset.addressDetail,
    installedAt: asset.installedAt,
    builderName: asset.builder.name,
    builderPhone: asset.builder.phone,
    monitoringName: asset.monitoring.name,
    monitoringPhone: asset.monitoring.phone,
    userId: asset.userId === null ? NONE : String(asset.userId),
    irradId: asset.irradId === null ? NONE : String(asset.irradId),
    inverterModel: asset.inverterModel,
    moduleModel: asset.module.model,
    wattPerPanel: asset.module.wattPerPanel,
    panelCount: asset.module.panelCount,
    etc: asset.etc,
  };
}

/** 발전소 등록 정보 수정 (SFR-016-01~04/06) */
export function PlantEditor({ asset, onClose }: { asset: PlantAsset; onClose: () => void }) {
  const saveAsset = useAssetStore((state) => state.saveAsset);
  const accounts = useCustomerAccounts();
  const entryOf = usePlantChangeLog();

  const [draft, setDraft] = useState<Draft>(() => draftOf(asset));
  const [isConfirming, setIsConfirming] = useState(false);

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  // 일사량계는 발전소마다 서 있다 — 수정 중인 발전소에 달린 것만 고르게 한다.
  const irradOptions = useMemo(
    () => [
      { value: NONE, label: '연결 안 함' },
      ...SEED_PYRANOMETERS.filter((item) => item.plantId === asset.plantId).map((item) => ({
        value: String(item.irradId),
        label: `${item.rtuCommId} · ${item.name}`,
      })),
    ],
    [asset.plantId],
  );
  const irradNameOf = (irradId: number | null) =>
    (irradId === null ? null : SEED_PYRANOMETERS.find((item) => item.irradId === irradId)?.rtuCommId) ?? '—';

  // 모듈 스펙을 바꾸면 총 용량이 즉시 다시 계산된다 (SFR-016-03).
  const draftCapacity = capacityOf(draft.moduleModel, draft.wattPerPanel, draft.panelCount);

  const commit = () => {
    if (draft.wattPerPanel === '' || draft.panelCount === '') return;

    const next: Partial<PlantAsset> = {
      regionCode: draft.regionCode,
      address: draft.address.trim(),
      addressDetail: draft.addressDetail.trim(),
      installedAt: draft.installedAt.trim(),
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      monitoring: { name: draft.monitoringName.trim(), phone: draft.monitoringPhone.trim() },
      userId: toId(draft.userId),
      irradId: toId(draft.irradId),
      inverterModel: draft.inverterModel.trim(),
      module: {
        model: draft.moduleModel.trim(),
        wattPerPanel: draft.wattPerPanel,
        panelCount: draft.panelCount,
        seriesCount: asset.module.seriesCount,
      },
      etc: draft.etc.trim(),
    };

    // 무엇이 바뀌었는지 필드 단위로 이력에 남긴다 (SFR-016-06).
    const plant = { id: asset.plantId, name: asset.plantName };
    const entries: AssetChange[] = [
      ['지역', regionNameOfCode(asset.regionCode), regionNameOfCode(draft.regionCode)],
      ['주소', asset.address, next.address ?? ''],
      ['상세 주소', asset.addressDetail || '—', next.addressDetail || '—'],
      ['설치 시기', asset.installedAt, next.installedAt ?? ''],
      ['시공 업체', asset.builder.name, next.builder?.name ?? ''],
      ['시공 업체 연락처', asset.builder.phone, next.builder?.phone ?? ''],
      ['유지관리 업체', asset.monitoring.name, next.monitoring?.name ?? ''],
      ['유지관리 업체 연락처', asset.monitoring.phone, next.monitoring?.phone ?? ''],
      ['수용가 계정', accounts.nameOf(asset.userId), accounts.nameOf(toId(draft.userId))],
      ['연결 일사량계', irradNameOf(asset.irradId), irradNameOf(toId(draft.irradId))],
      ['인버터 모델', asset.inverterModel || '—', next.inverterModel || '—'],
      ['모듈 모델', asset.module.model, next.module?.model ?? ''],
      ['모듈 1장 출력', `${asset.module.wattPerPanel}W`, `${next.module?.wattPerPanel}W`],
      ['모듈 장수', `${asset.module.panelCount}장`, `${next.module?.panelCount}장`],
      ['비고', asset.etc || '—', next.etc || '—'],
    ]
      .filter(([, before, after]) => before !== after)
      .map(([field, before, after], index) => entryOf(plant, field, before, after, index));

    if (entries.length === 0) {
      toast.info('바뀐 내용이 없습니다.');
      onClose();

      return;
    }

    saveAsset(asset.plantId, next, entries);
    toast.success(MSG.updateSuccess(asset.plantName));
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={`${asset.plantName} 등록 정보`}
        description={`${asset.address} · 설치 ${asset.installedAt}`}
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={() => setIsConfirming(true)}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <FormSection
            legend="발전소 정보"
            hint={`발전소 ID ${asset.powerPlantId} · 이름은 다른 화면과 함께 쓰는 값이라 여기서 바꾸지 않습니다.`}
          >
            <FormRow cols={2}>
              <Select
                label="지역"
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
                required
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
                required
              />
              <TextField
                label="유지관리 업체 연락처"
                value={draft.monitoringPhone}
                onChange={(value) => change({ monitoringPhone: value })}
                ime="numeric"
              />
            </FormRow>
          </FormSection>

          <FormSection legend="모듈 정보" hint="출력과 장수를 넣으면 총 설비용량이 자동 계산됩니다.">
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
                min={100}
                max={800}
                required
              />
              <NumberField
                label="모듈 장수"
                value={draft.panelCount}
                onChange={(value) => change({ panelCount: value })}
                unit="장"
                min={1}
                max={5000}
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
                {draftCapacity !== null ? `${formatNumber(draftCapacity, 1)} kW` : '—'}
              </span>
              <span className={styles.capacity__note}>
                현재 등록 {formatNumber((asset.module.wattPerPanel * asset.module.panelCount) / 1000, 1)} kW
              </span>
            </div>
          </FormSection>

          <FormSection legend="연계 정보" hint="수용가 계정은 사용자 관리에 등록된 계정 중에서 고릅니다.">
            <FormRow cols={2}>
              <Select
                label="수용가 계정"
                value={draft.userId}
                options={accounts.options}
                onChange={(value) => change({ userId: value })}
              />
              <Select
                label="연결 일사량계"
                value={draft.irradId}
                options={irradOptions}
                onChange={(value) => change({ irradId: value })}
              />
            </FormRow>
            <TextArea
              label="비고"
              value={draft.etc}
              onChange={(value) => change({ etc: value })}
              placeholder="점검 주기, 접근 경로처럼 담당자가 알아야 할 내용"
            />
          </FormSection>

          <FormSection legend="수용가 정보" hint="계약자 개인정보는 가려서 보여 주고, 필요할 때만 눌러서 확인합니다.">
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
                <dt>발전소 ID</dt>
                <dd>{asset.powerPlantId}</dd>
              </div>
            </dl>
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={MSG.updateConfirm(asset.plantName)}
        description="바뀐 항목만 수정 이력에 남습니다."
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
