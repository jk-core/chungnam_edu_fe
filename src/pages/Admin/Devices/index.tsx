import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import styles from '../Admin.module.scss';
import InverterDepth from './Inverter';
import JunctionBoxDepth from './JunctionBox';
import ModuleDepth from './Module';
import PyranometerDepth from './Pyranometer';
import RtuDepth from './Rtu';
import StringDepth from './String';

/** 어느 장비를 볼지 (SFR-016-01, SFR-017-01~07) */
type Kind = 'rtu' | 'inverter' | 'junction' | 'module' | 'string' | 'pyranometer';

const DEPTHS = {
  rtu: RtuDepth,
  inverter: InverterDepth,
  junction: JunctionBoxDepth,
  module: ModuleDepth,
  string: StringDepth,
  pyranometer: PyranometerDepth,
} as const;

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'rtu', label: 'RTU' },
  { value: 'inverter', label: '인버터' },
  { value: 'junction', label: '접속반' },
  { value: 'module', label: '모듈' },
  { value: 'string', label: '스트링' },
  { value: 'pyranometer', label: '일사량계' },
];

/** 시스템 장비 관리 (SFR-016·017) — 여섯 종류를 갈아 가며 등록·수정·삭제한다. */
function DevicesPage() {
  const [kind, setKind] = useState<Kind>('rtu');
  const Depth = DEPTHS[kind];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <SegmentedControl value={kind} onChange={setKind} options={KIND_OPTIONS} label="장비 종류" />
      </div>

      <Depth />
    </div>
  );
}

export default DevicesPage;
