import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import styles from '../Admin.module.scss';
import { DeviceInverters } from './DeviceInverters';
import { DeviceJunctionBoxes } from './DeviceJunctionBoxes';
import { DeviceModuleMasters } from './DeviceModuleMasters';
import { DevicePyranometers } from './DevicePyranometers';
import { DeviceRtus } from './DeviceRtus';
import { DeviceStrings } from './DeviceStrings';

/** 어느 장비를 볼지 (SFR-016-01, SFR-017-01~07) */
type Kind = 'rtu' | 'inverter' | 'junction' | 'module' | 'string' | 'pyranometer';

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'rtu', label: 'RTU' },
  { value: 'inverter', label: '인버터' },
  { value: 'junction', label: '접속반' },
  { value: 'module', label: '모듈' },
  { value: 'string', label: '스트링' },
  { value: 'pyranometer', label: '일사량계' },
];

/** 시스템 장비 관리 (SFR-016·017) — 여섯 종류를 갈아 가며 등록·수정·삭제한다. */
export function DevicesTab() {
  const [kind, setKind] = useState<Kind>('rtu');

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <SegmentedControl value={kind} onChange={setKind} options={KIND_OPTIONS} label="장비 종류" />
      </div>

      {kind === 'rtu' ? <DeviceRtus /> : null}
      {kind === 'inverter' ? <DeviceInverters /> : null}
      {kind === 'junction' ? <DeviceJunctionBoxes /> : null}
      {kind === 'module' ? <DeviceModuleMasters /> : null}
      {kind === 'string' ? <DeviceStrings /> : null}
      {kind === 'pyranometer' ? <DevicePyranometers /> : null}
    </div>
  );
}
