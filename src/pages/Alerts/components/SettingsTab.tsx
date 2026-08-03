import { useState } from 'react';
import { ALERT_RULES } from '@/mocks/alerts';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import { Switch } from '@/components/common/Switch';
import { cn } from '@/utils/cn';
import styles from '../Alerts.module.scss';

const CHANNEL_HINT: Record<string, string> = {
  시스템: '화면 상단 알림',
  문자: '담당자 휴대폰',
  메일: '업무용 메일',
};

export function SettingsTab() {
  // 목업이라 저장하지 않고 화면 안에서만 상태를 바꾼다.
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALERT_RULES.map((rule) => [rule.id, rule.enabled])),
  );

  const onCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          eyebrow="Rules"
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
                    <Badge tone={SEVERITY_TONE[rule.severity]} withDot>
                      {SEVERITY_LABEL[rule.severity]}
                    </Badge>
                    <Badge tone="neutral">{rule.type}</Badge>
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

      <Reveal delay={0.08}>
        <Card eyebrow="Note" title="알아 두실 점" variant="outline">
          <ul className={styles.notes}>
            <li>긴급 알림은 조건을 꺼도 시스템 화면에는 남습니다. 문자·메일 발송만 멈춥니다.</li>
            <li>수신 담당자는 시스템 관리에서 학교별로 지정합니다.</li>
            <li>여기서 바꾼 값은 저장되지 않습니다. 목업 화면입니다.</li>
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}
