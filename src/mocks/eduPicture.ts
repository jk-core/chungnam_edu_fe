import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { AIRCON_WATT } from './eduElementary';
import type { EduStats } from './solarEdu';

/*
  그림이 본문인 판의 대본 (SFR-005-01/03/04/05/06/07/08).

  초등 시안 b·c 가 이것을 읽는다. 두 시안은 문장을 늘어놓는 대신 그림을 크게 세우고 글은 그림에
  붙는 이름표로만 쓰는데, 그러자면 대본도 그 모양이어야 한다 — 문단이 아니라 「이름 한 마디와
  한 호흡짜리 한 줄」의 묶음이다. 그래서 `EduContent` 유니온에 넣지 않고 형식을 따로 둔다.
  유니온은 눈높이를 가르지만 이쪽이 가르는 것은 눈높이가 아니라 **말하는 방식**이다.

  문장은 초등 눈높이다. 이 두 판은 원래 글을 못 읽는 눈높이를 겨냥해 그려진 것이라 대본도
  거기에 맞춰져 있었는데(「해님」, 「슝—」), 그대로 초등에 걸면 그림만 좋고 말은 유치해진다.
  그림의 크기와 한 줄이라는 형식은 그대로 두고 문장만 한 칸 올렸다 — 사물은 제 이름으로 부르고
  (해님 → 햇빛, 판 → 발전판), 서술은 「~해요」 대신 평서형으로 적는다.

  숫자는 남긴다. 다만 단위를 물리량 그대로(kWh) 두지 않고 셀 수 있는 것으로 바꾼다 — 그루, 시간, 일.
*/

// ── 1장. 전기가 오는 길 ────────────────────────────────────

/** 한 장면에 서는 그림 — 그림 부품 이름이자 장면 이름이다 */
export type PictureSceneId = 'sun' | 'panel' | 'wire' | 'class';

export interface PictureScene {
  id: PictureSceneId;
  /** 그림 곁에 크게 뜨는 이름. 그림과 나란히 서므로 세 글자 안팎으로 끊는다 */
  word: string;
  /** 그 아래 한 줄. 소리 내어 읽었을 때 한 호흡에 끝나는 길이로 끊는다 */
  line: string;
}

/*
  네 걸음의 이름은 그림에 그려진 **물건**을 부른다.

  「발전 · 이동 · 사용」처럼 하는 일로 부르는 편이 흐름은 또렷하지만, 그러면 이름과 그림이 서로
  다른 것을 가리켜 아이가 둘을 맞춰 보아야 한다. 물건 이름을 쓰면 이름과 그림이 한 번에 붙고,
  하는 일은 아래 한 줄이 말한다.
*/
const SCENES: PictureScene[] = [
  { id: 'sun', word: '햇빛', line: '햇빛이 우리 학교 지붕을 비춘다' },
  { id: 'panel', word: '발전판', line: '지붕에 놓인 판이 햇빛을 받아 전기를 만든다' },
  { id: 'wire', word: '전선', line: '만들어진 전기가 전선을 타고 교실로 내려온다' },
  { id: 'class', word: '교실', line: '교실의 불과 기기가 그 전기로 움직인다' },
];

// ── 2장. 오늘 만든 전기로 ──────────────────────────────────

/** 오늘 만든 전기를 바꿔 세어 보는 것들 */
export type PictureGiftId = 'tree' | 'aircon' | 'house';

export interface PictureGift {
  id: PictureGiftId;
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
const GIFTS: PictureGift[] = [
  {
    id: 'tree',
    name: '나무',
    line: '나무를 이만큼 심은 것과 같다',
    unit: '그루',
    value: (stats) => kwhToTrees(stats.dayKwh),
  },
  {
    id: 'aircon',
    name: '에어컨',
    line: '에어컨을 이만큼 켤 수 있다',
    unit: '시간',
    value: (stats) => (stats.dayKwh * 1000) / AIRCON_WATT,
  },
  {
    id: 'house',
    name: '한 집',
    line: '네 식구가 사는 집이 이만큼 쓸 수 있다',
    unit: '일',
    value: (stats) => kwhToHouseholdDays(stats.dayKwh),
  },
];

// ── 3장. 태양광이 좋은 까닭 ────────────────────────────────

export type PictureGoodId = 'free' | 'clean' | 'quiet' | 'roof';

export interface PictureGood {
  id: PictureGoodId;
  name: string;
  line: string;
}

/*
  넷 가운데 셋이 「없다」 는 이야기다 — 연료를 사지 않고, 연기가 나지 않고, 소리가 나지 않는다.
  그림에서도 셋 다 가위표를 쓴다. 기호를 섞지 않고 하나로 밀어야 그것이 규칙으로 읽히고,
  가위표가 없는 넷째(지붕)가 그래서 눈에 걸린다.
*/
const GOODS: PictureGood[] = [
  { id: 'free', name: '무료', line: '햇빛은 날마다 오고 값을 치르지 않는다' },
  { id: 'clean', name: '깨끗', line: '태울 것이 없어 연기가 나지 않는다' },
  { id: 'quiet', name: '조용', line: '돌아가는 부품이 없어 소리가 나지 않는다' },
  { id: 'roof', name: '지붕', line: '땅을 따로 쓰지 않고 지붕 위에 놓는다' },
];

/**
 * 그림 판이 읽는 대본 한 벌.
 *
 * 장 이름 세 줄은 시안 b 가 걸음을 나누는 데 쓰고, 시안 c 는 세 자리의 머리글로 쓴다.
 */
export interface PictureContent {
  /** 세 장의 이름 */
  chapters: { id: string; label: string }[];
  /** 1장 — 전기가 오는 길 */
  scenes: PictureScene[];
  /** 2장 — 오늘 만든 전기로 무엇을 할 수 있나 */
  gifts: PictureGift[];
  /** 3장 — 태양광은 왜 좋은가 */
  goods: PictureGood[];
}

export const ELEMENTARY_PICTURE: PictureContent = {
  chapters: [
    { id: 'journey', label: '전기가 오는 길' },
    { id: 'gift', label: '오늘 만든 전기로' },
    { id: 'good', label: '태양광이 좋은 까닭' },
  ],
  scenes: SCENES,
  gifts: GIFTS,
  goods: GOODS,
};
