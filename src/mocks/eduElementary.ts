import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber } from '@/utils/format';
import { FULL_SUN_WM2 } from './solarEdu';
import type { ElementaryContent, ImpactCopy, ImpactId } from './eduContent';
import type { EduStats } from './solarEdu';

/*
  초등 판 대본 (SFR-005-01/04/05/06).

  햇빛이 전기가 되는 일은 원래 순서가 있는 이야기다. 그래서 화면도 그 차례대로 간다 —
  다만 장면을 갈아 끼우지 않고, 한 장의 그림 위에 **다음 그림을 하나씩 더한다.**
  해가 뜨고, 판이 놓이고, 인버터가 붙고, 교실에 불이 들어오고, 끝에 나무가 자란다.

  그래야 지나가며 흘깃 보는 아이도 앞 이야기를 화면에서 다시 볼 수 있고,
  끝까지 서 있던 아이는 여정 전체가 한 장으로 완성되는 것을 본다.

  걸음마다 큰 글씨 한 줄, 설명 한 줄, 수치 하나만 둔다. 더 넣으면 읽지 않는다.
*/

/** 걸음 한 칸 곁에 붙는 수치 하나 */
export interface SceneReadout {
  label: string;
  value: number;
  unit: string;
  fractionDigits: number;
}

export interface EduScene {
  id: string;
  /** 큰 글씨 한 줄 */
  title: string;
  /** 그 아래 설명 한 줄 */
  line: string;
  /** 없으면 그림과 글만 보여 준다 */
  readout?: (stats: EduStats) => SceneReadout;
}

const SCENES: EduScene[] = [
  {
    id: 'sun',
    title: '해가 떴어요',
    line: '해가 높이 뜰수록 햇빛이 판에 똑바로 쏟아져서, 전기를 더 많이 만들어요.',
    readout: (stats) => ({
      label: '지금 햇빛 세기',
      value: (stats.irradianceNow / FULL_SUN_WM2) * 100,
      unit: '점',
      fractionDigits: 0,
    }),
  },
  {
    id: 'panel',
    title: '판이 햇빛을 받아요',
    line: '햇빛 알갱이가 판에 부딪히면, 그 힘으로 전기가 생겨요.',
    readout: (stats) => ({
      label: '지금 만드는 전기',
      value: stats.outputKw,
      unit: 'kW',
      fractionDigits: 1,
    }),
  },
  {
    id: 'inverter',
    title: '쓸 수 있게 바꿔요',
    line: '판이 만든 전기는 교실에서 그대로 쓸 수 없어요. 인버터가 알맞게 바꿔 줘요.',
    readout: (stats) => ({
      label: '오늘 만든 전기',
      value: stats.todayKwh,
      unit: 'kWh',
      fractionDigits: 0,
    }),
  },
  {
    id: 'school',
    title: '교실에 불이 켜져요',
    line: '우리가 만든 전기로 불을 켜고 선풍기를 돌려요. 남으면 밖으로 보내요.',
    readout: (stats) => ({
      label: '집으로 치면',
      value: kwhToHouseholdDays(stats.todayKwh),
      unit: '곳이 하루 쓸 만큼',
      fractionDigits: 0,
    }),
  },
  {
    id: 'tree',
    title: '공기가 깨끗해졌어요',
    line: '우리가 만든 만큼 발전소가 덜 돌아요. 나무를 심은 것과 같은 일이에요.',
    readout: (stats) => ({
      label: '나무를 심은 만큼',
      value: kwhToTrees(stats.dayKwh),
      unit: '그루',
      fractionDigits: 0,
    }),
  },
];

/** 마지막 걸음에 함께 세우는 환산 칩 */
export interface ElementaryImpact {
  itemIds: ImpactId[];
  copy?: Partial<Record<ImpactId, ImpactCopy>>;
}

export const ELEMENTARY_CONTENT: ElementaryContent = {
  level: 'elementary',
  emphasis: 'large',
  headline: {
    mainLabel: '지금 만들고 있는 전기',
    mainNote: () => '가장 셀 때랑 견주면 지금 이만큼 만들고 있어요',
    statIds: ['today', 'irradiance'],
    copy: {
      today: {
        label: '오늘 만든 전기',
        note: (stats) => `집 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}곳이 하루 쓸 만큼이에요`,
      },
      irradiance: {
        label: '지금 햇빛 세기',
        note: () => '해가 가장 좋은 낮이 100점이에요',
      },
    },
  },
  scenes: SCENES,
  impact: {
    itemIds: ['tree', 'household', 'led'],
    copy: {
      tree: { label: '나무 심은 만큼' },
      household: { label: '한 집이 쓰는 날' },
      led: { label: '교실 불 켜는 시간' },
    },
  },
};
