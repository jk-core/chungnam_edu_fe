import type { Pyranometer } from '@/interface/deviceMaster';
import { createRandom, hashSeed, pickNumber } from './random';
import { SCHOOLS } from './schools';

/*
  일사량계(환경센서) 마스터 (SFR-016-01).

  지금까지는 `School.pyranometerStatus` 상태값 하나로만 존재했다. 등록·수정 대상이 되려면
  이름·캘리브레이션 인수·통신 설정을 들고 있어야 해서 학교마다 한 대씩 세워 둔다.
  상태는 학교가 이미 들고 있는 값을 그대로 물려받아, 진단·알림 화면과 어긋나지 않게 한다.
*/

/** 일사량계는 RTU 3번 포트를 쓴다 — 인버터가 이 포트를 못 쓰는 이유다. */
export const PYRANOMETER_PORT = 3;

export const SEED_PYRANOMETERS: Pyranometer[] = SCHOOLS.map((school, index) => {
  const next = createRandom(hashSeed(`pyranometer-${school.id}`));

  return {
    id: `pyr-${school.id}`,
    // 서버가 매기는 번호는 1부터 이어 붙는다 (irradId).
    irradId: index + 1,
    plantId: school.id,
    plantName: school.name,
    name: `${school.name} 일사량계`,
    calibrationFactor: pickNumber(next, 0.85, 1.15, 3),
    rtuCommId: `IRR${String(index + 1).padStart(4, '0')}`,
    rtuPort: PYRANOMETER_PORT,
    // 모듈 온도계는 AI 진단이 기대값을 계산할 때 쓴다 — 대부분 함께 달려 있다.
    hasModuleThermometer: next() > 0.18,
    note: '',
    status: school.pyranometerStatus,
  };
});
