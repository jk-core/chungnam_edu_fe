import { BoltIcon, LeafIcon, SchoolIcon, SunIcon } from '@/components/common/Icon';
import { CUMULATIVE } from '@/mocks/generation';
import { REGION_TOTAL } from '@/mocks/regions';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { formatCapacity, formatCarbon, formatEnergy } from '@/utils/format';
import styles from './KpiStrip.module.scss';

const toNumber = (value: string) => Number(value.replace(/,/g, ''));

export function KpiStrip() {
  const capacity = formatCapacity(REGION_TOTAL.capacityKw);
  const today = formatEnergy(REGION_TOTAL.todayKwh);
  const month = formatEnergy(REGION_TOTAL.monthKwh);
  const carbon = formatCarbon(CUMULATIVE.co2SavedKg);

  return (
    <section className={styles.kpi} aria-label="전체 요약 지표">
      <div className={styles.kpi__inner}>
        <Reveal>
          <StatCard
            label="총 설비용량"
            value={toNumber(capacity.value)}
            unit={capacity.unit}
            fractionDigits={2}
            icon={<SchoolIcon />}
            meter={0.72}
            meterLabel="보급 목표 72%"
          />
        </Reveal>
        <Reveal delay={0.06}>
          <StatCard
            label="금일 발전량"
            value={toNumber(today.value)}
            unit={today.unit}
            fractionDigits={1}
            delta={0.084}
            deltaLabel="전일 대비"
            icon={<SunIcon />}
            accent
          />
        </Reveal>
        <Reveal delay={0.12}>
          <StatCard
            label="금월 발전량"
            value={toNumber(month.value)}
            unit={month.unit}
            fractionDigits={2}
            delta={-0.021}
            deltaLabel="전월 대비"
            icon={<BoltIcon />}
          />
        </Reveal>
        <Reveal delay={0.18}>
          <StatCard
            label="누적 CO₂ 저감"
            value={toNumber(carbon.value)}
            unit={carbon.unit}
            fractionDigits={1}
            icon={<LeafIcon />}
            deltaLabel="2018년 집계 시작"
            delta={0.163}
          />
        </Reveal>
      </div>
    </section>
  );
}
