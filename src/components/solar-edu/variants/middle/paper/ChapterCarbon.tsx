import { CountUp } from '@/components/common/CountUp';
import { CARBON_BASIS, paperCarbonFigure, paperScales, type PaperScript } from '@/mocks/eduPaper';
import type { EduLevel } from '@/interface/edu';
import type { EduStats } from '@/mocks/solarEdu';
import { formatKoCount, formatNumber, scaleCarbon, scaleSi } from '@/utils/format';
import { GrowingTree } from '@/components/solar-edu/GrowingTree';
import { CO2_PER_KWH, growthStage, kwhToTrees } from '@/utils/eco';
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

        {/* 고등은 나무 자리에 식을 놓는다 — 화면에 글을 늘리지 않고 판을 가르는 쪽 */}
        {showsBasis && <CarbonMath stats={stats} />}

        {/*
          중등까지는 그림이 한 장 선다 (2026-09-16 지시 — 중·고등을 다른 시안으로).

          「오늘 줄인 탄소 28.6t」 은 크기를 가늠할 수 없는 수다. 나무가 자란 만큼으로 바꿔 두면
          그 수가 눈에 잡히는 크기가 된다 — 아래 잣대 셋이 말로 하는 환산을 그림이 한 번에 한다.

          고등에는 두지 않는다. 그쪽은 같은 자리를 **셈의 근거**(`CARBON_BASIS`)가 받는다 —
          무엇으로 나눈 값인지가 궁금해지는 눈높이라, 그림보다 분모가 먼저다.
        */}
        {!showsBasis && (
          <div className={styles.total__tree}>
            <GrowingTree stage={growthStage(stats.loadRatio)} trees={kwhToTrees(stats.todayKwh)} />
          </div>
        )}
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

/** 발전량 × 계수 = 탄소. 오늘치와 누적치 두 줄뿐이고 설명은 붙이지 않는다 (2026-09-16 지시). */
function CarbonMath({ stats }: { stats: EduStats }) {
  const rows = [
    { id: 'today', term: '오늘', kwh: stats.todayKwh },
    { id: 'total', term: '지금까지', kwh: stats.totalKwh },
  ].map((row) => ({
    ...row,
    power: scaleSi(row.kwh, 'Wh'),
    carbon: scaleCarbon(row.kwh * CO2_PER_KWH),
  }));

  return (
    <div className={styles.math}>
      {/* 계수는 두 줄이 같다 — 줄마다 되풀이하지 않고 머리에 한 번만 건다 */}
      <p className={styles.math__rate}>
        × {CO2_PER_KWH}
        <i>kg/kWh</i>
      </p>

      <ol className={styles.math__rows}>
        {rows.map((row) => (
          <li key={row.id} className={styles.math__row}>
            <span className={styles.math__term}>{row.term}</span>

            <span className={styles.math__cell}>
              {formatNumber(row.power.amount, row.power.fractionDigits)}
              <i>{row.power.unit}</i>
            </span>

            <span className={styles.math__sign} aria-hidden="true">
              →
            </span>

            <span className={styles.math__cell} data-out="">
              {formatNumber(row.carbon.amount, row.carbon.fractionDigits)}
              <i>{row.carbon.unit}</i>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
