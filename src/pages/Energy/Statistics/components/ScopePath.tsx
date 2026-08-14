import { EquipmentIcon } from '@/components/plant/EquipmentIcon';
import { KIND_LABEL } from '@/mocks/tree';
import { useSelectNode } from '@/stores/plantStore';
import type { ScopeNode } from '@/interface/tree';
import styles from '../Statistics.module.scss';

interface ScopePathProps {
  /** 도 전체를 뺀 계층 경로 — 발전소에서 시작한다 */
  path: ScopeNode[];
  currentId: string;
}

/** 지금 어느 계층을 보고 있는지, 위로 어떻게 올라가는지 */
export function ScopePath({ path, currentId }: ScopePathProps) {
  const selectNode = useSelectNode();

  return (
    <nav className={styles.scopePath} aria-label="조회 계층">
      {path.map((item, index) => (
        <span key={item.id} className={styles.scopePath__item}>
          {index > 0 ? <span className={styles.scopePath__sep}>›</span> : null}
          {item.id === currentId ? (
            <span className={styles.scopePath__current}>
              <EquipmentIcon kind={item.kind} className={styles.scopePath__icon} />
              {item.name}
              <span className={styles.scopePath__kind}>{KIND_LABEL[item.kind]}</span>
            </span>
          ) : (
            <button type="button" className={styles.scopePath__link} onClick={() => selectNode(item.id)}>
              <EquipmentIcon kind={item.kind} className={styles.scopePath__icon} />
              {item.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}
