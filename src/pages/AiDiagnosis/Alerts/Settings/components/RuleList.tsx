import { useState } from 'react';
import { ALERT_RULES } from '@/mocks/alerts';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { Reveal } from '@/components/common/Reveal';
import { Switch } from '@/components/common/Switch';
import styles from '../../Alerts.module.scss';

/** 발송 수단마다 어디로 가는지 — 이름만으로는 알기 어렵다 */
const CHANNEL_HINT: Record<string, string> = {
  시스템: '화면 상단 알림',
  문자: '담당자 휴대폰',
  메일: '업무용 메일',
};

/** 알림 조건 목록 (SFR-022-06). 목업이라 저장하지 않고 화면 안에서만 상태를 바꾼다. */
export function RuleList() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALERT_RULES.map((rule) => [rule.id, rule.enabled])),
  );

  const onCount = Object.values(enabled).filter(Boolean).length;

  return (
    <Reveal>
      <Card
        title="알림 조건"
        description={`${ALERT_RULES.length}개 조건 중 ${onCount}개가 켜져 있습니다. 끄면 해당 상황이 생겨도 알림을 보내지 않습니다.`}
        padding="none"
      >
        <ul className={styles.ruleList}>
          {ALERT_RULES.map((rule) => (
            <li key={rule.id} className={cn(styles.rule, { [styles['rule--off']]: !enabled[rule.id] })}>
              <div className={styles.rule__main}>
                <div className={styles.rule__head}>
                  <span className={styles.rule__label}>{rule.label}</span>
                  <Badge tone={OPERATION_TONE[rule.status]} withDot>
                    {OPERATION_LABEL[rule.status]}
                  </Badge>
                </div>
                <p className={styles.rule__description}>{rule.description}</p>
                <p className={styles.rule__threshold}>기준 · {rule.threshold}</p>
              </div>

              <ul className={styles.rule__channels}>
                {rule.channels.map((channel) => (
                  <li key={channel} className={styles.rule__channel} title={CHANNEL_HINT[channel]}>
                    {channel}
                  </li>
                ))}
              </ul>

              <Switch
                label={`${rule.label} 알림 받기`}
                checked={enabled[rule.id]}
                onChange={(next) => setEnabled((prev) => ({ ...prev, [rule.id]: next }))}
              />
            </li>
          ))}
        </ul>
      </Card>
    </Reveal>
  );
}
