import { useMemo } from 'react';
import { buildEduInsight } from '@/mocks/eduDiagnosis';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { clockOf, formatNumber, formatPercent } from '@/utils/format';
import type { AnalysisStage } from '@/interface/diagnosis';
import type { HighContent, PlantSpot } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { SchoolIcon } from '@/components/common/Icon';
import { AngleIcon, ConversionIcon, InverterIcon, IrradianceIcon, JunctionIcon, PhotonIcon, SolarPanelIcon } from '../../EduIcons';
import styles from './HighTimeline.module.scss';
import type { ReactNode } from 'react';

/*
  곡선을 그리는 좌표계.

  가로는 화면 폭을 다 쓰고 세로는 눌러 두므로 그림이 통째로 늘어난다(가로 1.8배 · 세로 0.56배).
  꺾은선과 채움은 늘어나도 읽히지만, 동그라미는 타원이 되고 글자는 납작해진다 — 그래서 점과
  시각 이름표는 이 좌표계 밖, 늘어나지 않는 층에 올린다.
*/
const VIEW = { width: 1000, height: 150 };

/** 일사 대비 발전이 이 비율 아래로 떨어지면 "짚어 볼 시각" 으로 삼는다 */
const DIP_RATIO = 0.72;

interface Moment {
  hour: number;
  kind: 'sunrise' | 'peak' | 'dip' | 'now' | 'sunset';
  label: string;
  /** 곡선의 그 지점에서 읽히는 것 */
  saw: string;
}

/**
 * 설비를 지나며 무엇이 얼마가 되는가.
 *
 * 물리 설명은 `content.ai.stages` 에 이미 자리마다 한 덩이씩 적혀 있어 그대로 가져다 쓴다.
 * 같은 문장을 여기 다시 적어 두면 한쪽만 고쳐 놓고 두 화면이 다른 말을 하게 된다.
 */
const STAGES: { spot: PlantSpot; stage: AnalysisStage; name: string; icon: ReactNode }[] = [
  { spot: 'cell', stage: 'scan', name: '태양전지 셀', icon: <PhotonIcon /> },
  { spot: 'module', stage: 'classify', name: '모듈 · 스트링', icon: <SolarPanelIcon /> },
  { spot: 'inverter', stage: 'reason', name: '인버터', icon: <InverterIcon /> },
  { spot: 'grid', stage: 'done', name: '학교', icon: <SchoolIcon /> },
];

interface Factor {
  id: string;
  icon: ReactNode;
  name: string;
  /** 왜 발전량을 좌우하는가 */
  why: string;
  /** 오늘 곡선에서 이것을 어떻게 읽는가 */
  read: string;
}

/*
  발전량을 좌우하는 것.

  크기를 %로 적지 않는다. 요인마다 몇 할을 좌우하는지는 이 화면이 받아 보는 값에 없어 지어내야
  하는데, 학생이 보는 화면에서 지어낸 수를 실측인 척 내놓아서는 안 된다. 대신 **오늘 곡선에서
  그것을 어떻게 알아보는가** 를 적는다 — 눈앞의 그림에서 확인되는 쪽이 수보다 오래 남는다.
*/
const FACTORS: Factor[] = [
  {
    id: 'irradiance',
    icon: <IrradianceIcon />,
    name: '일사강도',
    why: '모듈에 들어오는 복사 에너지의 세기다. 발전량은 이 값에 거의 비례하고, 나머지 요인은 모두 이 값을 깎는 쪽으로 작용한다.',
    read: '점선(일사량)과 실선(발전량)이 같은 모양으로 오르내렸다면, 오늘 발전량을 정한 것은 날씨다.',
  },
  {
    id: 'angle',
    icon: <AngleIcon />,
    name: '태양 고도 · 설치 각도',
    why: '빛이 모듈 면에 수직으로 들어올수록 단위 면적이 받는 에너지가 커진다. 설치할 때 방위각과 경사각을 정해 두는 것도 이 입사각을 확보하기 위해서다.',
    read: '차트에서 가장 높은 지점이 정오 무렵에 있다면, 모듈이 향한 방향과 기울기가 제대로 맞춰져 있다는 뜻이다.',
  },
  {
    id: 'temp',
    icon: <ConversionIcon />,
    name: '모듈 온도',
    why: '모듈 온도가 오르면 개방전압이 낮아져 변환 효율이 떨어진다. 일사량이 가장 큰 한여름에 오히려 효율이 떨어지는 이유다.',
    read: '한여름 정오보다 일사가 좋은 봄·가을에 발전시간이 더 길게 나오는 이유가 이것이다.',
  },
  {
    id: 'shade',
    icon: <JunctionIcon />,
    name: '음영',
    why: '모듈을 직렬로 이어 전압을 올리는 구조여서, 한 장만 그늘이 져도 스트링 전체의 전류가 그 모듈에 맞춰 함께 떨어진다.',
    read: '일사량은 그대로인데 특정 시각에만 발전량이 뚝 떨어졌다면 그늘을 의심해야 한다. 며칠 동안 같은 시각에 똑같이 떨어진다면 주변 건물이나 나무의 그림자일 가능성이 크다.',
  },
  {
    id: 'soil',
    icon: <SolarPanelIcon />,
    name: '표면 오염',
    why: '먼지·황사·낙엽이 유리면을 덮으면 셀에 도달하는 빛 자체가 줄어든다. 특정 시각에만 작용하는 음영과 달리 하루 내내 고르게 작용한다.',
    read: '차트 모양은 평소와 같은데 하루 종일 높이만 낮다면 표면 오염일 가능성이 크다. 비가 온 뒤에 다시 올라오는지 확인하면 구분할 수 있다.',
  },
];

interface HighTimelineProps {
  scopeLabel: string;
  stats: EduStats;
  content: HighContent;
}

/**
 * 고등 판 · 시안 D — 발전 원리 해설 (SFR-005-01/02/03).
 *
 * 앞서 이 시안은 하루 곡선 하나에 진단 소견을 붙인 화면이었다. 그런데 곡선은 **결과**만 보여 주고,
 * 그 결과가 왜 그 모양인지는 답하지 않는다 — 태양광을 설명하러 걸어 둔 화면에서 배울 것이 없다.
 *
 * 그래서 곡선을 위 한 단으로 줄이고, 남은 자리를 둘로 나눠 설명이 차지하게 했다.
 * 왼쪽은 **설비를 지나며 무엇이 얼마가 되는가**(셀 → 모듈 → 인버터 → 계통), 오른쪽은
 * **무엇이 그 양을 좌우하는가**(일사·각도·온도·음영·오염)다. 앞이 경로라면 뒤는 변수다.
 *
 * 두 판 모두 끝에 "오늘 곡선에서 이것을 어떻게 읽는가" 를 붙인다. 위의 곡선이 예시가 되어야
 * 원리가 남의 이야기로 끝나지 않는다.
 */
export function HighTimeline({ scopeLabel, stats, content }: HighTimelineProps) {
  const insight = useMemo(() => buildEduInsight(stats, scopeLabel), [scopeLabel, stats]);
  const moments = useMemo(() => buildMoments(stats), [stats]);

  const peak = Math.max(...stats.hourly, 0.001);
  const maxIrradiance = Math.max(...stats.irradianceSeries, 0.001);
  const pr = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;

  // 모듈 전면에 들어오는 빛의 세기(kW). 모듈 면적은 어림값이라 수로는 적지 않는다.
  const sunKw = (stats.irradianceNow * stats.moduleArea) / 1000;
  const efficiency = sunKw > 0 ? (stats.outputKw / sunKw) * 100 : 0;

  /** 자리마다 지금 이 학교에서 실제로 읽히는 값 */
  const readingOf: Record<PlantSpot, { value: string; note: string }> = {
    cell: {
      value: `${formatNumber(stats.irradianceNow)} W/m²`,
      note: `맑은 날 정오(${formatNumber(FULL_SUN_WM2)})의 ${Math.round((stats.irradianceNow / FULL_SUN_WM2) * 100)}%`,
    },
    module: {
      value: `${formatNumber(sunKw, 1)} kW`,
      note: '모듈 전면에 들어오는 빛의 세기',
    },
    inverter: {
      value: `${formatNumber(stats.outputKw, 1)} kW`,
      note: `들어온 빛의 ${formatNumber(efficiency, 1)}% 가 전기로 · 직류를 교류로`,
    },
    grid: {
      value: `${formatNumber(stats.todayKwh)} kWh`,
      note: '금일 지금까지 쌓인 발전량',
    },
  };

  const xOf = (hour: number) => (hour / 23) * VIEW.width;
  const yOf = (kwh: number) => VIEW.height - (kwh / peak) * (VIEW.height - 18);

  const curve = stats.hourly.map((kwh, hour) => `${xOf(hour)},${yOf(kwh)}`).join(' ');
  const sunCurve = stats.irradianceSeries
    .map((value, hour) => `${xOf(hour)},${VIEW.height - (value / maxIrradiance) * (VIEW.height - 18)}`)
    .join(' ');

  return (
    <div className={styles.board}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.head__title}>햇빛이 전기가 되는 과정과, 그 양을 정하는 요인</h2>
          <p className={styles.head__note}>
            {scopeLabel} · 오늘의 발전 곡선과, 그 모양을 만든 요인
          </p>
        </div>

        <div className={styles.verdict} data-band={insight.band}>
          <span>{insight.verdict}</span>
          <strong>{formatPercent(pr)}</strong>
        </div>
      </header>

      {/* 오늘의 결과 — 아래 설명이 가리킬 예시가 된다 */}
      <section className={styles.track} aria-label="금일 시간대별 발전량">
        <div className={styles.plot}>
          <svg
            className={styles.plot__svg}
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            fill="none"
            preserveAspectRatio="none"
            role="img"
            aria-label={`금일 발전 곡선. 짚은 시각 ${moments.length}곳.`}
          >
            {/* 일사 곡선을 뒤에 옅게 깐다 — 발전이 햇빛을 따라갔는지 겹쳐 보라는 뜻이다 */}
            <polyline points={sunCurve} stroke="var(--chart-irradiance)" strokeWidth="2" strokeDasharray="6 5" opacity="0.5" vectorEffect="non-scaling-stroke" />

            <polygon points={`0,${VIEW.height} ${curve} ${VIEW.width},${VIEW.height}`} fill="var(--chart-generation)" fillOpacity="0.14" />
            <polyline points={curve} stroke="var(--chart-generation)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {/*
            짚은 시각의 기둥과 점.
            늘어나는 좌표계 밖에 두어야 점이 동그라미로 남는다. 자리는 백분율로 잡으므로
            폭이 달라져도 곡선 위의 같은 지점을 가리킨다.
          */}
          {moments.map((moment) => (
            <span
              key={moment.kind}
              className={styles.plot__pin}
              data-kind={moment.kind}
              style={{
                left: `${(moment.hour / 23) * 100}%`,
                top: `${(yOf(stats.hourly[Math.round(moment.hour)] ?? 0) / VIEW.height) * 100}%`,
              }}
            />
          ))}
        </div>

        <ol className={styles.hours}>
          {moments.map((moment) => (
            <li key={moment.kind} className={styles.hours__item} style={{ left: `${(moment.hour / 23) * 100}%` }}>
              {clockOf(moment.hour)}
            </li>
          ))}
        </ol>

        {/* 곡선에서 짚어 볼 지점 — 아래 설명이 가리키는 곳이 어디인지 먼저 못 박는다 */}
        <ul className={styles.marks}>
          {moments.map((moment) => (
            <li key={moment.kind} className={styles.mark} data-kind={moment.kind}>
              <span className={styles.mark__head}>
                <span className={styles.mark__label}>{moment.label}</span>
                <span className={styles.mark__hour}>{clockOf(moment.hour)}</span>
              </span>
              <span className={styles.mark__body}>{moment.saw}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.lower}>
        {/* 경로 — 설비를 지나며 무엇이 얼마가 되는가 */}
        <section className={styles.panel} aria-label="설비를 지나는 경로">
          <header className={styles.panel__head}>
            <h3 className={styles.panel__title}>햇빛이 전기가 되기까지</h3>
            <p className={styles.panel__note}>네 자리를 차례로 지난다. 오른쪽 값은 지금 이 학교에서 계측된 수치다</p>
          </header>

          <ol className={styles.stages}>
            {STAGES.map(({ spot, stage, name, icon }, index) => (
              <li key={spot} className={styles.stage}>
                <span className={styles.stage__mark}>
                  <span className={styles.stage__no}>{index + 1}</span>
                  <span className={styles.stage__icon}>{icon}</span>
                </span>

                <div className={styles.stage__body}>
                  <p className={styles.stage__head}>
                    <span className={styles.stage__name}>{name}</span>
                    <span className={styles.stage__value}>{readingOf[spot].value}</span>
                  </p>
                  <p className={styles.stage__reading}>{readingOf[spot].note}</p>
                  <p className={styles.stage__text}>{content.ai.stages[stage].physics}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 변수 — 무엇이 그 양을 좌우하는가 */}
        <section className={styles.panel} aria-label="발전량을 좌우하는 것">
          <header className={styles.panel__head}>
            <h3 className={styles.panel__title}>발전량을 좌우하는 것</h3>
            <p className={styles.panel__note}>설비 상태와 무관하게 영향력이 큰 5가지 요인</p>
          </header>

          <ul className={styles.factors}>
            {FACTORS.map((factor) => (
              <li key={factor.id} className={styles.factor}>
                <span className={styles.factor__icon}>{factor.icon}</span>

                <div className={styles.factor__body}>
                  <p className={styles.factor__name}>{factor.name}</p>
                  <p className={styles.factor__why}>{factor.why}</p>
                  {/* 원리를 위 곡선에 붙들어 맨다 — 눈앞에서 확인되는 쪽이 오래 남는다 */}
                  <p className={styles.factor__read}>{factor.read}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className={styles.foot}>
        <p className={styles.foot__line}>{insight.lines[0]}</p>
        <p className={styles.foot__note}>{content.ai.footer}</p>
      </footer>
    </div>
  );
}

/**
 * 오늘 짚어 볼 시각들.
 *
 * 시각을 손으로 골라 두지 않고 값에서 찾아낸다 — 봉우리가 언제였는지, 햇빛에 견줘 발전이 꺾인
 * 시각이 있었는지는 날마다 다르다. 값에서 찾아야 이 화면이 매일 다른 이야기를 한다.
 */
function buildMoments(stats: EduStats): Moment[] {
  const peakHour = stats.hourly.indexOf(Math.max(...stats.hourly));
  const maxOutput = Math.max(...stats.hourly, 0.001);
  const maxIrradiance = Math.max(...stats.irradianceSeries, 0.001);

  // 햇빛은 있었는데 발전만 꺾인 시각. 설비를 의심할 첫 실마리다.
  let dipHour: number | null = null;
  let worst = DIP_RATIO;

  stats.irradianceSeries.forEach((irradiance, hour) => {
    if (irradiance / maxIrradiance < 0.35) return;

    const ratio = (stats.hourly[hour] / maxOutput) / (irradiance / maxIrradiance);

    if (ratio < worst) {
      worst = ratio;
      dipHour = hour;
    }
  });

  const moments: Moment[] = [
    {
      hour: SUNRISE_HOUR,
      kind: 'sunrise',
      label: '발전 시작',
      saw: `일출 ${clockOf(SUNRISE_HOUR)} 부터 일사가 들어오며 발전이 시작된다.`,
    },
    {
      hour: peakHour,
      kind: 'peak',
      label: '최대 출력',
      saw: `태양 고도가 가장 높은 시각. ${formatNumber(maxOutput)}kWh 로 하루 중 최대였다.`,
    },
  ];

  if (dipHour !== null) {
    moments.push({
      hour: dipHour,
      kind: 'dip',
      label: '출력 꺾임',
      saw: `햇빛은 그대로인데 발전량만 ${formatPercent(worst)} 로 떨어진 구간이다.`,
    });
  }

  moments.push({
    hour: stats.nowHour,
    kind: 'now',
    label: '지금',
    saw: `일사강도 ${formatNumber(stats.irradianceNow)}W/m², 출력 ${formatNumber(stats.outputKw, 1)}kW (STC 대비 ${formatPercent(stats.irradianceNow / FULL_SUN_WM2)}).`,
  });

  moments.push({
    hour: SUNSET_HOUR,
    kind: 'sunset',
    label: '발전 종료',
    saw: `일몰 ${clockOf(SUNSET_HOUR)} 에 발전이 멎는다. 하루 합계 ${formatNumber(stats.dayKwh)}kWh 예상.`,
  });

  return moments.sort((a, b) => a.hour - b.hour);
}
