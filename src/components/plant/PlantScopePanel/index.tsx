import { useId } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { ChevronDownIcon } from '@/components/common/Icon';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { PATH } from '@/routes/routes';
import { PlantPicker } from '@/components/plant/PlantPicker';
import { PlantSummary } from '@/components/plant/PlantSummary';
import { PlantTree } from '@/components/plant/PlantTree';
import { REGION_TOTAL } from '@/mocks/regions';
import { cn } from '@/utils/cn';
import { formatCapacity } from '@/utils/format';
import { useIsScopeOpen, useToggleScope } from '@/stores/plantStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { NodeKind } from '@/mocks/tree';
import styles from './PlantScopePanel.module.scss';

/**
 * 좌측 컬럼 맨 위에 놓이는 조회 대상 패널.
 * 발전소는 모달로 고르고, 그 아래 인버터·접속반·스트링·채널은 구조 트리에서 좁힌다.
 * 접으면 머리글만 남아 아래 하위 메뉴가 위로 올라온다.
 */
export function PlantScopePanel() {
  const { pathname } = useLocation();
  const { node } = usePlantScope();
  const isOpen = useIsScopeOpen();
  const toggleScope = useToggleScope();
  const bodyId = useId();

  // AI진단은 채널을 판정 대상으로 삼지 않는다. 센트럴형은 접속반, 스트링형은 스트링이 최말단이다.
  const disabledKinds: NodeKind[] = pathname.startsWith(PATH.AI_DIAGNOSIS) ? ['channel'] : [];
  const capacity = formatCapacity(node.kind === 'root' ? REGION_TOTAL.capacityKw : node.capacityKw);

  return (
    <section className={styles.panel} aria-label="조회 대상">
      <h2 className={styles.panel__heading}>
        <button
          type="button"
          className={styles.panel__toggle}
          onClick={toggleScope}
          aria-expanded={isOpen}
          aria-controls={bodyId}
        >
          <span className={styles.panel__current}>
            <span className={styles.panel__label}>조회 대상</span>
            <span className={styles.panel__name}>{node.name}</span>

            {/* 펼치면 바로 아래에 같은 정보가 나오므로, 접었을 때만 요약을 남긴다. */}
            {!isOpen ? (
              <span className={styles.panel__meta}>
                {capacity.value}
                {capacity.unit}
                {node.kind !== 'root' ? (
                  <Badge tone={OPERATION_TONE[node.status]} withDot>
                    {OPERATION_LABEL[node.status]}
                  </Badge>
                ) : null}
              </span>
            ) : null}
          </span>

          <ChevronDownIcon
            className={cn(styles.panel__chevron, { [styles['panel__chevron--open']]: isOpen })}
            width={18}
            height={18}
          />
        </button>
      </h2>

      {/* 접었을 때 여백이 남지 않도록 패딩은 잘리는 칸 안쪽에 둔다. */}
      <div id={bodyId} className={styles.panel__collapse} data-open={isOpen} inert={!isOpen}>
        <div className={styles.panel__clip}>
          <div className={styles.panel__inner}>
            <div className={styles.panel__pick}>
              <PlantPicker variant="block" />

              {/* 요약은 은은한 바탕으로 묶어 선택기·트리와 구획을 나눈다. */}
              <div className={styles.panel__summary}>
                <PlantSummary orientation="column" />
              </div>
            </div>

            <PlantTree disabledKinds={disabledKinds} />
          </div>
        </div>
      </div>
    </section>
  );
}
