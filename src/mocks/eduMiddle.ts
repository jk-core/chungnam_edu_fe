import { formatNumber } from '@/utils/format';
import { kwhToHouseholdDays } from '@/utils/eco';
import { capacityText, energyText } from './eduContent';
import type { EduNote, ImpactCopy, ImpactId, MiddleContent } from './eduContent';
import type { EduStats } from './solarEdu';

/*
  중등 판 대본 (SFR-005-02/03/04).

  고등과 다루는 축은 같다 — 원리, 발전량, 이점. 다른 것은 다루는 방식이다.
  고등이 개념을 이어 붙여 설명한다면 중등은 한 덩이에 한 가지만 말한다.

  눈높이는 초등과 중등 사이에 둔다 (2026-08-31 검토 의견). 고등 판이 중학교 과학 수준으로
  내려오면서, 중등 판이 그 자리에 그대로 남으면 두 판이 같은 말을 하게 되기 때문이다.
  그래서 반도체·전자처럼 원리를 한 겹 더 파고드는 말은 고등 판에 넘기고, 여기서는
  "무엇이 어떻게 된다" 까지만 남긴다.

  문체는 서술체다. 중학교 과학 교과서가 이미 서술체라, 존대 설명체로 적으면 수업에 함께 놓았을 때
  결이 어긋난다. 쉬워지는 것은 문장이지 말투가 아니다. 지표 이름도 표준 용어를 그대로 쓴다 —
  쉬워야 할 것은 이름이 아니라 설명이다.

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
      `한 번에 만들 수 있는 최대치 ${capacityText(stats)} 가운데 지금 만들고 있는 양이다`,
    statIds: ['today', 'total', 'powerTime', 'co2', 'irradiance', 'capacity'],
    copy: {
      today: {
        note: (stats) => `4인 가구 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}집분`,
      },
      powerTime: {
        note: () => '최대 출력 기준 시간',
      },
      co2: {
        note: () => '덜 태운 석탄·가스',
      },
      irradiance: {
        note: () => '맑은 날 한낮이 100점',
      },
      capacity: {
        note: () => '한 번에 내는 최대량',
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
          '해가 높이 뜰수록 햇빛이 지붕에 똑바로 내리쬔다. 같은 빛이 좁은 자리에 모이므로 '
          + '그만큼 전기도 많이 만들어진다. 아침과 저녁에는 빛이 비스듬히 들어와 힘이 약하다.',
      },
      {
        id: 'cell',
        step: 2,
        term: '태양전지가 전기를 만든다',
        body:
          '지붕에 깔린 얇은 판을 태양전지라고 한다. 햇빛이 닿으면 판 안의 아주 작은 알갱이가 밀려 나가며 '
          + '전기가 흐른다. 햇빛이 닿는 동안에는 계속 만들어진다.',
      },
      {
        id: 'inverter',
        step: 3,
        term: '인버터가 쓸 수 있는 전기로 바꾼다',
        body:
          '태양전지가 만든 전기는 한 방향으로만 흐른다. 교실 콘센트에 오는 전기는 방향이 계속 바뀐다. '
          + '서로 달라 그대로는 쓸 수 없어서, 인버터가 바꿔 주어야 교실에서 쓸 수 있다.',
      },
      {
        id: 'school',
        step: 4,
        term: '학교가 그대로 쓴다',
        body:
          '만든 전기는 학교가 그대로 쓴다. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기가 없다. '
          + '지붕에서 만든 만큼 밖에서 사 오는 전기가 줄어든다.',
      },
    ],
  },
  production: {
    head: '금일 시간대별 발전량',
    note: (stats) => `하루 합계 ${energyText(stats.dayKwh)}. 색이 칠해진 면적이 오늘 만든 전기다`,
    notes: [
      {
        id: 'shape',
        term: '곡선의 모양은 해가 뜨고 지는 모양과 같다',
        body:
          '차트가 가장 높은 시각이 해가 가장 높이 뜬 때다. 전기를 얼마나 만드는지는 설비 성능이 아니라 '
          + '그 시각에 들어온 햇빛의 양이 정한다.',
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
    note: '그동안 만든 전기가 어느 정도인지 바꿔 보자',
    itemIds: ['co2', 'tree', 'household', 'led'],
    /*
      기본 문구는 고등 판이 읽는 말이라 여기서 두 장만 덮어쓴다.
      나머지 두 장(가구 사용일수·조명 점등 시간)은 셈이 그대로 눈에 보여 더 풀 것이 없다.
    */
    copy: {
      co2: {
        line: '우리가 만든 만큼 석탄과 가스를 덜 태워서, 그만큼 탄소가 덜 나왔다',
      },
      tree: {
        line: '소나무 한 그루가 1년에 흡수하는 양으로 나눈 값이다',
      },
    },
  },
  facts: [
    '태양전지는 뜨거우면 오히려 힘이 떨어진다. 그래서 한여름보다 볕 좋은 봄·가을에 전기가 더 나온다.',
    '패널에 먼지가 쌓이면 만드는 전기가 줄고, 비가 내려 씻기면 다시 돌아온다.',
    '한 줄로 이은 패널 가운데 하나만 그늘이 져도 그 줄 전체가 함께 힘을 잃는다.',
    '흐린 날에도 전기는 만들어진다. 다만 맑은 날보다 훨씬 적다.',
    'kW 는 지금 이 순간의 힘, kWh 는 그 힘으로 한동안 만든 전기의 양이다. 속도와 거리의 관계와 같다.',
    '1,000kW 는 1MW, 1,000MW 는 1GW 다. 여러 학교를 합쳐 보면 단위가 이렇게 올라간다.',
  ],
};
