import type {
  EquipmentMaster,
  InverterKind,
  InverterProduct,
  StringMaster,
} from '@/interface/deviceMaster';
import type { ChangeLog } from '@/interface/changeLog';
import { getSeedAsset } from './assetMaster';
import { INVERTERS } from './equipment';
import { SEED_MODULES } from './moduleProducts';
import { createRandom, hashSeed, pickNumber } from './random';
import { stampAgo } from './today';

/*
  설비 마스터 시드 (SFR-016-01, SFR-017-04~06).

  스트링은 지금까지 인버터 아래 중첩 데이터로만 있었고 편집 대상이 아니었다.
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

/** 카탈로그에 올릴 용량 단계. 설비 실제 용량을 이 중 가장 가까운 값으로 올려 붙인다. */
const PRODUCT_CAPACITIES = [3, 5, 10, 20, 30, 50, 75, 100, 250, 500];

function nearestCapacity(capacityKw: number): number {
  return PRODUCT_CAPACITIES.reduce(
    (best, item) => (Math.abs(item - capacityKw) < Math.abs(best - capacityKw) ? item : best),
    PRODUCT_CAPACITIES[0],
  );
}

/**
 * 인버터 제품 카탈로그 (SFR-017-04).
 * 업체 × 타입 × 용량 단계로 세워 두고, 아래 설비가 그중 하나를 가리킨다.
 */
export const SEED_INVERTER_PRODUCTS: InverterProduct[] = INVERTER_MAKERS.flatMap((maker, makerIndex) =>
  (['string', 'central', 'micro'] as InverterKind[]).flatMap((kind, kindIndex) =>
    PRODUCT_CAPACITIES.map((capacityKw, capaIndex) => {
      const seq = (makerIndex * 3 + kindIndex) * PRODUCT_CAPACITIES.length + capaIndex + 1;

      return {
        id: `INVP-${String(seq).padStart(3, '0')}`,
        inverterId: 31000 + seq,
        maker,
        name: `${kind === 'central' ? 'PVS' : kind === 'micro' ? 'PVM' : 'PVI'}-${capacityKw}K`,
        capacityKw,
        kind,
        phase: capacityKw < 20 ? ('단상' as const) : ('삼상' as const),
      };
    })));

/** 설비가 물릴 제품을 업체·타입·용량으로 찾는다. 없으면 카탈로그 첫 줄로 떨어진다. */
function productFor(maker: string, kind: InverterKind, capacityKw: number): InverterProduct {
  const wanted = nearestCapacity(capacityKw);

  return SEED_INVERTER_PRODUCTS.find(
    (item) => item.maker === maker && item.kind === kind && item.capacityKw === wanted,
  ) ?? SEED_INVERTER_PRODUCTS[0];
}

/** 설비 날짜의 기준이 되는 달. 설비마다 다른 날을 심을 이유가 없어 한 값에서 파생시킨다 */
const SEED_INSTALLED_MONTH = '2021-03';

export const SEED_EQUIPMENT: EquipmentMaster[] = INVERTERS.map((inverter, index) => {
  const next = createRandom(hashSeed(`equipment-${inverter.id}`));
  const asset = getSeedAsset(inverter.schoolId);
  const product = SEED_MODULES[index % SEED_MODULES.length];
  const watt = product.wattPerPanel;
  const panelCount = Math.max(1, Math.round((inverter.capacityKw * 1000) / watt));
  const { series, parallel } = splitArray(next, panelCount);
  // 운영 설비는 전부 스트링 직결이다. 카탈로그의 센트럴·마이크로 기종은 제품 관리 화면에만 남는다.
  const kind: InverterKind = 'string';

  return {
    inverterId: inverter.id,
    // 설비 식별자(cid)는 서버가 매기는 11자리 숫자다 — 목록·검색이 이 값을 쓴다.
    cid: 10192000000 + index + 1,
    plantId: inverter.schoolId,
    userId: asset?.userId ?? null,
    name: inverter.name,
    rtuCommId: `INV${String(index + 1).padStart(4, '0')}`,
    // 3번 포트는 일사량계 몫이라 설비는 0~2, 4~11 만 쓴다.
    rtuPort: [0, 1, 2, 4, 5, 6][index % 6],
    inverterProductId: productFor(
      INVERTER_MAKERS[index % INVERTER_MAKERS.length],
      kind,
      inverter.capacityKw,
    ).id,
    moduleProductId: product.id,
    azimuth: [150, 165, 180, 180, 195, 210][index % 6],
    inclineAngle: [10, 15, 20, 25, 30][index % 5],
    series1: series,
    parallel1: parallel,
    series2: 0,
    parallel2: 0,
    equipmentCapacity: Math.round(inverter.capacityKw * 1000) / 1000,
    asExpiresAt: `${Number(SEED_INSTALLED_MONTH.slice(0, 4)) + 5}${SEED_INSTALLED_MONTH.slice(4)}-01`,
    note: '',
    installedAt: `${SEED_INSTALLED_MONTH}-01`,
    operatedAt: `${SEED_INSTALLED_MONTH}-15`,
    firstReceivedAt: `${SEED_INSTALLED_MONTH}-15 06:20`,
    // 통신이 끊긴 설비는 마지막 수신이 한참 전에 멈춰 있다.
    lastReceivedAt: inverter.status === 'commLost' ? stampAgo(3, '05:40') : stampAgo(0, '14:35'),
  };
});

/**
 * 서버가 매기는 일련번호를 흉내 낸다.
 * 설비 순번과 그 안 순번을 섞어, 목업을 다시 만들어도 같은 값이 나오게 한다.
 */
function stringSeq(inverterId: string, index: number): number {
  return INVERTERS.findIndex((item) => item.id === inverterId) * 100 + index + 1;
}

export const SEED_STRINGS: StringMaster[] = INVERTERS.flatMap((inverter) => {
  const master = SEED_EQUIPMENT.find((item) => item.inverterId === inverter.id);

  return inverter.strings.map((unit, index) => ({
    id: unit.id,
    stringId: stringSeq(inverter.id, index),
    inverterId: inverter.id,
    seq: index + 1,
    name: unit.name,
    seriesCount: master?.series1 ?? 18,
    parallelCount: 1,
  }));
});

/** 인버터 타입 표기 (SFR-017-04) */
export const INVERTER_KIND_LABEL: Record<InverterKind, string> = {
  string: '스트링형',
  central: '센트럴형',
  micro: '마이크로형',
};

/**
 * 설비용량 산출 (SFR-016-03).
 * 손으로 넣지 않는다 — 고른 모듈 1장 출력에 MPPT 1·2번 직병렬 장수를 곱한다.
 */
export function computeEquipmentCapacity(
  master: Pick<EquipmentMaster, 'series1' | 'parallel1' | 'series2' | 'parallel2'>,
  wattPerPanel: number,
): number {
  const panels = master.series1 * master.parallel1 + master.series2 * master.parallel2;

  return (panels * wattPerPanel) / 1000;
}

/** 목록·검색에 내보내는 제품 표기. 업체명으로도 찾을 수 있게 한 줄에 함께 담는다. */
export function describeInverterProduct(product: InverterProduct | undefined): string {
  return product ? `${product.maker} - ${product.name} (${product.inverterId})` : '';
}

/** 관리 화면을 처음 열었을 때도 이력 칸이 비어 있지 않도록 몇 줄 깔아 둔다. */
export const SEED_DEVICE_CHANGES: ChangeLog[] = [
  {
    id: 'DC-3104',
    targetType: 'equipment',
    targetId: SEED_EQUIPMENT[2]?.inverterId ?? '',
    targetName: SEED_EQUIPMENT[2]?.name ?? '',
    at: stampAgo(9, '11:05'),
    actor: '김도현',
    field: '수집 주기',
    before: '10분',
    after: '5분',
  },
  {
    id: 'DC-3103',
    targetType: 'equipment',
    targetId: SEED_EQUIPMENT[5]?.inverterId ?? '',
    targetName: SEED_EQUIPMENT[5]?.name ?? '',
    at: stampAgo(17, '14:30'),
    actor: '김도현',
    field: '경사각',
    before: '25도',
    after: `${SEED_EQUIPMENT[5]?.inclineAngle ?? 0}도`,
  },
  {
    id: 'DC-3101',
    targetType: 'inverter',
    targetId: SEED_INVERTER_PRODUCTS[1].id,
    targetName: SEED_INVERTER_PRODUCTS[1].name,
    at: stampAgo(31, '16:42'),
    actor: '박세연',
    field: '인버터 용량',
    before: '4 kW',
    after: `${SEED_INVERTER_PRODUCTS[1].capacityKw} kW`,
  },
  {
    id: 'DC-3102',
    targetType: 'module',
    targetId: SEED_MODULES[1].id,
    targetName: SEED_MODULES[1].name,
    at: stampAgo(24, '09:18'),
    actor: '박세연',
    field: '모듈 용량',
    before: '455 W',
    after: `${SEED_MODULES[1].wattPerPanel} W`,
  },
];
