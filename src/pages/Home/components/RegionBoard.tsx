import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/common/Card';
import { REGIONS } from '@/mocks/regions';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { formatEnergy, formatNumber } from '@/utils/format';
import styles from './RegionBoard.module.scss';

type Metric = 'today' | 'month';

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'month', label: '이번 달' },
];

export function RegionBoard() {
  const [metric, setMetric] = useState<Metric>('today');

  const rows = useMemo(() => {
    const sorted = [...REGIONS].sort((a, b) =>
      metric === 'today' ? b.todayKwh - a.todayKwh : b.monthKwh - a.monthKwh,
    );
    const max = metric === 'today' ? sorted[0].todayKwh : sorted[0].monthKwh;

    return sorted.map((region) => {
      const value = metric === 'today' ? region.todayKwh : region.monthKwh;

      return { ...region, value, ratio: value / max };
    });
  }, [metric]);

  return (
    <section className={styles.board} aria-labelledby="region-title">
      <div className={styles.board__inner}>
        <Reveal>
          <Card
            eyebrow="Regions"
            title={<span id="region-title">시·군별 발전 현황</span>}
            description="충청남도 15개 시·군의 학교 태양광 발전량입니다. 막대는 1위 시·군 대비 비율입니다."
            action={
              <SegmentedControl
                label="집계 기간"
                size="sm"
                options={METRIC_OPTIONS}
                value={metric}
                onChange={setMetric}
              />
            }
            padding="none"
          >
            <ul className={styles.board__list}>
              {rows.map((row, index) => {
                const energy = formatEnergy(row.value);

                return (
                  <li key={row.code} className={styles.board__row}>
                    <span className={styles.board__rank}>{String(index + 1).padStart(2, '0')}</span>

                    <span className={styles.board__name}>
                      {row.name}
                      <span className={styles.board__schools}>{row.schoolCount}교</span>
                    </span>

                    <span className={styles.board__barTrack}>
                      <motion.span
                        className={styles.board__barFill}
                        initial={false}
                        animate={{ width: `${row.ratio * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 0.68, 0.32, 1] }}
                      />
                    </span>

                    <span className={styles.board__value}>
                      {energy.value}
                      <span className={styles.board__unit}>{energy.unit}</span>
                    </span>

                    <span className={styles.board__capacity}>{formatNumber(row.capacityKw)} kW</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
