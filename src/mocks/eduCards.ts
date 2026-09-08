import type { ImpactArtId } from '@/components/solar-edu/scene-art/ImpactArt';
import type { JourneyFocus } from '@/components/solar-edu/scene-art/JourneyScene';
import { ELEMENTARY_CONTENT } from './eduElementary';
import type { BenefitArt, ImpactItemId, SceneReadout } from './eduElementary';
import type { EduStats } from './solarEdu';

/*
  한 장씩 넘겨 읽는 판의 대본 — 중등 시안 c.

  초등 대본을 그대로 읽고 문구를 새로 적지 않는다. 같은 말을 두 곳에 두면 한쪽만 고쳐 놓고
  두 화면이 다른 말을 하게 된다. 이 파일이 하는 일은 초등 대본의 세 장(전기가 오는 길,
  오늘 만든 전기로, 태양광의 좋은 점)을 **한 장짜리 카드 줄로 펴 놓는 것**뿐이다.

  중등 화면인데 초등 대본을 읽는 것이 어긋나 보이지만, 눈높이를 한 칸씩 내리기로 한 결정에
  따른 것이다 (2026-08-31 지시). 어느 칸이 어느 대본을 읽는지는 `EDU_CELLS` 가 정한다.
*/

/** 카드 한 장에 세우는 그림 */
export type CardScene =
  /**
   * 햇빛에서 교실까지 이어지는 한 장.
   *
   * `step` 까지의 그림이 남는다. `focus` 를 주면 장면 전체가 아니라 그 걸음의 물건 둘레만
   * 잘라 보인다 — 넉 장을 나란히 세우는 판에서는 통짜 장면이 넉 장 모두 같은 그림이 된다.
   */
  | { kind: 'journey'; step: number; focus: JourneyFocus }
  /** 오늘 만든 전기로 무엇을 할 수 있나 — 셋 가운데 하나가 또렷해진다 */
  | { kind: 'impact'; focus: ImpactItemId }
  /** 태양광의 좋은 점 넷 — 하나가 또렷해진다 */
  | { kind: 'benefit'; focus: BenefitArt }
  /** 오늘 하루의 발전 곡선 */
  | { kind: 'curve' }
  /** 환산 한 가지를 그림 하나로 크게 */
  | { kind: 'art'; art: ImpactArtId };

/** 카드가 속한 이야기 묶음 */
export type CardSection = 'journey' | 'impact' | 'benefit';

export const CARD_SECTIONS: { id: CardSection; label: string }[] = [
  { id: 'journey', label: '전기가 오는 길' },
  { id: 'impact', label: '그동안 만든 전기로' },
  { id: 'benefit', label: '태양광이 좋은 까닭' },
];

/** 넘겨 읽는 한 장 */
export interface EduCard {
  id: string;
  /**
   * 어느 묶음의 장인지.
   *
   * 열한 장을 평평하게 이어 넘기면 지금 무슨 이야기를 하는 중인지가 사라진다 (2026-09-04 노트).
   * 묶음을 달아 두면 화면이 그 이름을 띄우고 아래 눈금도 묶음별로 갈라 보일 수 있다.
   */
  section: CardSection;
  scene: CardScene;
  /** 큰 글씨 한 줄 */
  title: string;
  /** 그 아래 설명 한 줄 */
  line: string;
  /** 없으면 그림과 글만 보여 준다 */
  readout?: (stats: EduStats) => SceneReadout;
}

/*
  중등이 읽을 말 (2026-09-07 지시).

  자리와 수치는 초등 대본의 것을 그대로 쓰되 **문장만** 이 눈높이로 갈아 끼운다. 「햇님」 은
  「해」 로, 「태양전지」 는 「태양전지판」 으로 — 회의에서 중등부터는 정식 용어를 쓰기로 했고
  (2026-09-04), 이 나이에 「햇님」 은 낮춰 부르는 말로 읽힌다.

  설명도 한 걸음 더 들어간다. 초등 쪽은 무슨 일이 일어나는지만 말하면 되지만, 이 나이는
  **왜 그런지**를 함께 받아야 다음 걸음과 이어진다 — 「해가 높으면 많이 만든다」 에서 그치지 않고
  빛이 똑바로 닿는다는 까닭까지 적는다.
*/
const MIDDLE_JOURNEY: Record<string, { title: string; line: string }> = {
  sun: {
    title: '해가 떴어요',
    line: '해가 높이 뜰수록 빛이 태양전지판에 똑바로 닿아 전기를 더 많이 만들어요.',
  },
  panel: {
    title: '태양전지판이 빛을 받아요',
    line: '지붕 위 태양전지판에 햇빛이 닿으면 그 자리에서 바로 전기가 만들어져요.',
  },
  inverter: {
    title: '쓸 수 있게 바꿔요',
    line: '태양전지판이 만든 전기는 그대로 쓸 수 없어요. 인버터가 교실 콘센트에서 쓰는 형태로 바꿔 줘요.',
  },
  school: {
    title: '교실에 불이 켜져요',
    line: '바뀐 전기가 전선을 타고 교실로 와서 불을 켜고 선풍기를 돌려요.',
  },
};

/*
  좋은 까닭 셋 — 까닭까지 적는다 (2026-09-07 지시).

  「공짜예요 · 햇님은 돈을 받지 않아요」 는 초등의 말이다. 이 나이에는 왜 공짜인지, 왜 깨끗한지가
  한 겹 더 있어야 한다 — 연료를 사 오지 않는다는 것, 태우는 것이 없다는 것, 돌아가는 부품이
  없다는 것이 각각의 진짜 까닭이고, 그것이 태양광과 다른 발전을 가르는 지점이기도 하다.
*/
const MIDDLE_BENEFIT: Record<BenefitArt, { title: string; line: string }> = {
  free: {
    title: '연료가 들지 않아요',
    line: '햇빛은 날마다 그냥 오니까 사 올 것이 없어요. 발전소를 돌리는 데 드는 연료비가 0원이에요.',
  },
  clean: {
    title: '공기를 더럽히지 않아요',
    line: '태우는 것이 없으니 매연도 재도 나오지 않아요. 석탄이나 가스로 만들 때와 가장 크게 다른 점이에요.',
  },
  quiet: {
    title: '소리가 나지 않아요',
    line: '돌아가는 부품이 없어서 발전기처럼 윙윙거리지 않아요. 그래서 학교 지붕 위에 둘 수 있어요.',
  },
};

export const EDU_CARDS: EduCard[] = [
  ...ELEMENTARY_CONTENT.scenes.map((scene, index): EduCard => ({
    id: scene.id,
    section: 'journey',
    scene: { kind: 'journey', step: index, focus: scene.id as JourneyFocus },
    ...(MIDDLE_JOURNEY[scene.id] ?? { title: scene.title, line: scene.line }),
    readout: scene.readout,
  })),
  ...ELEMENTARY_CONTENT.impact.items.map((item): EduCard => ({
    id: item.id,
    section: 'impact',
    scene: { kind: 'impact', focus: item.id },
    title: item.title,
    line: item.line,
    readout: item.readout,
  })),
  ...ELEMENTARY_CONTENT.benefits.map((benefit): EduCard => ({
    id: benefit.id,
    section: 'benefit',
    scene: { kind: 'benefit', focus: benefit.art },
    ...(MIDDLE_BENEFIT[benefit.art] ?? { title: benefit.title, line: benefit.line }),
  })),
];
