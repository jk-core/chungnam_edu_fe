import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useDismissable } from '@/hooks/useDismissable';
import { CloseIcon } from '@/components/common/Icon';
import { ERROR_CATALOG } from '@/configs/errorCatalog';
import { findChild, findSection } from '@/configs/navigation';
import { findHelp } from '@/configs/helpContent';
import styles from './HelpPanel.module.scss';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 우측에 도킹되는 온라인 도움말 (SIF-005).
 * 지금 보고 있는 화면의 목적·사용 순서·자주 겪는 오류를 보여 준다.
 */
export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  const { pathname } = useLocation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const help = findHelp(pathname);
  const section = findSection(pathname);
  const child = findChild(section, pathname);
  const screenName = child?.label ?? section?.label ?? '이 화면';

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
          key="help"
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
              {screenName} 도움말
            </h2>
            <button type="button" className={styles.panel__close} aria-label="도움말 닫기" onClick={onClose}>
              <CloseIcon />
            </button>
          </header>

          <div className={styles.panel__body}>
            <p className={styles.overview}>{help.overview}</p>

            <section className={styles.section}>
              <h3 className={styles.section__title}>사용 순서</h3>
              <ol className={styles.steps}>
                {help.steps.map((step, index) => (
                  <li key={step} className={styles.step}>
                    <span className={styles.step__order}>{index + 1}</span>
                    <span className={styles.step__text}>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {help.errorCodes.length > 0 ? (
              <section className={styles.section}>
                <h3 className={styles.section__title}>자주 겪는 오류</h3>
                <div className={styles.faults}>
                  {help.errorCodes.map((code) => {
                    const entry = ERROR_CATALOG[code] ?? ERROR_CATALOG.UNKNOWN;

                    return (
                      <div key={code} className={styles.fault}>
                        <p className={styles.fault__head}>
                          <span className={styles.fault__code}>{entry.code}</span>
                          <span className={styles.fault__title}>{entry.title}</span>
                        </p>
                        <p className={styles.fault__text}>{entry.cause}</p>
                        <p className={styles.fault__action}>{entry.action}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
