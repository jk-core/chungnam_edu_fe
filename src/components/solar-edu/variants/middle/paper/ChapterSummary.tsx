import { CountUp } from '@/components/common/CountUp';
import { paperExtraReadings, paperReadings, type PaperScript } from '@/mocks/eduPaper';
import type { EduLevel } from '@/interface/edu';
import type { EduStats } from '@/mocks/solarEdu';
import { formatCapacity, formatPercent } from '@/utils/format';
import { PaperDayArt } from './PaperDayArt';
import styles from './ChapterSummary.module.scss';

interface ChapterSummaryProps {
  stats: EduStats;
  script: PaperScript;
  level: EduLevel;
}

/**
 * 1장 — 지금 얼마나 만들고 있나 (SFR-005-02).
 *
 * 값을 칸에 나눠 담지 않고 **한 줄씩 읽어 내린다**. 지표를 격자에 늘어놓으면 다섯 개가
 * 동시에 눈에 들어와 어느 것부터 읽어야 할지가 없어진다. 지금 이 순간의 출력 하나만
 * 크게 세우고 나머지는 그 아래로 흐르게 두면, 읽는 순서가 곧 이해하는 순서가 된다.
 *
 * 값마다 오른쪽에 그것이 무슨 뜻인지 한 문장을 단다 — 숫자만 있으면 표이고,
 * 이 한 문장이 붙어야 설명이 된다.
 *
 * 읽어 내리는 줄 수가 눈높이를 따라 갈린다. 초·중등은 셋, 고등은 값을 재는 기준 둘을 더해
 * 다섯이다.
 */
export function ChapterSummary({ stats, script, level }: ChapterSummaryProps) {
  /*
    고등에만 두 줄이 더 붙는다.
    일사량은 출력이 왜 그만큼인지를 설명하는 원인이고, 이용률은 설비 크기가 다른 학교끼리
    견주는 잣대다. 초·중등에 두면 읽을 것이 많아지기만 한다.
  */
  const readings = level === 'high'
    ? [...paperReadings(stats, script), ...paperExtraReadings(stats)]
    : paperReadings(stats, script);

  const [hero, ...rest] = readings;
  const capacity = formatCapacity(stats.capacityKw);

  // 지금 출력이 설비용량의 어디쯤인지. 눈금 하나로 값의 크기를 함께 읽게 한다.
  const ratio = Math.max(0, Math.min(1, stats.loadRatio));

  return (
    <div className={styles.summary}>
      <section className={styles.now}>
        <p className={styles.now__term}>{hero.term}</p>

        <p className={styles.now__figure}>
          <CountUp value={hero.amount} fractionDigits={hero.fractionDigits} />
          <span className={styles.now__unit}>{hero.unit}</span>
        </p>

        {/* 설비용량 위 어디쯤인지 — 눈금 하나로 큰 수치의 크기를 함께 읽는다 */}
        <div className={styles.gauge}>
          <span className={styles.gauge__track}>
            {/* 눈금은 0 에서 자라 오른다 — 숫자가 굴러 오르는 동안 길이도 함께 늘어난다 */}
            <span className={styles.gauge__fill} style={{ inlineSize: `${ratio * 100}%` }} />
          </span>

          <span className={styles.gauge__legend}>
            설비용량 {capacity.value}
            {capacity.unit} 가운데 {formatPercent(ratio, 0)}
          </span>
        </div>

        <p className={styles.now__note}>{hero.note}</p>

        {/* 지금 한 점만으로는 오늘이 어떤 하루였는지 알 수 없다 — 하루 전체를 산 모양으로 한 번 그린다 */}
        <div className={styles.now__art}>
          <PaperDayArt stats={stats} />
        </div>
      </section>

      <ol className={styles.rows}>
        {rest.map((reading) => (
          <li key={reading.id} className={styles.row}>
            <p className={styles.row__term}>{reading.term}</p>

            <p className={styles.row__figure}>
              <CountUp value={reading.amount} fractionDigits={reading.fractionDigits} />
              <span className={styles.row__unit}>{reading.unit}</span>
            </p>

            <p className={styles.row__note}>{reading.note}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
