import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber } from '@/utils/format';
import { FULL_SUN_WM2 } from './solarEdu';
import type { ElementaryContent } from './eduContent';
import type { EduStats } from './solarEdu';

/*
  초등 판 대본 (SFR-005-01/03/04/05/06).

  이야기를 세 장으로 나눴다.

  1장 — 전기가 어떻게 만들어지나. 한 장의 그림 위에 다음 그림을 하나씩 더해 여정을 완성한다.
  2장 — 그래서 무엇이 좋아졌나. 수치 옆에 그 수치가 뜻하는 물건이 실제로 움직인다.
  3장 — 태양광은 왜 좋은가. 걸음마다 그림 하나로 한 가지 이점을 보인다.

  한 장이 끝나면 다음 장으로 저절로 넘어간다. 걸음마다 큰 글씨 한 줄, 설명 한 줄, 수치 하나만 둔다 —
  더 넣으면 읽지 않는다.
*/

// ── 1장. 전기가 만들어지는 순서 ────────────────────────────

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
  /**
   * 말풍선이 설 자리와 꼬리 방향.
   *
   * 좌표는 그림의 제 좌표계(viewBox 900×360)를 그대로 쓴다 — 화면 비율에 따라 그림이 가운데로 몰리므로
   * 바깥에서 %로 얹으면 가리키는 곳이 어긋난다.
   * 꼬리는 그 걸음에서 새로 나타난 것을 가리킨다. 해는 화면 왼쪽 위에 있어 옆구리로 가리킨다.
   * `tailAt` 은 말풍선 왼쪽 끝에서 꼬리까지의 거리다 — 대상이 말풍선 어느 쪽에 있느냐에 따라 달라진다.
   */
  at: { x: number; y: number; tail: 'left' | 'bottom'; tailAt?: number };
}

const SCENES: EduScene[] = [
  {
    id: 'sun',
    title: '해가 떴어요',
    line: '해가 높이 뜰수록 햇빛이 판에 똑바로 내리쬐어서, 전기를 더 많이 만들어요.',
    at: { x: 300, y: 24, tail: 'left' },
    readout: (stats) => ({
      label: '일사강도',
      value: (stats.irradianceNow / FULL_SUN_WM2) * 100,
      unit: '점',
      fractionDigits: 0,
    }),
  },
  {
    id: 'panel',
    title: '판이 햇빛을 받아요',
    line: '햇빛이 판에 닿으면 판 안에서 전기가 한 방향으로 흐르기 시작해요.',
    at: { x: 280, y: 70, tail: 'bottom', tailAt: 30 },
    readout: (stats) => ({
      label: '실시간 출력',
      value: stats.outputKw,
      unit: 'kW',
      fractionDigits: 1,
    }),
  },
  {
    id: 'inverter',
    title: '쓸 수 있게 바꿔요',
    line: '판이 만든 전기는 교실에서 그대로 쓸 수 없어요. 인버터가 쓸 수 있는 형태로 바꿔 줘요.',
    at: { x: 346, y: 46, tail: 'bottom', tailAt: 150 },
    readout: (stats) => ({
      label: '금일 발전량',
      value: stats.todayKwh,
      unit: 'kWh',
      fractionDigits: 0,
    }),
  },
  {
    id: 'school',
    title: '교실에 불이 켜져요',
    line: '우리가 만든 전기로 불을 켜고 선풍기를 돌려요. 남으면 바깥 전기망으로 보내요.',
    at: { x: 584, y: 10, tail: 'bottom', tailAt: 150 },
    readout: (stats) => ({
      label: '4인 가구로 치면',
      value: kwhToHouseholdDays(stats.todayKwh),
      unit: '가구가 하루 쓸 양',
      fractionDigits: 0,
    }),
  },
];

// ── 2장. 무엇이 좋아졌나 ───────────────────────────────────

/** 에어컨이 쓰는 힘(W). 오늘 만든 전기를 이 값으로 나누면 켜 둘 수 있는 시간이 나온다 */
export const AIRCON_WATT = 1500;

/** 2장에서 한 번에 하나씩 보여 주는 항목 */
export type ImpactItemId = 'tree' | 'gadget' | 'house';

export interface EduImpactItem {
  id: ImpactItemId;
  /** 큰 글씨 한 줄 */
  title: string;
  /** 그 아래 설명 한 줄 */
  line: string;
  /** 말풍선이 설 자리 (그림 좌표계 900×360) */
  at: { x: number; y: number; tail: 'bottom'; tailAt: number };
  /** 없으면 그림과 글만 보여 준다 */
  readout?: (stats: EduStats) => SceneReadout;
}

export interface ElementaryImpact {
  items: EduImpactItem[];
}

/*
  셋을 한 화면에 늘어놓으면 눈이 갈 곳이 셋이라 어느 것도 제대로 읽히지 않는다.
  하나씩 크게 보여 주고 넘기면 아이가 그때그때 한 가지만 보면 된다.
*/
const IMPACT: ElementaryImpact = {
  items: [
    {
      id: 'tree',
      title: '소나무를 이만큼 심은 것과 같은 효과예요',
      line: '우리가 만든 만큼 화력발전소가 덜 돌아서, 그만큼 탄소가 덜 나왔어요.',
      at: { x: 52, y: 6, tail: 'bottom', tailAt: 125 },
      readout: (stats) => ({
        label: '소나무로 환산하면',
        value: kwhToTrees(stats.dayKwh),
        unit: '그루',
        fractionDigits: 0,
      }),
    },
    {
      id: 'gadget',
      title: '에어컨을 이만큼 켤 수 있어요',
      line: '오늘 만든 전기로 에어컨 한 대만 계속 켠다면 이만큼 오래 쓸 수 있어요.',
      at: { x: 325, y: 40, tail: 'bottom', tailAt: 125 },
      readout: (stats) => ({
        label: '에어컨 가동 시간',
        // 에어컨 하나로 견준다. 여러 물건을 늘어놓으면 숫자가 셋이 되어 크기를 가늠하기 어렵다.
        value: (stats.dayKwh * 1000) / AIRCON_WATT,
        unit: '시간',
        fractionDigits: 0,
      }),
    },
    {
      id: 'house',
      title: '한 가구가 이만큼 쓸 수 있어요',
      line: '4인 가구 한 곳이 하루에 쓰는 양으로 나눠 봤어요.',
      at: { x: 611, y: 24, tail: 'bottom', tailAt: 125 },
      readout: (stats) => ({
        label: '4인 가구 사용일수',
        value: kwhToHouseholdDays(stats.dayKwh),
        unit: '일',
        fractionDigits: 0,
      }),
    },
  ],
};

// ── 3장. 태양광은 왜 좋을까 ────────────────────────────────

/** 이점 하나를 그리는 그림 */
export type BenefitArt = 'free' | 'clean' | 'quiet' | 'roof';

export interface EduBenefit {
  id: string;
  art: BenefitArt;
  title: string;
  line: string;
  /** 말풍선이 설 자리 (그림 좌표계 900×360) */
  at: { x: number; y: number; tail: 'bottom'; tailAt: number };
}

const BENEFITS: EduBenefit[] = [
  {
    id: 'free',
    art: 'free',
    at: { x: 4, y: 4, tail: 'bottom', tailAt: 110 },
    title: '연료가 들지 않아요',
    line: '석탄이나 가스를 사 오지 않아도 돼요. 햇빛은 아침마다 저절로 찾아오니까요.',
  },
  {
    id: 'clean',
    art: 'clean',
    at: { x: 215, y: 4, tail: 'bottom', tailAt: 125 },
    title: '매연이 나오지 않아요',
    line: '무언가를 태우지 않으니 매연도, 온실가스도 나오지 않아요.',
  },
  {
    id: 'quiet',
    art: 'quiet',
    at: { x: 441, y: 4, tail: 'bottom', tailAt: 125 },
    title: '소리가 나지 않아요',
    line: '돌아가는 부품이 없어서 아주 조용해요. 수업하는 데 방해가 되지 않아요.',
  },
  {
    id: 'roof',
    art: 'roof',
    at: { x: 650, y: 4, tail: 'bottom', tailAt: 136 },
    title: '지붕만 있으면 돼요',
    line: '따로 땅을 마련하지 않아도 돼요. 우리 학교 지붕이 그대로 발전소가 되니까요.',
  },
];

export const ELEMENTARY_CONTENT: ElementaryContent = {
  level: 'elementary',
  emphasis: 'large',
  /*
    지표 이름은 중·고등과 똑같이 둔다.
    쉬운 말로 갈아 두면 그 값을 교과서나 다른 화면에서 다시 만났을 때 같은 것인 줄 알아보지
    못한다. 이름은 그대로 두고 아래 한 줄만 초등 말로 풀어 준다.
  */
  headline: {
    mainLabel: '실시간 출력',
    mainNote: () => '우리 학교가 한 번에 만들 수 있는 최대치의 이만큼을 지금 만들고 있어요',
    statIds: ['today', 'insolation', 'co2', 'irradiance', 'capacity'],
    copy: {
      today: {
        note: (stats) => `4인 가구 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}가구가 하루 쓸 양이에요`,
      },
      insolation: {
        note: () => '해가 가장 셀 때만 골라서 발전했다면 이만큼 걸렸을 시간이에요',
      },
      co2: {
        note: () => '우리가 만든 만큼 화력발전소가 덜 돌아서 줄어든 양이에요',
      },
      irradiance: {
        note: () => '맑은 날 한낮이 100점이에요',
      },
      capacity: {
        note: () => '우리 학교 설비가 한 번에 만들 수 있는 가장 많은 양이에요',
      },
    },
  },
  chapters: [
    { id: 'journey', label: '전기가 오는 길' },
    { id: 'impact', label: '무엇이 좋아졌나' },
    { id: 'benefit', label: '태양광의 좋은 점' },
  ],
  scenes: SCENES,
  impact: IMPACT,
  benefits: BENEFITS,
};
