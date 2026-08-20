import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { NOW } from '@/mocks/today';
import { resourceLevel, SERVER_ROLE_LABEL, SERVERS, worstLevel } from '@/mocks/serverHealth';
import { Reveal } from '@/components/common/Reveal';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { ServerNode } from '@/interface/serverHealth';
import styles from '../../Admin.module.scss';
import { LEVEL_LABEL, LEVEL_TONE } from './serverLevel';

/**
 * 서버별 자원 사용률 (ECR-002-20).
 *
 * 카드 테두리에 색이 드는 것은 셋 중 **가장 나쁜** 값이 정한다 — CPU 가 조용해도 디스크가 차
 * 있으면 그 서버는 손봐야 한다.
 */
export function ServerGrid() {
  return (
    <Reveal delay={0.06}>
      <Card
        title="서버 자원 사용률"
        description={`${NOW.format('HH:mm')} 기준. CPU·메모리·디스크가 임계선을 넘으면 카드에 색이 들어옵니다.`}
      >
        <div className={styles.serverGrid}>
          {SERVERS.map((server) => <ServerCard key={server.id} server={server} />)}
        </div>
      </Card>
    </Reveal>
  );
}

/** 서버 한 대 — 사용률 셋을 막대로 세워 둔다 */
function ServerCard({ server }: { server: ServerNode }) {
  const level = worstLevel(server);

  return (
    <div
      className={cn(styles.server, {
        [styles['server--warning']]: level === 'warning',
        [styles['server--critical']]: level === 'critical',
      })}
    >
      <p className={styles.server__head}>
        <strong>{server.name}</strong>
        {/* 꺼진 서버에는 자원 등급이 없다 — 0% 를 「정상」 이라 적으면 안 된다 */}
        <Badge tone={server.up ? LEVEL_TONE[level] : 'critical'} withDot>
          {server.up ? LEVEL_LABEL[level] : '중지'}
        </Badge>
      </p>
      <p className={styles.server__role}>
        {SERVER_ROLE_LABEL[server.role]} · {formatNumber(server.uptimeDays)}일 연속 가동
      </p>

      <Meter label="CPU" value={server.cpu} />
      <Meter label="메모리" value={server.memory} />
      <Meter label="디스크" value={server.disk} />

      <p className={styles.server__net}>네트워크 {formatNumber(server.networkMbps)}Mbps</p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const level = resourceLevel(value);

  return (
    <div className={styles.meter}>
      <span className={styles.meter__label}>{label}</span>
      <span className={styles.meter__track}>
        <span
          className={cn(styles.meter__bar, {
            [styles['meter__bar--warning']]: level === 'warning',
            [styles['meter__bar--critical']]: level === 'critical',
          })}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </span>
      <span className={styles.meter__value}>{formatNumber(value)}%</span>
    </div>
  );
}
