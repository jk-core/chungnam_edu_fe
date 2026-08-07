import { useId } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { ChevronDownIcon } from '@/components/common/Icon';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { PATH } from '@/routes/routes';
import { PlantPicker } from '@/components/plant/PlantPicker';
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

  /*
   * 화면마다 파고들 수 있는 깊이가 다르다.
   * - AI진단: 스트링·접속반까지 판정한다. 채널은 계측 조회용이라 대상이 아니다.
   * - 그 밖(발전통계·운전이력 등): 인버터까지가 조회 단위라 그 아래는 트리에서 끊는다.
   *   흐리게 두고 못 누르게 하는 것보다, 없는 계층은 안 보이는 편이 덜 헷갈린다.
   */
  const isDiagnosis = pathname.startsWith(PATH.AI_DIAGNOSIS);
  const disabledKinds: NodeKind[] = isDiagnosis ? ['channel'] : [];
  const stopAt: NodeKind | undefined = isDiagnosis ? undefined : 'inverter';
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
            {/* 선택 버튼과 대상 요약은 한 덩어리다 — 좁은 컬럼에서 따로 두면 자리만 먹는다. */}
            <div className={styles.panel__pick}>
              <PlantPicker variant="summary" />
            </div>

            <PlantTree disabledKinds={disabledKinds} stopAt={stopAt} />
          </div>
        </div>
      </div>
    </section>
  );
}
