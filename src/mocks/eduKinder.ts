import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { AIRCON_WATT } from './eduElementary';
import type { KinderContent } from './eduContent';
import type { EduStats } from './solarEdu';

/*
  유치원 판 대본 (SFR-005-01/03/04/05/06/07/08).

  다른 세 눈높이는 같은 문장을 쉬운 말로 갈아 끼우는 사이다. 유치원은 그 방식이 통하지 않는다 —
  글을 아직 못 읽는 아이에게 쉬운 문장을 주는 것은 어려운 문장을 주는 것과 다르지 않다.
  그래서 문장을 짧게 끊고 **그림을 본문으로 세운다**. 글은 그림에 붙는 이름표다.

  다만 보여 주는 **내용**까지 줄이지는 않는다. 처음에 두 글자짜리 한 마디만 남겼더니 화면이
  알려 주는 것이 아무것도 없어져, 걸어 두는 화면의 목적(태양광을 설명하는 것)이 사라졌다.
  초등 판이 말하는 세 가지 — 전기가 오는 길, 무엇이 좋아졌나, 태양광은 왜 좋은가 — 를 그대로
  말하되, 문장 두 줄을 그림 하나와 이름 두 글자와 짧은 한 줄로 바꾼다.

  숫자는 남긴다. 숫자는 글이 아니고, 이 나이가 배우고 있는 것이기도 하다. 다만 단위를 물리량
  그대로 두지 않고(kWh) 셀 수 있는 것으로 바꾼다 — 그루, 시간, 일.
*/

// ── 1장. 전기가 오는 길 ────────────────────────────────────

/** 한 장면에 서는 그림 — 그림 부품 이름이자 장면 이름이다 */
export type KinderArt = 'sun' | 'panel' | 'wire' | 'class';

export interface KinderScene {
  id: KinderArt;
  /** 그림 곁에 크게 뜨는 한 마디. 두세 글자를 넘기지 않는다 */
  word: string;
  /** 그 아래 한 줄. 선생님이 읽어 주는 것을 셈에 넣어 한 호흡에 끝나는 길이로 끊는다 */
  line: string;
}

const SCENES: KinderScene[] = [
  { id: 'sun', word: '해님', line: '해님이 우리 학교 지붕을 비춰요' },
  { id: 'panel', word: '반짝', line: '지붕에 있는 판이 햇빛을 받아요' },
  { id: 'wire', word: '슝—', line: '만든 전기가 교실로 내려가요' },
  { id: 'class', word: '짠!', line: '교실에 불이 켜졌어요' },
];

// ── 2장. 무엇이 좋아졌나 ───────────────────────────────────

/** 오늘 만든 전기를 바꿔 세어 보는 것들 */
export type KinderGiftArt = 'tree' | 'aircon' | 'house';

export interface KinderGift {
  id: KinderGiftArt;
  /** 그림의 이름 */
  name: string;
  line: string;
  unit: string;
  value: (stats: EduStats) => number;
}

/*
  셋 다 「오늘 하루」 를 기준으로 센다.

  지금까지 만든 양(todayKwh)으로 세면 아침에 본 아이와 하교할 때 본 아이가 다른 수를 보는데,
  그 차이를 이 나이는 「아까는 틀렸었나?」 로 읽는다. 하루치로 고정해 두면 오늘의 값은 오늘 내내 같다.
*/
const GIFTS: KinderGift[] = [
  {
    id: 'tree',
    name: '나무',
    line: '나무를 이만큼 심은 것과 같아요',
    unit: '그루',
    value: (stats) => kwhToTrees(stats.dayKwh),
  },
  {
    id: 'aircon',
    name: '에어컨',
    line: '에어컨을 이만큼 켤 수 있어요',
    unit: '시간',
    value: (stats) => (stats.dayKwh * 1000) / AIRCON_WATT,
  },
  {
    id: 'house',
    name: '우리 집',
    line: '한 집이 이만큼 쓸 수 있어요',
    unit: '일',
    value: (stats) => kwhToHouseholdDays(stats.dayKwh),
  },
];

// ── 3장. 태양광은 왜 좋을까 ────────────────────────────────

export type KinderGoodArt = 'free' | 'clean' | 'quiet' | 'roof';

export interface KinderGood {
  id: KinderGoodArt;
  name: string;
  line: string;
}

/*
  넷 가운데 셋이 「없다」 는 이야기다 — 돈이 안 들고, 연기가 안 나고, 소리가 안 난다.
  그림에서도 셋 다 가위표를 쓴다. 기호를 섞지 않고 하나로 밀어야 이 나이가 그것을 규칙으로 읽고,
  가위표가 없는 넷째(지붕)가 그래서 눈에 걸린다.
*/
const GOODS: KinderGood[] = [
  { id: 'free', name: '공짜', line: '해님은 날마다 그냥 와요' },
  { id: 'clean', name: '깨끗', line: '까만 연기가 나지 않아요' },
  { id: 'quiet', name: '조용', line: '시끄러운 소리가 안 나요' },
  { id: 'roof', name: '지붕', line: '우리 학교 지붕에 그냥 놓아요' },
];

/*
  장 이름.

  못 읽는 아이를 위한 화면이지만 이 세 줄은 남긴다 — 옆에 선 선생님과 화면 앞을 지나는 어른이
  「지금 무슨 이야기를 하는 중인지」 를 알아야 아이에게 말을 붙일 수 있다. 화면은 아이만 보지 않는다.
*/
export const KINDER_CONTENT: KinderContent = {
  level: 'kinder',
  emphasis: 'large',
  chapters: [
    { id: 'journey', label: '전기가 오는 길' },
    { id: 'gift', label: '이만큼 할 수 있어요' },
    { id: 'good', label: '태양광은 좋아요' },
  ],
  scenes: SCENES,
  gifts: GIFTS,
  goods: GOODS,
};
