import { useLocation } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { InfoIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { findChild, findSection } from '@/configs/navigation';
import styles from './ComingSoon.module.scss';

interface ComingSoonProps {
  /** 어느 단계에서 만들지 */
  phase: string;
  /** 이 화면에서 할 일을 한두 문장으로 */
  plan: string;
  /** 내비게이션에 없는 단독 화면은 요구사항ID 를 직접 넘긴다. */
  requirements?: string[];
}

/**
 * 아직 만들지 않은 화면의 자리표시.
 * 내비게이션에 적어 둔 요구사항ID를 그대로 펼쳐, 구현 전에도 어떤 항목을 덮을 화면인지 확인할 수 있게 한다.
 */
export function ComingSoon({ phase, plan, requirements: given }: ComingSoonProps) {
  const { pathname } = useLocation();
  const child = findChild(findSection(pathname), pathname);
  const requirements = given ?? child?.requirements ?? [];

  return (
    <Reveal>
      <Card>
        <div className={styles.soon}>
          <div className={styles.soon__head}>
            <span className={styles.soon__mark} aria-hidden="true">
              <InfoIcon />
            </span>
            <div className={styles.soon__body}>
              <p className={styles.soon__title}>{child?.label ?? '준비 중인 화면'}</p>
              <p className={styles.soon__text}>{plan}</p>
              <p className={styles.soon__phase}>{phase} 에서 구현합니다.</p>
            </div>
          </div>

          <div className={styles.reqs}>
            <p className={styles.reqs__title}>이 화면이 덮는 요구사항 {requirements.length}건</p>
            {requirements.length === 0 ? (
              <p className={styles.reqs__empty}>연결된 요구사항ID가 없습니다.</p>
            ) : (
              <ul className={styles.reqs__list}>
                {requirements.map((id) => (
                  <li key={id} className={styles.reqs__item}>
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
