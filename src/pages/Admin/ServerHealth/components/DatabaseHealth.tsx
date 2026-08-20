import { Card } from '@/components/common/Card';
import { DB_HEALTH } from '@/mocks/serverHealth';
import { Reveal } from '@/components/common/Reveal';
import { formatNumber } from '@/utils/format';
import styles from '../../Admin.module.scss';

/** 데이터베이스 상태 (ECR-003-13). 백업과 복제 지연을 함께 둔다 — 살아 있어도 뒤처져 있을 수 있다. */
export function DatabaseHealth() {
  return (
    <Reveal delay={0.1}>
      <Card title="데이터베이스 상태" description="연결 수와 저장소, 백업·복제 지연을 함께 봅니다.">
        <dl className={styles.infoGrid}>
          <Fact name="연결" value={`${formatNumber(DB_HEALTH.connections)} / ${formatNumber(DB_HEALTH.maxConnections)}`} />
          <Fact name="초당 질의" value={`${formatNumber(DB_HEALTH.qps)} QPS`} />
          <Fact name="가장 느린 질의" value={`${formatNumber(DB_HEALTH.slowestSeconds, 1)}초`} />
          <Fact name="저장소 사용률" value={`${formatNumber(DB_HEALTH.storageUsed)}%`} />
          <Fact name="마지막 백업" value={DB_HEALTH.lastBackupAt} />
          <Fact name="복제 지연" value={`${formatNumber(DB_HEALTH.replicaLagSeconds, 1)}초`} />
        </dl>
      </Card>
    </Reveal>
  );
}

/** 이름과 값 한 쌍 — 같은 모양이 여섯 번 되풀이된다 */
function Fact({ name, value }: { name: string; value: string }) {
  return (
    <div>
      <dt>{name}</dt>
      <dd>{value}</dd>
    </div>
  );
}
