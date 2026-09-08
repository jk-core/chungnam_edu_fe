import { CountUp } from '@/components/common/CountUp';
import { CARBON_BASIS, paperCarbonFigure, paperScales, type PaperScript } from '@/mocks/eduPaper';
import type { EduLevel } from '@/interface/edu';
import type { EduStats } from '@/mocks/solarEdu';
import { formatKoCount } from '@/utils/format';
import { ScaleGlyph } from './PaperGlyphs';
import styles from './ChapterCarbon.module.scss';

interface ChapterCarbonProps {
  stats: EduStats;
  script: PaperScript;
  level: EduLevel;
}

/**
 * 3장 — 줄인 탄소를 익숙한 것으로 바꿔 본다 (SFR-005-05).
 *
 * 「34t」 은 큰 수인지 작은 수인지 가늠이 서지 않는 값이다. 같은 양을 소나무 그루,
 * 자동차 주행 거리, 가구 사용일로 바꿔 놓아야 크기가 몸에 붙는다.
 *
 * 세 잣대는 막대가 아니라 **그림을 반복해** 보인다. 서로 단위가 다른 값이라 막대 길이를
 * 나란히 두면 길이끼리 견주게 되는데, 그 견줌에는 뜻이 없다. 그림 하나가 맡는 몫을 밝히고
 * 그것을 늘어놓으면, 길이가 아니라 덩어리 수로 크기가 읽힌다.
 */
export function ChapterCarbon({ stats, script, level }: ChapterCarbonProps) {
  const carbon = paperCarbonFigure(stats);
  const scales = paperScales(stats, script);

  // 고등만 셈의 근거를 편다 — 값이 어디서 왔는지 따져 볼 수 있는 눈높이다
  const showsBasis = level === 'high';

  return (
    <div className={styles.carbon}>
      <section className={styles.total}>
        <p className={styles.total__term}>오늘 줄인 탄소</p>

        <p className={styles.total__figure}>
          <CountUp value={carbon.amount} fractionDigits={carbon.fractionDigits} />
          <span className={styles.total__unit}>{carbon.unit}</span>
        </p>

        <p className={styles.total__note}>{script.heads.carbon.lead}</p>

        {showsBasis && <p className={styles.total__basis}>{CARBON_BASIS}</p>}
      </section>

      <ol className={styles.scales}>
        {scales.map((scale) => (
          <li key={scale.id} className={styles.scale}>
            <p className={styles.scale__term}>{scale.term}</p>

            <p className={styles.scale__figure}>
              <CountUp value={scale.amount} fractionDigits={scale.fractionDigits} />
              {scale.countSuffix}
              <span className={styles.scale__unit}>{scale.unit}</span>
            </p>

            <p className={styles.scale__glyphs} aria-hidden="true">
              {/* 그림이 한꺼번에 뜨면 개수가 아니라 덩어리로 보인다 — 하나씩 차례로 놓는다 */}
              {Array.from({ length: scale.glyphs }, (_, index) => (
                <span key={index} className={styles.scale__glyph} style={{ animationDelay: `${index * 70}ms` }}>
                  <ScaleGlyph id={scale.id} />
                </span>
              ))}
            </p>

            <p className={styles.scale__legend}>
              그림 하나 = {formatKoCount(scale.perGlyph)}
              {scale.unit}
            </p>

            <p className={styles.scale__note}>{scale.note}</p>

            {showsBasis && <p className={styles.scale__basis}>{scale.basis}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
