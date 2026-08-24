import { Button } from '@/components/common/Button';
import { FormField, FormRow, FormSection, SelectControl, TextField } from '@/components/common/Form';
import { PlusIcon } from '@/components/common/Icon';
import type { InspectedDevice } from '@/interface/fieldReport';
import styles from '../../FieldReport.module.scss';

/** 점검 설비로 고를 수 있는 갈래 (SFR-021-06) */
const DEVICE_KINDS = ['인버터', 'RTU', '접속반', '모듈 어레이', '일사량계', '기타'];

interface DeviceFieldsProps {
  devices: InspectedDevice[];
  onChange: (devices: InspectedDevice[]) => void;
  /** 새 줄 id 를 겹치지 않게 매길 때 쓰는 보고서 번호 */
  reportId: string;
}

/**
 * 점검한 설비를 따로 적는다 (SFR-021-06).
 * 점검 항목은 "무엇을 봤는가"이고, 여기는 "어느 설비를 봤는가"다 — 사진·이상 이력이 이 축으로 묶인다.
 */
export function DeviceFields({ devices, onChange, reportId }: DeviceFieldsProps) {
  const patchRow = (id: string, patch: Partial<InspectedDevice>) => {
    onChange(devices.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <FormSection legend="점검 설비" hint="이번 점검에서 실제로 본 설비와 설비별 특이사항을 적습니다.">
      {devices.map((device, index) => (
        <FormRow key={device.id} cols={3}>
          <FormField label={`${index + 1}번 설비 구분`}>
            <SelectControl
              value={device.kind}
              options={DEVICE_KINDS.map((kind) => ({ value: kind, label: kind }))}
              onChange={(value) => patchRow(device.id, { kind: value })}
            />
          </FormField>
          <TextField
            label={`${index + 1}번 설비명`}
            value={device.name}
            onChange={(value) => patchRow(device.id, { name: value })}
          />
          <TextField
            label={`${index + 1}번 특이사항`}
            value={device.note}
            onChange={(value) => patchRow(device.id, { note: value })}
            placeholder="없으면 비워 둡니다"
          />
        </FormRow>
      ))}

      <div className={styles.toolbar__actions}>
        <Button
          size="sm"
          variant="secondary"
          iconLeft={<PlusIcon />}
          onClick={() => onChange([
            ...devices,
            { id: `dev-${reportId}-${devices.length + 1}`, kind: DEVICE_KINDS[0], name: '', note: '' },
          ])}
        >
          설비 추가
        </Button>
        {devices.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => onChange(devices.slice(0, -1))}>마지막 줄 삭제</Button>
        ) : null}
      </div>
    </FormSection>
  );
}
