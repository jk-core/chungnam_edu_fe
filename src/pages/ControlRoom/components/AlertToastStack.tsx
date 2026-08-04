import { useState } from 'react';
import { AlertIcon, ChevronDownIcon, CloseIcon, ExpandIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { formatDuration, formatNumber } from '@/utils/format';
import type { AlertRecord } from '@/interface/alert';
import styles from './AlertToastStack.module.scss';

/** 한 번에 쌓아 두는 최대 건수 — 더 쌓이면 본문을 덮는다 */
const MAX_STACK = 3;

/** 심각도별 표기 — 통신 유형은 설비 고장이 아니라 소식이 끊긴 것이라 따로 부른다 */
const TONE_LABEL = {
  critical: '경고',
  caution: '주의',
  offline: '통신단절',
} as const;

type Tone = keyof typeof TONE_LABEL;

/** 이 경보를 어느 결로 볼지. 통신 문제는 심각도와 별개로 따로 센다. */
export function toneOfAlert(alert: AlertRecord): Tone {
  if (alert.type === '통신') return 'offline';

  return alert.severity === 'critical' ? 'critical' : 'caution';
}

/**
 * 세울 순서. 세 자리뿐이라 최신순으로만 세우면 경고가 주의에 밀려 안 보일 수 있다.
 * 급한 결을 먼저 올리고, 같은 결 안에서 최근 것을 앞세운다.
 */
const TONE_RANK: Record<Tone, number> = { critical: 0, caution: 1, offline: 2 };

export function compareAlerts(a: AlertRecord, b: AlertRecord): number {
  return TONE_RANK[toneOfAlert(a)] - TONE_RANK[toneOfAlert(b)] || (a.occurredAt < b.occurredAt ? 1 : -1);
}

interface AlertToastStackProps {
  /** 아직 손대지 않은 경보 — 최근에 생긴 것이 앞에 온다 */
  alerts: AlertRecord[];
  /** 경과 시간을 재는 기준 시각 */
  now: Date;
  /** 한 건만 닫는다 */
  onDismiss: (id: string) => void;
  /** 떠 있는 것을 한 번에 닫는다 */
  onDismissAll: () => void;
}

/**
 * 미조치 경보 알림창 (SFR-004-14 / SFR-022).
 *
 * 아무도 앞에 없는 벽면 모니터라 모달로 화면을 덮지 않는다. 대신 본문을 가리지 않는
 * 오른쪽 아래에 카드를 쌓아, 지나가다 눈이 닿으면 바로 읽히게 한다.
 * 조치하기 전에는 사라지지 않되, 쌓여서 화면을 잠식하지 않도록 세 건까지만 세우고
 * 나머지는 숫자로만 알린다.
 */
export function AlertToastStack({ alerts, now, onDismiss, onDismissAll }: AlertToastStackProps) {
  // 펼치면 접힌 세 건 대신 전부 세운다. 조작해서 연 화면이라 본문을 가려도 된다.
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) return null;

  const shown = expanded ? alerts : alerts.slice(0, MAX_STACK);

  return (
    <div
      className={cn(styles.stack, { [styles['stack--expanded']]: expanded })}
      role="alert"
      aria-label={`미조치 경보 ${alerts.length}건`}
    >
      <div className={styles.stack__head}>
        <button type="button" className={styles.stack__clear} onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? <ChevronDownIcon width={13} height={13} /> : <ExpandIcon width={13} height={13} />}
          {expanded ? '접기' : `펼치기 ${formatNumber(alerts.length)}`}
        </button>

        <button type="button" className={styles.stack__clear} onClick={onDismissAll}>
          <CloseIcon width={13} height={13} />
          모두 지우기
        </button>
      </div>

      <div className={styles.stack__list}>
        {shown.map((alert) => {
          const tone = toneOfAlert(alert);

          return (
            // 새 경보가 밀려 올라오는 것이 보여야 "방금 생겼다" 는 것이 전해진다
            <article key={alert.id} className={`${styles.toast} ${styles[`toast--${tone}`]}`}>
              {/* 알림 위에 손이 올라갔을 때만 나타난다 — 평소에는 내용만 보이게 둔다 */}
              <button
                type="button"
                className={styles.toast__close}
                onClick={() => onDismiss(alert.id)}
                aria-label={`${alert.schoolName} ${alert.title} 알림 지우기`}
              >
                <CloseIcon width={12} height={12} />
              </button>

              <span className={styles.toast__icon} aria-hidden="true">
                <AlertIcon width={18} height={18} />
              </span>

              <div className={styles.toast__body}>
                {/* 애플 알림처럼 앱 이름 자리에 어디서 온 것인지, 오른쪽 끝에 언제인지를 둔다 */}
                <p className={styles.toast__head}>
                  <span className={styles.toast__where}>{alert.schoolName}</span>
                  <span className={styles.toast__when}>{formatDuration(durationMinutes(alert, now))} 전</span>
                </p>

                <p className={styles.toast__title}>{alert.title}</p>

                <p className={styles.toast__meta}>
                  <span className={styles.toast__tone}>{TONE_LABEL[tone]}</span>
                  {alert.deviceName}
                  {alert.faultCode ? <span className={styles.toast__code}>{alert.faultCode}</span> : null}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** 발생 시각부터 지금까지 흐른 시간(분). 미래 값이 들어와도 0 아래로는 내려가지 않는다. */
function durationMinutes(alert: AlertRecord, now: Date): number {
  const occurred = new Date(alert.occurredAt.replace(' ', 'T')).getTime();

  return Math.max(0, Math.round((now.getTime() - occurred) / 60_000));
}
