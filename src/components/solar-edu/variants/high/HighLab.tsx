import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { IMPACT_DEFS } from '@/mocks/eduContent';
import { formatNumber, formatPercent } from '@/utils/format';
import type { HighContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import styles from './HighLab.module.scss';

/**
 * 손실 분해에 쓰는 어림 배분.
 *
 * 실제 손실 계측값은 목데이터에 없다. 기대 대비 모자란 몫을 **왜 모자랐는지** 로 나눠 보이되,
 * 화면에 "어림한 배분" 이라고 밝힌다 — 고등 판이라도 지어 낸 수를 실측인 척 내놓지 않는다.
 */
const LOSS_SHARE = [
  { id: 'weather', label: '날씨(구름·일사 부족)', share: 0.52, tone: 'brand' },
  { id: 'heat', label: '온도 상승에 따른 효율 저하', share: 0.24, tone: 'caution' },
  { id: 'angle', label: '입사각·그림자', share: 0.16, tone: 'solar' },
  { id: 'system', label: '배선·인버터 변환', share: 0.08, tone: 'offline' },
] as const;

interface HighLabProps {
  scopeLabel: string;
  stats: EduStats;
  content: HighContent;
}

/**
 * 고등 판 · 시안 C — 데이터 랩 (SFR-005-02/03).
 *
 * 현행 시안은 값을 보여 주고 AI 가 그 뜻을 풀어 준다. 읽기는 편하지만 학생은 **결론을 받는** 쪽에 선다.
 *
 * 이 시안은 결론 대신 **재료** 를 준다. 성능비, 일사-발전 상관, 손실 분해 — 실제 태양광 엔지니어가
 * 설비를 판정할 때 보는 지표를 그대로 늘어놓고, 어떻게 셈했는지 식을 함께 적는다.
 * 진로를 이 분야로 생각해 보는 학생에게는 "이 일이 이런 숫자를 다루는 일" 이라는 것이 곧 정보다.
 */
export function HighLab({ scopeLabel, stats, content }: HighLabProps) {
  // 성능비(PR) — 같은 일사에서 기대되는 양 대비 실제로 만든 양. 설비 건강도의 표준 지표다.
  const pr = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;
  const lossKwh = Math.max(0, stats.expectedKwh - stats.dayKwh);
  const daylight = SUNSET_HOUR - SUNRISE_HOUR;
  const impact = IMPACT_DEFS[content.impact.itemIds[0] ?? 'co2'];

  return (
    <div className={styles.lab}>
      {/* 위 — 판정 지표 넷 */}
      <header className={styles.metrics}>
        <Metric
          label="성능비 (PR)"
          value={formatPercent(pr)}
          formula="실측 발전량 ÷ 같은 일사에서의 기대 발전량"
          note={`${formatNumber(stats.dayKwh)} ÷ ${formatNumber(stats.expectedKwh)} kWh`}
          tone={pr >= 0.8 ? 'ok' : pr >= 0.65 ? 'caution' : 'critical'}
        />
        <Metric
          label="이용률 (CF)"
          value={formatPercent(stats.capacityFactor)}
          formula="하루 발전량 ÷ (설비용량 × 24h)"
          note={`${formatNumber(stats.dayKwh)} ÷ (${formatNumber(stats.capacityKw)} × 24)`}
          tone="brand"
        />
        <Metric
          label="등가 발전시간"
          value={`${formatNumber(stats.equivalentHours, 2)} h`}
          formula="하루 발전량 ÷ 설비용량"
          note={`일조 ${formatNumber(daylight, 1)}h 중 ${formatPercent(stats.equivalentHours / daylight)}`}
          tone="solar"
        />
        <Metric
          label="적산 일사"
          value={`${formatNumber(stats.insolation, 2)} kWh/m²`}
          formula="시간대별 일사강도의 하루 적분"
          note={`지금 ${formatNumber(stats.irradianceNow)} W/m² (STC의 ${formatPercent(stats.irradianceNow / FULL_SUN_WM2)})`}
          tone="solar"
        />
      </header>

      <div className={styles.grid}>
        {/* 왼쪽 — 시계열. 일사와 발전이 같은 모양인지가 첫 진단이다 */}
        <section className={styles.panel} aria-label="일사와 발전량 시계열">
          <h2 className={styles.panel__title}>
            시계열
            <span>발전량 · 일사강도</span>
          </h2>
          <div className={styles.panel__body}>
            <DayCurve stats={stats} showIrradiance />
          </div>
          <p className={styles.panel__foot}>
            두 곡선의 모양이 어긋나면 설비를 의심한다 — 햇빛은 그대로인데 발전만 꺾인 시각이 있는지 본다.
          </p>
        </section>

        {/* 가운데 — 상관. 점이 직선에서 벗어나는 곳이 곧 이상 후보다 */}
        <section className={styles.panel} aria-label="일사 대 발전량 산점도">
          <h2 className={styles.panel__title}>
            일사–발전 상관
            <span>시각별 {stats.hourly.length}점</span>
          </h2>
          <div className={styles.panel__body}>
            <Scatter stats={stats} />
          </div>
          <p className={styles.panel__foot}>
            정상 설비는 점이 원점을 지나는 직선에 모인다. 아래로 처진 점은 그 시각에 무언가 있었다는 뜻이다.
          </p>
        </section>

        {/* 오른쪽 — 손실 분해. 모자란 몫을 왜 모자랐는지로 나눈다 */}
        <section className={styles.panel} aria-label="손실 분해">
          <h2 className={styles.panel__title}>
            손실 분해
            <span>{formatNumber(lossKwh)}kWh</span>
          </h2>

          <div className={styles.panel__body}>
            <ul className={styles.losses}>
              {LOSS_SHARE.map((loss) => (
                <li key={loss.id} className={styles.loss} data-tone={loss.tone}>
                  <span className={styles.loss__label}>{loss.label}</span>
                  <div className={styles.loss__track}>
                    <span
                      className={styles.loss__fill}
                      style={{ inlineSize: `${(loss.share * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className={styles.loss__value}>{formatNumber(lossKwh * loss.share, 1)}</span>
                </li>
              ))}
            </ul>

            <dl className={styles.summary}>
              <div>
                <dt>기대 발전량</dt>
                <dd>{formatNumber(stats.expectedKwh)} kWh</dd>
              </div>
              <div>
                <dt>실측 발전량</dt>
                <dd>{formatNumber(stats.dayKwh)} kWh</dd>
              </div>
              <div>
                <dt>{impact.label}</dt>
                <dd>{formatNumber(stats.dayKwh * impact.perKwh, impact.fractionDigits)} {impact.unit}</dd>
              </div>
            </dl>
          </div>

          {/* 지어 낸 배분을 실측인 척 내놓지 않는다 */}
          <p className={styles.panel__foot}>
            분해 비율은 이 설비의 계측 손실이 아니라 일반적인 배분으로 어림한 값이다.
            실제 진단은 회로별 계측값으로 이 몫을 가른다.
          </p>
        </section>
      </div>

      <footer className={styles.caption}>
        {scopeLabel} · {content.impact.note(scopeLabel, stats)}
      </footer>
    </div>
  );
}

/** 위쪽 판정 지표 한 칸 — 값과 함께 **어떻게 셈했는지** 를 적는 것이 이 시안의 규칙이다 */
function Metric({
  label,
  value,
  formula,
  note,
  tone,
}: {
  label: string;
  value: string;
  formula: string;
  note: string;
  tone: 'ok' | 'caution' | 'critical' | 'brand' | 'solar';
}) {
  return (
    <article className={styles.metric} data-tone={tone}>
      <h2 className={styles.metric__label}>{label}</h2>
      <p className={styles.metric__value}>{value}</p>
      <p className={styles.metric__formula}>{formula}</p>
      <p className={styles.metric__note}>{note}</p>
    </article>
  );
}

/**
 * 일사 대 발전량 산점도.
 *
 * echarts 를 한 번 더 띄우는 대신 직접 그린다 — 점 스물넷에 축 둘뿐이라 라이브러리를 부를 일이 아니고,
 * 걸어 두는 화면에서 차트 인스턴스를 하나라도 줄이는 편이 낫다.
 */
function Scatter({ stats }: { stats: EduStats }) {
  const width = 220;
  const height = 170;
  const maxIrradiance = Math.max(...stats.irradianceSeries, 0.001);
  const maxOutput = Math.max(...stats.hourly, 0.001);

  const points = stats.hourly
    .map((kwh, hour) => ({
      hour,
      x: (stats.irradianceSeries[hour] / maxIrradiance) * width,
      y: height - (kwh / maxOutput) * height,
      lit: kwh > 0 || stats.irradianceSeries[hour] > 0,
    }))
    .filter((point) => point.lit);

  return (
    <svg className={styles.scatter} viewBox={`-8 -8 ${width + 24} ${height + 28}`} fill="none" role="img" aria-label="일사강도 대 발전량 산점도">
      {/* 기준선 — 정상 설비라면 점이 이 선에 모인다 */}
      <line x1="0" y1={height} x2={width} y2="0" stroke="var(--chart-compare)" strokeWidth="1.5" strokeDasharray="5 4" />

      <line x1="0" y1={height} x2={width} y2={height} stroke="var(--chart-axis)" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2={height} stroke="var(--chart-axis)" strokeWidth="1" />

      {points.map((point) => (
        <circle key={point.hour} cx={point.x} cy={point.y} r="4" fill="var(--chart-generation)" fillOpacity="0.75">
          <title>{`${point.hour}시`}</title>
        </circle>
      ))}

      <text x={width} y={height + 18} textAnchor="end" className={styles.scatter__axis}>
        일사강도 →
      </text>
      <text x="2" y="-2" className={styles.scatter__axis}>
        ↑ 발전량
      </text>
    </svg>
  );
}
