import { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useDismissable } from '@/hooks/useDismissable';
import { ALERT_RECORDS, alertDurationMinutes } from '@/mocks/alerts';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { CloseIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { NOW } from '@/mocks/today';
import { PATH } from '@/routes/routes';
import { buildPath } from '@/routes/buildPath';
import { formatDuration } from '@/utils/format';
import type { AlertRecord } from '@/interface/alert';
import styles from './AlertPanel.module.scss';

/** 한 번에 펼 알림 수 — 더 보려면 알림이력으로 넘어간다. */
const MAX_ITEMS = 20;

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 헤더 종을 누르면 열리는 실시간 알림 (SFR-022-01).
 * 헤더는 어느 화면에서나 같은 것을 가리켜야 하므로 조회 대상과 무관하게 도 전체를 본다 —
 * 종에 붙는 숫자와 여기 목록이 어긋나지 않게 하려는 것이다.
 */
export function AlertPanel({ isOpen, onClose }: AlertPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => recentAlerts(), []);
  // 헤더 종에 붙는 숫자와 같은 셈법이어야 한다 — 목록을 20건으로 자른 것과 무관하게 전체를 센다.
  const pending = ALERT_RECORDS.filter((alert) => !alert.handled).length;

  // 바깥을 누르거나 ESC 를 치면 닫는다.
  useDismissable(isOpen, panelRef, onClose);

  // 열리면 패널로 포커스를 옮긴다.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          key="alerts"
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        >
          <header className={styles.panel__head}>
            <h2 id={titleId} className={styles.panel__title}>
              실시간 알림
              {pending > 0 ? <span className={styles.panel__count}>{pending}</span> : null}
            </h2>
            <button type="button" className={styles.panel__close} aria-label="알림 닫기" onClick={onClose}>
              <CloseIcon />
            </button>
          </header>

          <p className={styles.panel__scope}>
            충청남도 전체 · 미조치 {pending}건 · 최근 {items.length}건
          </p>

          <div className={styles.panel__body}>
            {items.length === 0 ? (
              <EmptyState title="새 알림이 없습니다" description="조회 대상에서 올라온 알림이 없습니다." />
            ) : (
              <ul className={styles.list}>
                {items.map((alert) => (
                  <li key={alert.id}>
                    {/* 누른 알림을 알림이력에서 그대로 펼친다 — 목록에서 다시 찾지 않는다 */}
                    <Link
                      to={buildPath.alertDetail(alert.id)}
                      className={styles.item}
                      onClick={onClose}
                    >
                      <span className={styles.item__head}>
                        <Badge tone={OPERATION_TONE[alert.status]} withDot>
                          {OPERATION_LABEL[alert.status]}
                        </Badge>
                        <span className={styles.item__at}>
                          {alert.handled ? '조치 완료' : `${formatDuration(alertDurationMinutes(alert, NOW))} 경과`}
                        </span>
                      </span>
                      <span className={styles.item__title}>{alert.title}</span>
                      <span className={styles.item__meta}>
                        {alert.schoolName} · {alert.deviceName} · {alert.occurredAt}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className={styles.panel__foot}>
            <Link to={PATH.AI_DIAGNOSIS_ALERTS} className={styles.panel__more} onClick={onClose}>
              알림이력 전체 보기
            </Link>
          </footer>
        </motion.aside>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/** 미조치를 앞세우고 최근 순으로 — 급한 것이 위로 온다. */
function recentAlerts(): AlertRecord[] {
  return [...ALERT_RECORDS]
    .sort((a, b) => Number(a.handled) - Number(b.handled) || (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, MAX_ITEMS);
}
