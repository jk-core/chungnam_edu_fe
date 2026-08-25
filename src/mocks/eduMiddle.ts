import { formatNumber } from '@/utils/format';
import { kwhToHouseholdDays } from '@/utils/eco';
import type { EduNote, ImpactCopy, ImpactId, MiddleContent } from './eduContent';
import type { EduStats } from './solarEdu';

/*
  중등 판 대본 (SFR-005-02/03/04).

  고등과 다루는 축은 같다 — 원리, 발전량, 이점. 다른 것은 다루는 방식이다.
  고등이 값을 재고 따지는 화면이라면 중등은 설명하는 화면이라, 어려운 말(PN 접합·공기질량·이용률)을
  걷어 내고 "왜 그런가" 를 한 덩이씩 풀어 준다.

  문체는 서술체다. 중학교 과학 교과서가 이미 서술체라, 존대 설명체로 적으면 수업에 함께 놓았을 때
  결이 어긋난다. 지표 이름도 표준 용어를 그대로 쓴다 — 쉬워야 할 것은 이름이 아니라 설명이다.

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
  /*
    소제목에는 수치를 적지 않는다.
    바로 아래 넉 장이 저마다 값을 크게 들고 있어, 같은 값을 소제목에서 한 번 더 읽으면
    무엇을 보라는 말인지가 흐려진다. 여기서는 무엇을 할 차례인지만 말한다.
  */
  note: string;
  caption: string;
  itemIds: ImpactId[];
  copy?: Partial<Record<ImpactId, ImpactCopy>>;
}

export const MIDDLE_CONTENT: MiddleContent = {
  level: 'middle',
  /*
    글씨 크기는 고등과 같다.

    한때 중등만 한 단계 키워 두었는데, 위쪽 요약 띠는 세 눈높이가 똑같은 항목을 똑같은 순서로
    보여 주는 자리다. 거기서만 글씨와 칸 높이가 달라지면 눈높이를 바꿔 볼 때 같은 값이 자리를
    옮긴 것처럼 보인다. 크기로 눈높이를 가르는 것은 본문이 할 일이고, 이 띠는 셋이 같아야 한다.
  */
  emphasis: 'normal',
  headline: {
    mainLabel: '실시간 출력',
    mainNote: (stats) =>
      `설비용량 ${formatNumber(stats.capacityKw)}kW 로 낼 수 있는 최대치 대비 현재의 출력을 나타낸다`,
    statIds: ['today', 'insolation', 'co2', 'irradiance', 'capacity'],
    copy: {
      today: {
        note: (stats) => `4인 가구 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}가구가 하루에 쓰는 양이다`,
      },
      insolation: {
        note: () => '발전량을 설비용량으로 나눈 값이다. 용량이 달라도 비교가 가능한 지표이다',
      },
      co2: {
        note: () => '여기서 만든 만큼 화력발전이 덜 돌아 줄어든 양이다',
      },
      irradiance: {
        note: (stats) => `맑은 날 정오를 100 으로 본 값이다 (${formatNumber(stats.irradianceNow)} W/m²)`,
      },
      capacity: {
        note: () => '한꺼번에 낼 수 있는 가장 큰 출력이다',
      },
    },
  },
  principle: {
    head: '햇빛이 전기가 되기까지',
    note: '네 단계를 차례로 살펴본다',
    stages: [
      {
        id: 'sun',
        step: 1,
        term: '햇빛이 지붕에 닿는다',
        body:
          '태양이 높이 뜰수록 햇빛이 지붕에 가깝게 수직으로 내리쬔다. 같은 양의 빛이 좁은 면적에 모이므로 '
          + '지붕 1m² 가 받는 에너지가 커지고, 그만큼 발전량도 늘어난다. 아침과 저녁에는 빛이 비스듬히 들어오는 '
          + '데다 지나야 할 공기층까지 두꺼워, 지붕에 닿을 때는 이미 에너지가 많이 줄어 있다.',
      },
      {
        id: 'cell',
        step: 2,
        term: '태양전지가 전기를 만든다',
        body:
          '태양전지는 반도체로 만든다. 햇빛이 닿으면 반도체 안에 붙잡혀 있던 전자가 그 에너지를 받아 '
          + '자유로워진다. 태양전지는 이 전자가 한 방향으로만 흐르도록 만들어져 있어, 전자가 줄지어 흐르는 '
          + '동안 전류가 생긴다.',
      },
      {
        id: 'inverter',
        step: 3,
        term: '인버터가 교류로 바꾼다',
        body:
          '패널이 만든 전기는 한 방향으로만 흐르는 직류다. 그런데 교실 콘센트에 오는 전기는 방향이 1초에 '
          + '60번씩 번갈아 바뀌는 교류다. 인버터가 직류를 교류로 바꾸기 때문에 지붕에서 만든 전기를 '
          + '교실에서 그대로 쓸 수 있다.',
      },
      {
        id: 'school',
        step: 4,
        term: '학교가 그대로 쓴다',
        body:
          '만든 전기는 학교가 그대로 쓴다. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기가 없다. '
          + '지붕에서 만든 만큼 밖에서 끌어다 쓰는 전기가 줄어드는 셈이다.',
      },
    ],
  },
  production: {
    head: '금일 시간대별 발전량',
    note: (stats) => `하루 합계 ${formatNumber(stats.dayKwh)}kWh. 색이 칠해진 면적이 금일 발전량이다`,
    notes: [
      {
        id: 'shape',
        term: '곡선의 모양은 태양의 고도와 같다',
        body:
          '차트가 가장 높은 시각이 태양이 가장 높이 뜬 때다. 태양 고도 그래프에서 태양이 오르내린 모양이 '
          + '그대로 차트 모양이 된다. 발전량을 정하는 것은 설비 성능이 아니라 그 시각에 들어온 햇빛의 양이다.',
      },
      {
        id: 'cloud',
        term: '차트가 뚝 떨어진 구간은 구름이 해를 가린 순간이다',
        body: '구름이 해를 가리는 동안에는 발전량이 뚝 떨어졌다가, 구름이 지나가고 나면 곧바로 다시 올라온다.',
      },
    ],
  },
  benefit: {
    head: '그래서 무엇이 좋아지는가',
    note: '오늘 발전량이 어느 정도인지 환산해 보자',
    caption: '여기서 만든 만큼 화력발전이 줄어든다. 그루 수는 줄어든 탄소를 소나무가 흡수하는 양으로 바꾼 값이다.',
    itemIds: ['co2', 'tree', 'household', 'led'],
  },
  facts: [
    '태양전지는 온도가 높으면 오히려 효율이 떨어진다. 그래서 한여름보다 볕 좋은 봄·가을에 발전량이 더 나온다.',
    '패널 표면에 먼지가 쌓이면 발전량이 줄어든다. 비가 한 번 내리면 그만큼 회복된다.',
    '직렬로 이은 패널 하나에만 그늘이 져도 그 줄 전체의 출력이 그 패널에 맞춰 함께 떨어진다.',
    '흐린 날에도 전기는 만들어진다. 다만 맑은 날의 몇 분의 일 수준이다.',
    'kW 는 지금 이 순간의 출력, kWh 는 그 출력으로 쌓은 양이다. 속도와 거리의 관계와 같다.',
  ],
};
