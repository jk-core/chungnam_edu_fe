import { ClockIcon, LeafIcon, SchoolIcon, SunIcon } from '@/components/common/Icon';
import { CO2_PER_KWH } from '@/mocks/generation';
import { REGION_TOTAL } from '@/mocks/regions';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { formatCapacity, formatCarbon, formatEnergy } from '@/utils/format';
import styles from './KpiStrip.module.scss';

const toNumber = (value: string) => Number(value.replace(/,/g, ''));

/**
 * 홈 요약 지표.
 *
 * 넷을 모두 **오늘** 하나로 맞춘다. 금일 발전량 옆에 금월과 누적이 섞여 있으면 같은 줄을
 * 읽는데 기준 기간이 셋이 되어, 어느 수가 무엇을 말하는지 매번 라벨을 다시 봐야 했다.
 */
export function KpiStrip() {
  const capacity = formatCapacity(REGION_TOTAL.capacityKw);
  const today = formatEnergy(REGION_TOTAL.todayKwh);
  // 발전시간 = 발전량 ÷ 설비용량. 용량이 다른 설비를 같은 눈금에 세우는 값이다.
  const hours = REGION_TOTAL.capacityKw > 0 ? REGION_TOTAL.todayKwh / REGION_TOTAL.capacityKw : 0;
  const carbon = formatCarbon(REGION_TOTAL.todayKwh * CO2_PER_KWH);

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
            label="금일 발전시간"
            value={hours}
            unit="h"
            fractionDigits={1}
            deltaLabel="설비용량 대비"
            icon={<ClockIcon />}
          />
        </Reveal>
        <Reveal delay={0.18}>
          <StatCard
            label="금일 CO₂ 저감"
            value={toNumber(carbon.value)}
            unit={carbon.unit}
            fractionDigits={1}
            icon={<LeafIcon />}
            deltaLabel="발전량 환산"
          />
        </Reveal>
      </div>
    </section>
  );
}
