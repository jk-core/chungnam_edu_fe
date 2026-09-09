import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber, scaleCount, scaleKoCount, scaleSi } from '@/utils/format';
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

  말을 한 겹 더 내렸다 (2026-09-04 회의). 넘겨 가며 읽는 판에 긴 글이 실리면 이 나이는 다 읽기 전에
  화면이 넘어간다 — 그래서 설명 줄을 **한 호흡으로 끊고** 걸음이 머무는 시간을 늘렸다.
  물건은 아이가 부르는 이름으로 바꿨다: 패널 → 태양전지, 햇빛 → 햇님.
*/

// ── 1장. 전기가 만들어지는 순서 ────────────────────────────

/**
 * 걸음 한 칸 곁에 붙는 수치 하나.
 *
 * 값의 이름은 `SiScale` 과 같은 `amount` 다 — kW·kWh 처럼 자릿수가 커지는 값은
 * `scaleSi` 가 돌려준 것을 그대로 펼쳐 넣으므로, 두 이름을 따로 두면 옮겨 담는 일만 생긴다.
 */
export interface SceneReadout {
  label: string;
  amount: number;
  unit: string;
  fractionDigits: number;
  /** 숫자에 바로 붙는 우리말 자릿이름 — `SiScale` 의 것을 그대로 받는다 */
  countSuffix?: string;
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
    title: '햇님이 떴어요',
    line: '햇님이 높이 뜰수록 전기를 더 많이 만들어요.',
    at: { x: 300, y: 24, tail: 'left' },
    readout: (stats) => ({
      label: '일사량',
      amount: (stats.irradianceNow / FULL_SUN_WM2) * 100,
      unit: '점',
      fractionDigits: 0,
    }),
  },
  {
    id: 'panel',
    title: '태양전지가 받아요',
    line: '지붕 위 태양전지에 햇님이 닿으면 전기가 만들어져요.',
    at: { x: 280, y: 70, tail: 'bottom', tailAt: 30 },
    // 도 전체를 합치면 kW 로는 자릿수가 커져 말풍선을 넘는다 — 단위를 올려 적는다
    readout: (stats) => ({ label: '실시간 출력', ...scaleSi(stats.outputKw, 'W') }),
  },
  {
    id: 'inverter',
    title: '쓸 수 있게 바꿔요',
    line: '인버터가 교실에서 쓸 수 있는 전기로 바꿔 줘요.',
    at: { x: 346, y: 46, tail: 'bottom', tailAt: 150 },
    readout: (stats) => ({ label: '금일 발전량', ...scaleSi(stats.todayKwh, 'Wh') }),
  },
  {
    id: 'school',
    title: '교실에 불이 켜져요',
    line: '우리가 만든 전기로 불을 켜고 선풍기를 돌려요.',
    at: { x: 584, y: 10, tail: 'bottom', tailAt: 150 },
    readout: (stats) => ({
      label: '4인 가족으로 치면',
      amount: kwhToHouseholdDays(stats.todayKwh),
      unit: '집이 하루 쓸 양',
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
      line: '그만큼 석탄과 가스를 덜 태웠어요.',
      at: { x: 52, y: 6, tail: 'bottom', tailAt: 125 },
      readout: (stats) => ({
        label: '소나무를 심은 효과',
        ...scaleKoCount(kwhToTrees(stats.totalKwh), '그루'),
        fractionDigits: 0,
      }),
    },
    {
      id: 'gadget',
      title: '에어컨을 이만큼 켤 수 있어요',
      line: '에어컨 한 대를 이만큼 오래 켤 수 있어요.',
      at: { x: 325, y: 40, tail: 'bottom', tailAt: 125 },
      // 에어컨 하나로 견준다. 여러 물건을 늘어놓으면 숫자가 셋이 되어 크기를 가늠하기 어렵다.
      readout: (stats) => ({ label: '에어컨 가동 시간', ...scaleCount((stats.totalKwh * 1000) / AIRCON_WATT, '시간') }),
    },
    {
      id: 'house',
      title: '한 집이 이만큼 쓸 수 있어요',
      line: '네 식구가 사는 집으로 세어 봤어요.',
      at: { x: 611, y: 24, tail: 'bottom', tailAt: 125 },
      readout: (stats) => ({ label: '4인 가족이 쓸 수 있는 기간', ...scaleCount(kwhToHouseholdDays(stats.totalKwh), '일') }),
    },
  ],
};

// ── 3장. 태양광은 왜 좋을까 ────────────────────────────────

/** 이점 하나를 그리는 그림 */
export type BenefitArt = 'free' | 'clean' | 'quiet';

export interface EduBenefit {
  id: string;
  art: BenefitArt;
  title: string;
  line: string;
  /** 말풍선이 설 자리 (그림 좌표계 900×360) */
  at: { x: number; y: number; tail: 'bottom'; tailAt: number };
}

/*
  셋만 둔다 (2026-09-04 회의).

  「지붕만 있으면 돼요」 는 뺐다 — 주차장에도 얹는 학교가 있어 말이 맞지 않는다.
  남은 셋은 모두 「없다」 는 이야기라 결이 같고, 넷을 셋으로 줄인 만큼 하나하나를 크게 세운다.
  제목은 아이가 그대로 따라 말할 수 있는 짧은 구어체로, 설명은 그 까닭 한 줄로 끊었다.
*/
const BENEFITS: EduBenefit[] = [
  {
    id: 'free',
    art: 'free',
    at: { x: 20, y: 4, tail: 'bottom', tailAt: 135 },
    title: '공짜예요',
    line: '햇님은 날마다 그냥 와요.',
  },
  {
    id: 'clean',
    art: 'clean',
    at: { x: 330, y: 4, tail: 'bottom', tailAt: 120 },
    title: '깨끗해요',
    line: '까만 연기가 나지 않아요.',
  },
  {
    id: 'quiet',
    art: 'quiet',
    at: { x: 630, y: 4, tail: 'bottom', tailAt: 115 },
    title: '조용해요',
    line: '시끄러운 소리가 안 나요.',
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
    mainNote: () => '우리 학교가 한 번에 만들 수 있는 양 가운데 지금 이만큼을 만들고 있어요',
    statIds: ['today', 'total', 'powerTime', 'co2', 'irradiance', 'capacity'],
    copy: {
      /*
        발전량 두 칸은 이름부터 아이 말로 바꾼다 (2026-09-04 회의).
        「금일/누적」 은 이 나이가 읽어도 뜻이 서지 않는 한자말이라, 이름 자리에 문장을 넣는다.
      */
      today: {
        label: '오늘 이만큼 만들었어요',
        note: (stats) => `4인 가족 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}집이 쓸 양`,
      },
      total: {
        label: '그동안 이만큼 만들었어요',
        note: () => '그동안 모두 더했어요',
      },
      powerTime: {
        note: () => '가장 센 힘이었다면',
      },
      co2: {
        note: () => '덜 태운 석탄·가스',
      },
      irradiance: {
        note: () => '맑은 날 한낮이 100점',
      },
      capacity: {
        note: () => '한 번에 만드는 최대량',
      },
    },
  },
  chapters: [
    { id: 'journey', label: '햇님이 전기가 되기까지' },
    { id: 'impact', label: '그동안 만든 전기로' },
    { id: 'benefit', label: '태양광이 좋은 까닭' },
  ],
  scenes: SCENES,
  impact: IMPACT,
  benefits: BENEFITS,
};
