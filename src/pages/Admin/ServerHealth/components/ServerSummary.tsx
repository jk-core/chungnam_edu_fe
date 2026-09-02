import { RESOURCE_CRITICAL, RESOURCE_WARNING } from '@/configs/serverHealth';
import { SERVERS } from '@/mocks/serverHealth';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import styles from '../../Admin.module.scss';

/**
 * 서버 자원 머리 세 값 (ECR-002-20).
 *
 * 평균과 최고를 나란히 둔다 — 평균만 보면 한 대가 90% 를 치고 있어도 여러 대에 묻혀 조용해 보인다.
 */
export function ServerSummary() {
  const downCount = SERVERS.filter((server) => !server.up).length;
  const worstCpu = Math.max(...SERVERS.map((server) => server.cpu));
  const averageCpu = SERVERS.reduce((sum, server) => sum + server.cpu, 0) / SERVERS.length;

  return (
    <Reveal delay={0.04}>
      <div className={`${styles.summary} ${styles['summary--three']}`}>
        <StatCard label="가동 서버" value={SERVERS.length - downCount} unit={`대 / ${SERVERS.length}대`} accent />
        <StatCard label="평균 CPU" value={averageCpu} unit="%" fractionDigits={1} meter={averageCpu / 100} />
        <StatCard
          label="최고 CPU"
          value={worstCpu}
          unit="%"
          meter={worstCpu / 100}
          meterLabel={`주의 ${RESOURCE_WARNING}% · 위험 ${RESOURCE_CRITICAL}%`}
        />
      </div>
    </Reveal>
  );
}
