import { formatNumber } from '@/utils/format';
import type { EduNote, ImpactCopy, ImpactId, MiddleContent } from './eduContent';
import type { EduStats } from './solarEdu';

/*
  중등 판 대본 (SFR-005-02/03/04).

  고등과 다루는 축은 같다 — 원리, 발전량, 이점. 다른 것은 다루는 방식이다.
  고등이 값을 재고 따지는 화면이라면 중등은 설명하는 화면이라, 어려운 말(PN 접합·공기질량·이용률)을
  걷어 내고 "왜 그런가" 를 한 덩이씩 풀어 준다.

  가장 큰 칸인 원리는 계통도 네 단계를 하나씩 짚으며 스스로 넘어간다 — 한 번에 다 읽히지 않는 이야기를
  차례로 한 토막씩 내주는 편이, 네 덩이를 한꺼번에 늘어놓는 것보다 실제로 읽힌다.
*/

/** 계통도 한 단계를 짚어 주는 설명 */
export interface MiddleStage {
  id: string;
  /** 계통도 위의 몇 번째 단계인지 — 그림에서 그 단계만 또렷해진다 */
  step: 1 | 2 | 3 | 4;
  term: string;
  body: string;
}

export interface MiddlePrincipleContent {
  head: string;
  note: string;
  stages: MiddleStage[];
}

export interface MiddleProductionContent {
  head: string;
  note: (stats: EduStats) => string;
  notes: EduNote[];
}

export interface MiddleBenefitContent {
  head: string;
  note: (scopeLabel: string, stats: EduStats) => string;
  caption: string;
  itemIds: ImpactId[];
  copy?: Partial<Record<ImpactId, ImpactCopy>>;
}

export const MIDDLE_CONTENT: MiddleContent = {
  level: 'middle',
  emphasis: 'large',
  headline: {
    mainLabel: '지금 만들고 있는 전기',
    mainNote: (stats) =>
      `가장 셀 때(${formatNumber(stats.capacityKw)}kW)와 견주면 지금 이만큼 만들고 있어요`,
    statIds: ['today', 'insolation', 'co2', 'irradiance', 'capacity'],
    copy: {
      insolation: {
        label: '발전시간',
        note: () => '가장 셀 때로만 돌렸다면 이만큼 걸렸을 거예요',
      },
      co2: {
        label: '줄인 온실가스',
        note: () => '화력발전이 그만큼 덜 돌아서 아낀 양이에요',
      },
      capacity: {
        label: '설비용량',
        note: () => '한꺼번에 낼 수 있는 가장 큰 출력이에요',
      },
    },
  },
  principle: {
    head: '햇빛이 전기가 되기까지',
    note: '네 단계를 차례로 짚어 볼게요',
    stages: [
      {
        id: 'sun',
        step: 1,
        term: '햇빛이 지붕에 닿아요',
        body:
          '해가 높이 뜰수록 햇빛이 판에 똑바로 내리쬐요. 같은 양의 햇빛이 좁은 자리에 모이니 '
          + '판 1m² 가 받는 힘이 세지고, 그만큼 전기도 많이 만들어져요. 아침·저녁에는 햇빛이 '
          + '비스듬히 들어오는 데다 지나야 할 공기까지 두꺼워, 판에 닿을 때는 이미 힘이 빠져 있어요.',
      },
      {
        id: 'cell',
        step: 2,
        term: '태양전지가 전기를 만들어요',
        body:
          '햇빛은 알갱이처럼 행동해요. 그 알갱이가 태양전지에 부딪히면 붙잡혀 있던 전자가 떨어져 나오죠. '
          + '태양전지는 떨어져 나온 전자를 한 방향으로만 흐르게 만들어 두었어요. 전자가 한 방향으로 '
          + '줄지어 흐르는 것, 그게 바로 전기예요.',
      },
      {
        id: 'inverter',
        step: 3,
        term: '인버터가 쓸 수 있게 바꿔요',
        body:
          '판이 만든 전기는 한 방향으로만 흐르는 직류예요. 그런데 교실 콘센트에 오는 전기는 '
          + '방향이 1초에 60번씩 번갈아 바뀌는 교류죠. 인버터가 이 둘 사이를 바꿔 주기 때문에 '
          + '지붕에서 만든 전기를 교실에서 그대로 쓸 수 있어요.',
      },
      {
        id: 'school',
        step: 4,
        term: '학교가 쓰고, 남으면 내보내요',
        body:
          '만든 전기는 먼저 우리 학교가 써요. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기가 없죠. '
          + '수업이 없는 주말처럼 쓸 곳보다 많이 만든 날에는 남은 전기가 바깥 전기망으로 흘러나가 '
          + '다른 곳에서 쓰여요.',
      },
    ],
  },
  production: {
    head: '오늘 이만큼 만들었어요',
    note: (stats) => `하루 모두 ${formatNumber(stats.dayKwh)}kWh · 색칠된 넓이가 오늘 만든 양이에요`,
    notes: [
      {
        id: 'shape',
        term: '곡선 모양은 해가 지나간 길과 같아요',
        body:
          '봉우리가 솟은 자리가 해가 가장 높이 뜬 시각이에요. 옆 그림에서 해가 오르내린 모양이 '
          + '그대로 곡선이 되죠. 전기의 양을 정하는 건 설비가 아니라 햇빛이에요.',
      },
      {
        id: 'cloud',
        term: '움푹 팬 자리는 구름이 지나간 자리예요',
        body: '해가 잠깐 가려지면 그 시간만 발전량이 뚝 떨어졌다가, 구름이 지나가면 다시 올라와요.',
      },
    ],
  },
  benefit: {
    head: '그래서 무엇이 좋아질까요',
    note: (scopeLabel, stats) =>
      `${scopeLabel}에서 오늘 만든 ${formatNumber(stats.dayKwh)}kWh를 다른 것으로 바꿔 보면 이래요`,
    caption: '여기서 만든 만큼 화력발전이 줄어요. 나무는 그 양을 나무가 마시는 공기로 바꿔 본 거예요.',
    itemIds: ['co2', 'tree', 'household', 'led'],
    copy: {
      household: { label: '한 집이 쓰는 날' },
    },
  },
  facts: [
    '태양전지는 뜨거우면 오히려 힘이 빠져요. 한여름보다 볕 좋은 봄가을에 더 잘 만들어요.',
    '판에 먼지가 쌓이면 만드는 양이 줄어요. 비가 한 번 내리면 그만큼 돌아와요.',
    '줄지어 이은 판 하나에 그늘이 지면 그 줄 전체가 함께 힘을 잃어요.',
    '흐린 날에도 전기는 만들어져요. 다만 맑은 날의 몇 분의 일이에요.',
    'kW 는 지금의 힘, kWh 는 그 힘으로 쌓은 양이에요. 속도와 거리의 관계와 같아요.',
  ],
};
