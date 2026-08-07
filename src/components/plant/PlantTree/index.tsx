import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRightIcon } from '@/components/common/Icon';
import { getChildNodes, getNode, getNodePath, KIND_LABEL } from '@/mocks/tree';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import {
  useExpandedIds,
  useExpandPath,
  useSelectedNode,
  useSelectNode,
  useToggleExpanded,
} from '@/stores/plantStore';
import type { NodeKind, ScopeNode } from '@/mocks/tree';
import styles from './PlantTree.module.scss';

interface RowProps {
  node: ScopeNode;
  depth: number;
  selectedId: string;
  expandedIds: string[];
  /** 이 화면이 다루지 않는 계층 — 흐리게 두고 선택을 막는다. */
  disabledKinds: NodeKind[];
  /** 이 계층에서 트리를 끊는다. 아래는 아예 그리지 않는다. */
  stopAt?: NodeKind;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

function TreeRow({ node, depth, selectedId, expandedIds, disabledKinds, stopAt, onSelect, onToggle }: RowProps) {
  const children = stopAt === node.kind ? [] : getChildNodes(node.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.includes(node.id);
  const isSelected = selectedId === node.id;
  const isDisabled = disabledKinds.includes(node.kind);

  return (
    <li className={styles.tree__item}>
      <div
        className={cn(styles.row, styles[`row--${node.kind}`], {
          [styles['row--selected']]: isSelected,
          [styles['row--disabled']]: isDisabled,
        })}
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.row__toggle}
            aria-expanded={isExpanded}
            aria-label={`${node.name} ${isExpanded ? '접기' : '펼치기'}`}
            onClick={() => onToggle(node.id)}
          >
            <ChevronRightIcon
              className={cn(styles.row__chevron, { [styles['row__chevron--open']]: isExpanded })}
            />
          </button>
        ) : (
          <span className={styles.row__toggle} aria-hidden="true" />
        )}

        <button
          type="button"
          className={styles.row__label}
          onClick={() => onSelect(node.id)}
          disabled={isDisabled}
          title={isDisabled ? '이 화면에서는 조회할 수 없는 계층입니다.' : undefined}
          aria-current={isSelected ? 'true' : undefined}
        >
          <span className={cn(styles.row__dot, styles[`row__dot--${node.status}`])} aria-hidden="true" />
          <span className={styles.row__name}>{node.name}</span>
          <span className={styles.row__capacity}>{formatNumber(node.capacityKw, 1)} kW</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded ? (
          <motion.ul
            className={styles.tree__children}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.68, 0.32, 1] }}
          >
            {children.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                disabledKinds={disabledKinds}
                stopAt={stopAt}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

/**
 * 설비 구조 트리.
 * 발전소 → 인버터 → (스트링 | 접속반 → 채널) 순으로 펼치고, 어느 칸이든 눌러 조회 대상으로 삼는다.
 * 발전소 128개를 다 늘어놓으면 읽히지 않으므로 루트는 지금 고른 발전소만 보여 준다.
 */
interface PlantTreeProps {
  /** 이 화면이 다루지 않는 계층. 예: AI진단은 채널을 판정 대상으로 삼지 않는다. */
  disabledKinds?: NodeKind[];
  /**
   * 트리를 끊을 계층. 아래는 흐리게 두는 대신 아예 그리지 않는다.
   * 예: 발전통계는 인버터까지가 조회 단위라 그 아래를 열 일이 없다.
   */
  stopAt?: NodeKind;
}

export function PlantTree({ disabledKinds = [], stopAt }: PlantTreeProps) {
  const node = useSelectedNode();
  const selectNode = useSelectNode();
  const expandedIds = useExpandedIds();
  const toggleExpanded = useToggleExpanded();
  const expandPath = useExpandPath();

  const plantId = node.plantId;

  // 다른 화면에서 깊은 노드로 넘어와도 그 자리가 보이도록 경로를 펼쳐 둔다.
  useEffect(() => {
    if (!plantId) return;

    const ancestors = getNodePath(node.id)
      .filter((item) => item.kind !== 'root' && item.childIds.length > 0)
      .map((item) => item.id);

    if (ancestors.some((id) => !expandedIds.includes(id))) expandPath(ancestors);
  }, [node.id, plantId, expandedIds, expandPath]);

  if (!plantId) {
    return (
      <p className={styles.empty}>
        {stopAt === 'inverter'
          ? '발전소를 고르면 인버터까지 계층으로 펼쳐 볼 수 있습니다.'
          : '발전소를 고르면 인버터·접속반·스트링까지 계층으로 펼쳐 볼 수 있습니다.'}
      </p>
    );
  }

  const plant = getNode(plantId);

  return (
    <div className={styles.tree}>
      <p className={styles.tree__title}>설비 구조</p>
      <ul className={styles.tree__root}>
        <TreeRow
          node={plant}
          depth={0}
          selectedId={node.id}
          expandedIds={expandedIds}
          disabledKinds={disabledKinds}
          stopAt={stopAt}
          onSelect={selectNode}
          onToggle={toggleExpanded}
        />
      </ul>
      <p className={styles.tree__hint}>
        {KIND_LABEL[node.kind]} 기준으로 조회 중입니다.
        {stopAt === 'inverter' ? ' 인버터 아래는 AI진단에서 봅니다.' : ''}
        {disabledKinds.includes('channel') ? ' 채널은 진단 대상이 아닙니다.' : ''}
      </p>
    </div>
  );
}
