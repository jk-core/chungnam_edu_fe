import type {
  DeviceChange,
  InverterKind,
  InverterMaster,
  JunctionBoxMaster,
  StringMaster,
} from '@/interface/deviceMaster';
import { getSeedAsset } from './assetMaster';
import { INVERTERS } from './equipment';
import { getModuleByName, SEED_MODULES } from './moduleProducts';
import { createRandom, hashSeed, pickNumber } from './random';
import { getSchoolById } from './schools';
import { stampAgo } from './today';

/*
  설비 마스터 시드 (SFR-016-01, SFR-017-04~06).

  접속반·스트링은 지금까지 인버터 아래 중첩 데이터로만 있었고 편집 대상이 아니었다.
  등록·수정을 붙이려면 각자 id 로 집히는 줄이어야 해서, 운영 데이터에서 한 겹 펼쳐 온다.
  펼쳐 오는 값은 이름과 구성뿐이다 — 상태·출력은 운영 쪽이 계속 계산한다.
*/

const INVERTER_MAKERS = ['다쓰테크', '윌링스', '에스티솔라', '카코뉴에너지'];

/** 인버터 하나가 물고 있는 모듈 장수를 직렬×병렬로 쪼갠다. */
function splitArray(next: () => number, panelCount: number): { series: number; parallel: number } {
  // 직렬은 계통 전압에 맞춰 15~22장 사이에서 고른다. 나머지가 병렬 조 수가 된다.
  const series = Math.max(10, Math.min(22, Math.round(pickNumber(next, 15, 22))));

  return { series, parallel: Math.max(1, Math.round(panelCount / series)) };
}

export const SEED_INVERTER_MASTERS: InverterMaster[] = INVERTERS.map((inverter, index) => {
  const next = createRandom(hashSeed(`inverter-master-${inverter.id}`));
  const asset = getSeedAsset(inverter.schoolId);
  const product = asset ? getModuleByName(asset.module.model) : null;
  const watt = product?.wattPerPanel ?? SEED_MODULES[0].wattPerPanel;
  const panelCount = Math.max(1, Math.round((inverter.capacityKw * 1000) / watt));
  const { series, parallel } = splitArray(next, panelCount);
  const installedAt = asset?.installedAt ?? '2021-03';

  return {
    inverterId: inverter.id,
    plantId: inverter.schoolId,
    name: inverter.name,
    maker: INVERTER_MAKERS[index % INVERTER_MAKERS.length],
    productName: `${inverter.type === 'central' ? 'PVS' : 'PVI'}-${Math.round(inverter.capacityKw)}K`,
    rtuCommId: `INV${String(index + 1).padStart(4, '0')}`,
    // 3번 포트는 일사량계 몫이라 인버터는 0~2, 4~11 만 쓴다.
    rtuPort: [0, 1, 2, 4, 5, 6][index % 6],
    kind: inverter.type === 'central' ? 'central' : 'string',
    phase: inverter.phase,
    moduleProductId: product?.id ?? SEED_MODULES[0].id,
    series1: series,
    parallel1: parallel,
    series2: 0,
    parallel2: 0,
    note: '',
    installedAt: `${installedAt}-01`,
    operatedAt: `${installedAt}-15`,
  };
});

export const SEED_JUNCTION_BOXES: JunctionBoxMaster[] = INVERTERS.flatMap((inverter) => {
  const master = SEED_INVERTER_MASTERS.find((item) => item.inverterId === inverter.id);

  return inverter.junctionBoxes.map((box) => ({
    id: box.id,
    inverterId: inverter.id,
    name: box.name,
    seriesCount: master?.series1 ?? 18,
    // 접속반 하나가 받는 조 수는 그 아래 채널 수를 따른다.
    parallelCount: Math.max(1, box.channels.length),
  }));
});

export const SEED_STRINGS: StringMaster[] = INVERTERS.flatMap((inverter) => {
  const master = SEED_INVERTER_MASTERS.find((item) => item.inverterId === inverter.id);

  return inverter.strings.map((unit, index) => ({
    id: unit.id,
    inverterId: inverter.id,
    seq: index + 1,
    name: unit.name,
    seriesCount: master?.series1 ?? 18,
    parallelCount: 1,
  }));
});

/** 인버터 타입 표기 (SFR-017-04) */
export const INVERTER_KIND_LABEL: Record<InverterKind, string> = {
  general: '일반형',
  string: '스트링형',
  central: '센트럴형',
  micro: '마이크로형',
};

/**
 * 인버터 설비용량 산출 (SFR-016-03).
 * 손으로 넣지 않는다 — 고른 모듈 1장 출력에 MPPT 1·2번 직병렬 장수를 곱한다.
 */
export function computeInverterCapacity(
  master: Pick<InverterMaster, 'series1' | 'parallel1' | 'series2' | 'parallel2'>,
  wattPerPanel: number,
): number {
  const panels = master.series1 * master.parallel1 + master.series2 * master.parallel2;

  return (panels * wattPerPanel) / 1000;
}

/** 관리 화면을 처음 열었을 때도 이력 칸이 비어 있지 않도록 몇 줄 깔아 둔다. */
export const SEED_DEVICE_CHANGES: DeviceChange[] = [
  {
    id: 'DC-3104',
    kind: 'rtu',
    targetId: SEED_INVERTER_MASTERS[2]?.plantId ?? '',
    targetName: getSchoolById(SEED_INVERTER_MASTERS[2]?.plantId ?? null)?.name ?? '',
    at: stampAgo(9, '11:05'),
    actor: '김도현',
    field: '수집 주기',
    before: '10분',
    after: '5분',
  },
  {
    id: 'DC-3103',
    kind: 'inverter',
    targetId: SEED_INVERTER_MASTERS[5]?.inverterId ?? '',
    targetName: SEED_INVERTER_MASTERS[5]?.name ?? '',
    at: stampAgo(17, '14:30'),
    actor: '김도현',
    field: '인버터 업체명',
    before: '윌링스',
    after: SEED_INVERTER_MASTERS[5]?.maker ?? '',
  },
  {
    id: 'DC-3102',
    kind: 'module',
    targetId: SEED_MODULES[1].id,
    targetName: SEED_MODULES[1].name,
    at: stampAgo(24, '09:18'),
    actor: '박세연',
    field: '모듈 용량',
    before: '455 W',
    after: `${SEED_MODULES[1].wattPerPanel} W`,
  },
];
