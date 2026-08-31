import { formatEnergy, scaleSi } from '@/utils/format';
import type { EduLevel } from '@/interface/edu';
import type { ImpactArtId } from '@/components/solar-edu/scene-art/ImpactArt';
import { ELEMENTARY_CONTENT } from './eduElementary';
import { FULL_SUN_WM2 } from './solarEdu';
import { IMPACT_DEFS, impactFigure } from './eduContent';
import { MIDDLE_CONTENT } from './eduMiddle';
import type { BenefitArt, ImpactItemId, SceneReadout } from './eduElementary';
import type { EduStats } from './solarEdu';
import type { HeadlineContent, ImpactId } from './eduContent';
import type { MiddlePrincipleContent } from './eduMiddle';

/*
  시안 C 대본.

  눈높이는 다른 시안보다 한 칸씩 낮다 (2026-08-31 지시).
  초등은 지금과 같고, 중등은 지금보다 한 겹 더 쉬우며, 고등은 지금 중등 수준이다.

  그래서 대본을 새로 한 벌 다 쓰지 않는다 — 초등은 초등 대본을, 고등은 중등 대본을 그대로
  읽고, 여기서 새로 적는 것은 가운데 한 칸(중등)뿐이다. 문구를 두 벌로 두면 다음에 말을
  고칠 때 두 곳을 고쳐야 하는데, 실제로 갈려야 하는 자리는 하나다.

  판은 학교급에 따라 둘로 갈린다.

  **초등은 한 장씩 넘겨 읽는다.** 한 번에 한 장만 세운다 — 왼쪽에 그림, 오른쪽에 큰 글씨
  한 줄과 수치 하나. 읽을 곳이 하나면 눈이 헤매지 않는다.

  **중·고등은 여러 칸을 한 화면에 둔다.** 초등처럼 한 장씩 넘기면 앞뒤를 견줄 수 없고,
  이 나이에는 곡선과 환산을 나란히 놓고 보는 편이 낫다 (2026-08-31 지시). 시안 A 와 같은
  구성을 쓰되 **칸을 덜어내고 남은 칸을 키운다** — 여섯 칸을 세 칸으로 줄이고, 읽는 법을
  둘에서 하나로, 환산을 넉 장에서 석 장으로 줄인 자리에 글씨와 그림이 들어선다.
*/

/** 카드 한 장에 세우는 그림 */
export type CardScene =
  /** 햇빛에서 교실까지 이어지는 한 장 — `step` 까지의 그림이 남는다 */
  | { kind: 'journey'; step: number }
  /** 오늘 만든 전기로 무엇을 할 수 있나 — 셋 가운데 하나가 또렷해진다 */
  | { kind: 'impact'; focus: ImpactItemId }
  /** 태양광의 좋은 점 넷 — 하나가 또렷해진다 */
  | { kind: 'benefit'; focus: BenefitArt }
  /** 오늘 하루의 발전 곡선 */
  | { kind: 'curve' }
  /** 환산 한 가지를 그림 하나로 크게 */
  | { kind: 'art'; art: ImpactArtId };

/** 넘겨 읽는 한 장 */
export interface EduCard {
  id: string;
  scene: CardScene;
  /** 큰 글씨 한 줄 */
  title: string;
  /** 그 아래 설명 한 줄 */
  line: string;
  /** 없으면 그림과 글만 보여 준다 */
  readout?: (stats: EduStats) => SceneReadout;
}

export interface EduDeck {
  /** 위쪽 요약 띠도 이 판의 눈높이를 따른다 */
  headline: HeadlineContent;
  cards: EduCard[];
}

/*
  환산 카드 한 장.
  값과 단위는 환산 레지스트리에서 끌어온다 — 계수를 여기 다시 적으면 두 곳이 갈린다.
*/
function impactCard(id: ImpactId, art: ImpactArtId, title: string, line: string): EduCard {
  const def = IMPACT_DEFS[id];

  return {
    id,
    scene: { kind: 'art', art },
    title,
    line,
    readout: (stats) => ({ label: def.label, ...impactFigure(def, stats.dayKwh) }),
  };
}

/** 계통 네 자리에서 그때그때 읽히는 값 */
const STAGE_READOUT: Record<string, (stats: EduStats) => SceneReadout> = {
  sun: (stats) => ({
    label: '일사강도',
    amount: (stats.irradianceNow / FULL_SUN_WM2) * 100,
    unit: '점',
    fractionDigits: 0,
  }),
  cell: (stats) => ({ label: '실시간 출력', ...scaleSi(stats.outputKw, 'W') }),
  inverter: (stats) => ({ label: '실시간 출력', ...scaleSi(stats.outputKw, 'W') }),
  school: (stats) => ({ label: '금일 발전량', ...scaleSi(stats.todayKwh, 'Wh') }),
};

// ── 초등 — 지금 초등 판과 같은 눈높이 ──────────────────────
/*
  문구를 옮겨 적지 않고 초등 대본을 그대로 읽는다.
  같은 말을 두 곳에 두면 한쪽만 고쳐 놓고 두 화면이 다른 말을 하게 된다.
*/
const ELEMENTARY_CARDS: EduCard[] = [
  ...ELEMENTARY_CONTENT.scenes.map((scene, index): EduCard => ({
    id: scene.id,
    scene: { kind: 'journey', step: index },
    title: scene.title,
    line: scene.line,
    readout: scene.readout,
  })),
  ...ELEMENTARY_CONTENT.impact.items.map((item): EduCard => ({
    id: item.id,
    scene: { kind: 'impact', focus: item.id },
    title: item.title,
    line: item.line,
    readout: item.readout,
  })),
  ...ELEMENTARY_CONTENT.benefits.map((benefit): EduCard => ({
    id: benefit.id,
    scene: { kind: 'benefit', focus: benefit.art },
    title: benefit.title,
    line: benefit.line,
  })),
];

// ── 중등 — 지금 중등보다 한 겹 더 쉽게 ─────────────────────
/*
  여기만 새로 적는다.

  덜어낸 것은 **한 겹 더 파고드는 말**이다 — 직류·교류가 무엇이 다른지, 빛이 좁은 자리에
  모인다는 것이 왜 세기를 키우는지. 그 자리를 「그래서 어떻게 되는가」 한 문장으로 대신한다.
  문체는 서술체 그대로다. 쉬워지는 것은 문장이지 말투가 아니다.
*/
const MIDDLE_CARDS: EduCard[] = [
  {
    id: 'sun',
    scene: { kind: 'journey', step: 0 },
    title: '햇빛이 지붕에 닿는다',
    line: '해가 높이 뜰수록 햇빛이 지붕에 똑바로 내리쬔다. 그만큼 전기도 많이 만들어진다.',
    readout: STAGE_READOUT.sun,
  },
  {
    id: 'cell',
    scene: { kind: 'journey', step: 1 },
    title: '태양전지가 전기를 만든다',
    line: '지붕에 깔린 판이 태양전지다. 햇빛이 닿는 동안 계속 전기가 만들어진다.',
    readout: (stats) => ({ label: '실시간 출력', ...scaleSi(stats.outputKw, 'W') }),
  },
  {
    id: 'inverter',
    scene: { kind: 'journey', step: 2 },
    title: '인버터가 쓸 수 있게 바꾼다',
    line: '태양전지가 만든 전기는 교실에서 그대로 쓸 수 없다. 인버터가 쓸 수 있는 전기로 바꿔 준다.',
  },
  {
    id: 'school',
    scene: { kind: 'journey', step: 3 },
    title: '학교가 그대로 쓴다',
    line: '만든 전기는 학교가 바로 쓴다. 그만큼 밖에서 사 오는 전기가 줄어든다.',
    readout: (stats) => ({ label: '금일 발전량', ...scaleSi(stats.todayKwh, 'Wh') }),
  },
  {
    id: 'curve',
    scene: { kind: 'curve' },
    title: '오늘은 이렇게 만들었다',
    line: '해가 높이 뜬 한낮에 가장 많이 만든다. 색이 칠해진 면적이 오늘 만든 전기다.',
    readout: (stats) => ({ label: '하루 합계', ...scaleSi(stats.dayKwh, 'Wh') }),
  },
  impactCard('tree', 'tree', '소나무를 심은 것과 같다', '줄어든 탄소를 소나무 한 그루가 1년에 흡수하는 양으로 나눈 값이다.'),
  impactCard('household', 'house', '한 집이 며칠 쓸 수 있다', '4인 가구 한 집이 하루에 쓰는 양으로 나눠 본 값이다.'),
  impactCard('led', 'lamp', '교실 조명을 이만큼 켤 수 있다', '교실 조명 하나를 쉬지 않고 켜 둘 수 있는 시간이다.'),
];

/*
  중등 요약 띠.

  본문을 한 겹 낮춘 만큼 위 띠도 같이 낮춘다. 다만 다섯 줄을 다시 쓰지는 않는다 —
  지금 중등 문구 가운데 아직 한 번 더 생각해야 읽히는 두 줄만 갈아 끼운다.
*/
const MIDDLE_HEADLINE: HeadlineContent = {
  ...MIDDLE_CONTENT.headline,
  copy: {
    ...MIDDLE_CONTENT.headline.copy,
    insolation: { note: () => '가장 센 힘으로만 만들었다면 이만큼 걸렸을 시간이다' },
    irradiance: { note: () => '맑은 날 한낮의 햇빛이 100점이다' },
  },
};

// ── 중·고등 — 여러 칸을 한 화면에, 다만 넓게 ────────────────

/** 넓게 편 세 칸 */
export interface RoomyScript {
  headline: HeadlineContent;
  /** 왼쪽 위 — 계통 네 단계. 한 단계씩 스스로 넘어간다 */
  principle: MiddlePrincipleContent;
  /** 왼쪽 아래 — 오늘의 곡선. 읽는 법은 **한 줄만** 붙인다 */
  production: { head: string; note: (stats: EduStats) => string; read: string };
  /** 오른쪽 — 환산 석 장 */
  benefit: { head: string; note: string; itemIds: ImpactId[]; arts: ImpactArtId[] };
}

/*
  중등 — 지금 중등보다 한 겹 더 쉽게.
  네 단계는 위 카드 대본과 같은 말을 쓴다. 한 시안 안에서 눈높이가 같은데 말이 갈리면
  화면을 옮길 때마다 다시 읽어야 한다.
*/
const MIDDLE_ROOMY: RoomyScript = {
  headline: MIDDLE_HEADLINE,
  principle: {
    head: '햇빛이 전기가 되기까지',
    note: '네 단계를 차례로 살펴본다',
    stages: MIDDLE_CARDS.slice(0, 4).map((card, index) => ({
      id: card.id,
      step: (index + 1) as 1 | 2 | 3 | 4,
      term: card.title,
      body: card.line,
    })),
  },
  production: {
    head: '오늘은 이렇게 만들었다',
    note: (stats) => `하루 합계 ${formatEnergy(stats.dayKwh).value}${formatEnergy(stats.dayKwh).unit}`,
    read: '해가 높이 뜬 한낮에 가장 많이 만든다. 색이 칠해진 면적이 오늘 만든 전기다.',
  },
  benefit: {
    head: '그래서 무엇이 좋아지는가',
    note: '오늘 만든 전기가 어느 정도인지 바꿔 보자',
    itemIds: ['tree', 'household', 'led'],
    arts: ['tree', 'house', 'lamp'],
  },
};

/* 고등 — 지금 중등 대본을 그대로 읽는다 */
const HIGH_ROOMY: RoomyScript = {
  headline: MIDDLE_CONTENT.headline,
  principle: MIDDLE_CONTENT.principle,
  production: {
    head: MIDDLE_CONTENT.production.head,
    note: MIDDLE_CONTENT.production.note,
    read: MIDDLE_CONTENT.production.notes[0].body,
  },
  benefit: {
    head: MIDDLE_CONTENT.benefit.head,
    note: MIDDLE_CONTENT.benefit.note,
    itemIds: ['co2', 'tree', 'led'],
    arts: ['co2', 'tree', 'lamp'],
  },
};

/** 초등이 읽는 카드 덱 */
export const EDU_DECK: EduDeck = { headline: ELEMENTARY_CONTENT.headline, cards: ELEMENTARY_CARDS };

/** 중·고등이 읽는 세 칸 */
export const EDU_ROOMY: Record<'middle' | 'high', RoomyScript> = {
  middle: MIDDLE_ROOMY,
  high: HIGH_ROOMY,
};

/** 위쪽 요약 띠 — 이 시안의 눈높이를 따른다 */
export const EDU_HEADLINE: Record<EduLevel, HeadlineContent> = {
  elementary: ELEMENTARY_CONTENT.headline,
  middle: MIDDLE_HEADLINE,
  high: MIDDLE_CONTENT.headline,
};
