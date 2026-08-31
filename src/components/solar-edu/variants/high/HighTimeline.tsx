import { useMemo } from 'react';
import { buildEduInsight } from '@/mocks/eduDiagnosis';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { clockOf, formatNumber, formatPercent, formatSi } from '@/utils/format';
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
  /** 왜 발전량을 좌우하는가 — 한 줄 */
  why: string;
}

/*
  발전량을 좌우하는 것.

  크기를 %로 적지 않는다. 요인마다 몇 할을 좌우하는지는 이 화면이 받아 보는 값에 없어 지어내야
  하는데, 학생이 보는 화면에서 지어낸 수를 실측인 척 내놓아서는 안 된다.

  요인마다 「오늘 곡선에서 이것을 어떻게 알아보는가」 를 한 줄 더 붙여 두었는데 걷어냈다
  (2026-08-31 검토 의견). 글씨를 키우고 나니 다섯이 한 화면에 서지 못해 절반이 잘렸고,
  잘린 줄은 쓰지 않은 줄과 같다. 남긴 한 줄은 「왜 그런가」 다.
*/
const FACTORS: Factor[] = [
  {
    id: 'irradiance',
    icon: <IrradianceIcon />,
    name: '일사강도',
    why: '모듈에 들어오는 햇빛의 세기다. 발전량은 이 값에 거의 비례한다.',
  },
  {
    id: 'angle',
    icon: <AngleIcon />,
    name: '태양 고도 · 설치 각도',
    why: '빛이 모듈에 수직으로 들어올수록 1m² 가 받는 에너지가 커진다.',
  },
  {
    id: 'temp',
    icon: <ConversionIcon />,
    name: '모듈 온도',
    why: '모듈이 뜨거워지면 같은 햇빛에도 전기로 바꾸는 몫이 줄어든다.',
  },
  {
    id: 'shade',
    icon: <JunctionIcon />,
    name: '음영',
    why: '직렬로 이어져 있어 한 장만 그늘이 져도 그 줄 전체의 출력이 떨어진다.',
  },
  {
    id: 'soil',
    icon: <SolarPanelIcon />,
    name: '표면 오염',
    why: '먼지·황사·낙엽이 유리면을 덮으면 닿는 빛 자체가 줄어든다.',
  },
];

/**
 * 값과 단위를 한 덩이로 적는다.
 *
 * 도 전체를 합치면 kW·kWh 로는 자릿수가 커져 칸을 넘으므로 자릿수에 맞춰 M·G 로 올린다.
 * 자리마다의 계측값은 숫자와 단위 사이를 띄우고, 문장 안에 들어갈 때는 붙인다.
 */
function siText(kilo: number, suffix: 'W' | 'Wh', tight = false) {
  const { value, unit } = formatSi(kilo, suffix);

  return tight ? `${value}${unit}` : `${value} ${unit}`;
}

/**
 * 문장 하나만 떼어 낸다.
 *
 * 자리마다 적힌 물리 설명은 여러 문장인데 이 시안은 한 줄만 세울 자리다. 같은 말을 짧게 다시
 * 적어 두면 한쪽만 고쳐 놓고 두 화면이 다른 말을 하게 되므로, 첫 문장을 그대로 떼어 쓴다 —
 * 그래서 `eduContent` 의 첫 문장은 홀로 서도 말이 되게 적혀 있다.
 */
function firstSentence(text: string) {
  const end = text.indexOf('. ');

  return end < 0 ? text : text.slice(0, end + 1);
}

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
 * 두 판 모두 한 항목에 한 줄만 적는다. 처음에는 "오늘 곡선에서 이것을 어떻게 읽는가" 를 한 줄
 * 더 붙였는데, 글씨를 키우고 나니 아홉 항목이 한 화면에 서지 못해 절반이 잘렸다 —
 * 잘린 글은 쓰지 않은 글과 같으므로, 남길 한 줄을 고르는 쪽을 택했다 (2026-08-31 검토 의견).
 */
export function HighTimeline({ scopeLabel, stats, content }: HighTimelineProps) {
  const insight = useMemo(() => buildEduInsight(stats, scopeLabel), [scopeLabel, stats]);
  const moments = useMemo(() => buildMoments(stats), [stats]);

  const peak = Math.max(...stats.hourly, 0.001);
  const maxIrradiance = Math.max(...stats.irradianceSeries, 0.001);
  const pr = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;

  // 모듈 전면에 들어오는 빛의 세기(kW). 모듈 면적은 어림값이라 수로는 적지 않는다.
  const sunKw = (stats.irradianceNow * stats.moduleArea) / 1000;

  /**
   * 자리마다 지금 이 학교에서 실제로 읽히는 값.
   *
   * 값이 무엇인지 풀어 주는 한 줄을 함께 두었는데, 자리마다 두 줄을 세울 높이가 없어 걷어냈다
   * (2026-08-31 검토 의견). 한 줄만 남긴다면 값을 되풀이하는 쪽이 아니라 그 자리에서
   * 무슨 일이 일어나는지를 남긴다.
   */
  const readingOf: Record<PlantSpot, string> = {
    cell: `${formatNumber(stats.irradianceNow)} W/m²`,
    module: siText(sunKw, 'W'),
    inverter: siText(stats.outputKw, 'W'),
    grid: siText(stats.todayKwh, 'Wh'),
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
                    <span className={styles.stage__value}>{readingOf[spot]}</span>
                  </p>
                  <p className={styles.stage__text}>{firstSentence(content.ai.stages[stage].physics)}</p>
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
      saw: `태양 고도가 가장 높은 시각. ${siText(maxOutput, 'Wh', true)} 로 하루 중 최대였다.`,
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
    saw: `일사강도 ${formatNumber(stats.irradianceNow)}W/m², 출력 ${siText(stats.outputKw, 'W', true)} (맑은 날 정오 대비 ${formatPercent(stats.irradianceNow / FULL_SUN_WM2)}).`,
  });

  moments.push({
    hour: SUNSET_HOUR,
    kind: 'sunset',
    label: '발전 종료',
    saw: `일몰 ${clockOf(SUNSET_HOUR)} 에 발전이 멎는다. 하루 합계 ${siText(stats.dayKwh, 'Wh', true)} 예상.`,
  });

  return moments.sort((a, b) => a.hour - b.hour);
}
