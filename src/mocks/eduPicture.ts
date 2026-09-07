import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { scaleCount, scaleKoCount } from '@/utils/format';
import type { SiScale } from '@/utils/format';
import { AIRCON_WATT } from './eduElementary';
import type { EduStats } from './solarEdu';

/*
  그림이 본문인 판의 대본 (SFR-005-01/03/04/05/06/07/08).

  초등 시안 b·c 가 이것을 읽는다. 두 시안은 문장을 늘어놓는 대신 그림을 크게 세우고 글은 그림에
  붙는 이름표로만 쓰는데, 그러자면 대본도 그 모양이어야 한다 — 문단이 아니라 「이름 한 마디와
  한 호흡짜리 한 줄」의 묶음이다. 그래서 `EduContent` 유니온에 넣지 않고 형식을 따로 둔다.
  유니온은 눈높이를 가르지만 이쪽이 가르는 것은 눈높이가 아니라 **말하는 방식**이다.

  문장은 초등 눈높이다. 그림의 크기와 한 줄이라는 형식은 그대로 두고 말만 이 나이에 맞춘다 —
  물건은 아이가 부르는 이름으로(햇님, 태양전지), 서술은 「~해요」 로 적는다 (2026-09-04 회의).
  한자말은 피한다. 「무료」 보다 「공짜」 가, 「매연」 보다 「연기」 가 먼저 읽힌다.

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
  { id: 'sun', word: '햇님', line: '햇님이 우리 학교 지붕을 비춰요' },
  { id: 'panel', word: '태양전지', line: '지붕 위 태양전지가 햇님을 받아 전기를 만들어요' },
  { id: 'wire', word: '전선', line: '만들어진 전기가 전선을 타고 교실로 내려와요' },
  { id: 'class', word: '교실', line: '그 전기로 교실에 불이 켜져요' },
];

// ── 2장. 그동안 만든 전기로 ────────────────────────────────

/** 그동안 만든 전기를 바꿔 세어 보는 것들 */
export type PictureGiftId = 'tree' | 'aircon' | 'house';

export interface PictureGift {
  id: PictureGiftId;
  /** 그림의 이름 */
  name: string;
  line: string;
  /** 값과 단위를 함께 낸다 — 누적으로 세면 날수·시간수가 커져 단위를 올려야 한다 */
  value: (stats: EduStats) => SiScale;
}

/*
  셋 다 「설치 이후 총계」 를 기준으로 센다 (2026-09-04 회의).

  하루치로 세면 인버터가 멎거나 통신이 끊긴 날 석 장이 모두 0 이 되는데, 걸어 두는 화면에서
  그것은 「오늘은 적었구나」 가 아니라 「고장 났구나」 로 읽힌다. 쌓인 값은 그런 날에도 남아 있고,
  수치가 커서 아이가 세어 보고 싶어지기도 한다.
*/
const GIFTS: PictureGift[] = [
  {
    id: 'tree',
    name: '나무',
    line: '그만큼 나무를 심은 것과 같아요',
    // 그루에는 올릴 윗단위가 없다 — 대신 우리말이 네 자리마다 갈아 끼우는 이름을 쓴다
    value: (stats) => scaleKoCount(kwhToTrees(stats.totalKwh), '그루'),
  },
  {
    id: 'aircon',
    name: '에어컨',
    line: '에어컨을 이만큼 켤 수 있어요',
    value: (stats) => scaleCount((stats.totalKwh * 1000) / AIRCON_WATT, '시간'),
  },
  {
    id: 'house',
    name: '우리 집',
    line: '집 한 채가 이만큼 쓸 수 있어요',
    value: (stats) => scaleCount(kwhToHouseholdDays(stats.totalKwh), '일'),
  },
];

// ── 3장. 태양광이 좋은 까닭 ────────────────────────────────

export type PictureGoodId = 'free' | 'clean' | 'quiet';

export interface PictureGood {
  id: PictureGoodId;
  /**
   * 문장 한 마디 — 그림 곁에 이것만 두는 판이 쓴다.
   *
   * 「공짜」 처럼 명사만 두었다가 문장으로 바꿨다 (2026-09-04 지시) — 이 나이는 명사를 보면
   * 그것이 무엇을 말하는지 한 번 더 생각해야 하지만, 「공짜예요」 는 그대로 따라 말하면 된다.
   */
  name: string;
  /**
   * 한 단어 — 자리가 넉넉해 이름을 크게 세우는 판이 쓴다.
   *
   * 같은 것을 두 가지로 적어 두는 까닭은 판마다 쓸 수 있는 자리가 다르기 때문이다. 아래를
   * 가로지르는 좁은 띠에는 문장 하나가 맞고, 화면의 사분의 일을 쓰는 칸에는 단어를 크게
   * 세우고 까닭을 붙이는 편이 읽힌다.
   */
  word: string;
  /**
   * 왜 그런지 한 줄.
   *
   * 이름만 두면 「조용해요」 가 그저 표어로 읽힌다 — 왜 조용한지를 붙여야 아이가 「아, 돌아가는
   * 게 없구나」 를 가져간다. 이름과 겹쳐 말하지 않는 것이 규칙이다: 「조용해요 · 시끄러운 소리가
   * 안 나요」 는 같은 말을 두 번 한 것이라, 까닭을 말하는 쪽으로 고쳤다 (2026-09-07 지시).
   */
  line: string;
}

/*
  셋만 둔다 (2026-09-04 회의).

  「지붕」 은 뺐다 — 주차장에도 얹는 학교가 있어 말이 맞지 않는다. 남은 셋은 모두 「없다」 는
  이야기라 결이 같고, 그림에서도 셋 다 같은 가위표를 쓴다. 기호를 섞지 않고 하나로 밀어야
  그것이 규칙으로 읽힌다.

  셋을 각자 칸에 넣지 않고 한 칸에 모은다 — 「공짜예요, 깨끗해요, 조용해요」 가 이어 읽히면
  세 가지가 아니라 **한 가지 이야기**가 된다.
*/
const GOODS: PictureGood[] = [
  { id: 'free', name: '공짜예요', word: '공짜', line: '햇님은 돈을 받지 않아요' },
  { id: 'clean', name: '깨끗해요', word: '깨끗', line: '까만 연기가 나지 않아요' },
  { id: 'quiet', name: '조용해요', word: '조용', line: '돌아가는 소리가 없어요' },
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
  /** 2장 — 그동안 만든 전기로 무엇을 할 수 있나 */
  gifts: PictureGift[];
  /** 3장 — 태양광은 왜 좋은가 */
  goods: PictureGood[];
}

export const ELEMENTARY_PICTURE: PictureContent = {
  chapters: [
    { id: 'journey', label: '햇님이 전기가 되기까지' },
    { id: 'gift', label: '그동안 만든 전기로' },
    { id: 'good', label: '태양광이 좋은 까닭' },
  ],
  scenes: SCENES,
  gifts: GIFTS,
  goods: GOODS,
};
