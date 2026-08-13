import { useMemo } from 'react';
import { buildEduInsight } from '@/mocks/eduDiagnosis';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { formatNumber, formatPercent } from '@/utils/format';
import type { HighContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './HighTimeline.module.scss';

/** 곡선을 그리는 좌표계 */
const VIEW = { width: 1000, height: 220 };

/** 일사 대비 발전이 이 비율 아래로 떨어지면 "짚어 볼 시각" 으로 삼는다 */
const DIP_RATIO = 0.72;

interface Moment {
  hour: number;
  kind: 'sunrise' | 'peak' | 'dip' | 'now' | 'sunset';
  label: string;
  /** AI 가 그 시각에 무엇을 보았는가 */
  saw: string;
  /** 그래서 무엇이라 판단했는가 */
  judged: string;
}

interface HighTimelineProps {
  scopeLabel: string;
  stats: EduStats;
  content: HighContent;
}

/**
 * 고등 판 · 시안 D — 진단 타임라인 (SFR-005-02/03/07).
 *
 * 현행 시안의 AI 는 **지금** 을 판정한다. 하루가 끝난 뒤 "오늘 88%" 라고 말하는 식이다.
 * 그런데 실제 진단이 하는 일은 그 88% 가 **언제 어떻게 만들어졌는지** 를 되짚는 쪽에 가깝다.
 *
 * 이 시안은 하루를 가로축에 눕히고, 곡선 위에 AI 가 짚은 시각을 표시한다. 시각마다
 * "무엇을 보았는가" 와 "그래서 무엇이라 판단했는가" 를 갈라 적는 것이 요점이다 —
 * 관측과 판단을 갈라 적으면, 같은 관측에서 다른 판단이 나올 수 있다는 것도 함께 배운다.
 */
export function HighTimeline({ scopeLabel, stats, content }: HighTimelineProps) {
  const insight = useMemo(() => buildEduInsight(stats, scopeLabel), [stats, scopeLabel]);
  const moments = useMemo(() => buildMoments(stats), [stats]);

  const peak = Math.max(...stats.hourly, 0.001);
  const maxIrradiance = Math.max(...stats.irradianceSeries, 0.001);
  const pr = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;

  const xOf = (hour: number) => (hour / 23) * VIEW.width;
  const yOf = (kwh: number) => VIEW.height - (kwh / peak) * (VIEW.height - 24);

  const curve = stats.hourly.map((kwh, hour) => `${xOf(hour)},${yOf(kwh)}`).join(' ');
  const sunCurve = stats.irradianceSeries
    .map((value, hour) => `${xOf(hour)},${VIEW.height - (value / maxIrradiance) * (VIEW.height - 24)}`)
    .join(' ');

  return (
    <div className={styles.board}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.head__title}>오늘 하루, AI 가 짚은 시각</h2>
          <p className={styles.head__note}>
            {scopeLabel} · 관측과 판단을 갈라 적었다 — 같은 관측에서 다른 판단이 나올 수도 있다
          </p>
        </div>

        <div className={styles.verdict} data-band={insight.band}>
          <span>{insight.verdict}</span>
          <strong>{formatPercent(pr)}</strong>
        </div>
      </header>

      {/* 하루 곡선과 그 위에 선 사건들 */}
      <section className={styles.track} aria-label="시간대별 발전량과 진단 시각">
        <svg
          className={styles.track__svg}
          viewBox={`0 -10 ${VIEW.width} ${VIEW.height + 44}`}
          fill="none"
          preserveAspectRatio="none"
          role="img"
          aria-label={`하루 발전 곡선. 짚은 시각 ${moments.length}곳.`}
        >
          {/* 일사 곡선을 뒤에 옅게 깐다 — 발전이 햇빛을 따라갔는지 겹쳐 보라는 뜻이다 */}
          <polyline points={sunCurve} stroke="var(--chart-irradiance)" strokeWidth="2" strokeDasharray="6 5" opacity="0.5" />

          <polygon points={`0,${VIEW.height} ${curve} ${VIEW.width},${VIEW.height}`} fill="var(--chart-generation)" fillOpacity="0.14" />
          <polyline points={curve} stroke="var(--chart-generation)" strokeWidth="3" strokeLinejoin="round" />

          {moments.map((moment) => (
            <g key={moment.kind}>
              <line
                className={styles.pin}
                data-kind={moment.kind}
                x1={xOf(moment.hour)}
                y1={yOf(stats.hourly[Math.round(moment.hour)] ?? 0)}
                x2={xOf(moment.hour)}
                y2={VIEW.height}
              />
              <circle
                className={styles.dot}
                data-kind={moment.kind}
                cx={xOf(moment.hour)}
                cy={yOf(stats.hourly[Math.round(moment.hour)] ?? 0)}
                r="6"
              />
              <text className={styles.hour} x={xOf(moment.hour)} y={VIEW.height + 22} textAnchor="middle">
                {Math.round(moment.hour)}시
              </text>
            </g>
          ))}
        </svg>
      </section>

      {/* 사건마다 관측과 판단을 갈라 적는다 */}
      <div className={styles.cards}>
        {moments.map((moment, index) => (
          <article key={moment.kind} className={styles.card} data-kind={moment.kind}>
            <header className={styles.card__head}>
              <span className={styles.card__no}>{index + 1}</span>
              <div>
                <h3 className={styles.card__label}>{moment.label}</h3>
                <p className={styles.card__hour}>{Math.round(moment.hour)}시</p>
              </div>
            </header>

            <dl className={styles.card__body}>
              <div>
                <dt>관측</dt>
                <dd>{moment.saw}</dd>
              </div>
              <div>
                <dt>판단</dt>
                <dd className={styles.card__judged}>{moment.judged}</dd>
              </div>
            </dl>
          </article>
        ))}
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
      saw: `일사강도가 0을 벗어나 계측이 잡히기 시작했다 (${formatNumber(SUNRISE_HOUR, 1)}시).`,
      judged: '기동 시각이 일출과 어긋나지 않는다. 인버터 기동 지연 없음.',
    },
    {
      hour: peakHour,
      kind: 'peak',
      label: '최대 출력',
      saw: `이 시각 발전량이 ${formatNumber(maxOutput, 1)}kWh 로 하루 중 가장 높았다.`,
      judged: '봉우리가 남중 시각 부근에 있다. 방위·경사에 큰 문제 없음.',
    },
  ];

  if (dipHour !== null) {
    moments.push({
      hour: dipHour,
      kind: 'dip',
      label: '출력 꺾임',
      saw: `햇빛은 남아 있는데 발전만 기대의 ${formatPercent(worst)} 수준으로 떨어졌다.`,
      judged: '한 시각에 그친 꺾임은 대개 구름이다. 여러 날 같은 시각에 반복되면 그림자를 의심한다.',
    });
  }

  moments.push({
    hour: stats.nowHour,
    kind: 'now',
    label: '지금',
    saw: `일사 ${formatNumber(stats.irradianceNow)}W/m² (STC의 ${formatPercent(stats.irradianceNow / FULL_SUN_WM2)}), 출력 ${formatNumber(stats.outputKw, 1)}kW.`,
    judged: stats.isLive
      ? '계측이 살아 있고 출력이 일사에 따라붙고 있다. 이상 신호 없음.'
      : '계측값이 들어오지 않는다. 값이 없으면 판단하지 않는다.',
  });

  moments.push({
    hour: SUNSET_HOUR,
    kind: 'sunset',
    label: '발전 종료 예정',
    saw: `일몰 ${formatNumber(SUNSET_HOUR, 1)}시. 남은 시간의 발전량은 예측값이다.`,
    judged: `하루 마감 시 ${formatNumber(stats.dayKwh)}kWh 를 예상한다. 기대치는 ${formatNumber(stats.expectedKwh)}kWh.`,
  });

  return moments.sort((a, b) => a.hour - b.hour);
}
