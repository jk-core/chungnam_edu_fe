import type { ImpactArtId } from '@/components/solar-edu/scene-art/ImpactArt';
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

export const EDU_CARDS: EduCard[] = [
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
