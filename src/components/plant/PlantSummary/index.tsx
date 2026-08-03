import { motion } from 'motion/react';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE, RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { childKindOf, KIND_LABEL } from '@/mocks/tree';
import { REGION_TOTAL, REGIONS } from '@/mocks/regions';
import { SCHOOLS, STATUS_COUNT } from '@/mocks/schools';
import { cn } from '@/utils/cn';
import { formatCapacity, formatNumber } from '@/utils/format';
import { usePlantScope } from '@/hooks/usePlantScope';
import styles from './PlantSummary.module.scss';

const PYRANOMETER_NORMAL = SCHOOLS.filter((school) => school.pyranometerStatus === 'normal').length;

interface PlantSummaryProps {
  /** column 은 좁은 좌측 컬럼용. 항목을 세로로 쌓고 테두리를 뺀다. */
  orientation?: 'row' | 'column';
}

/**
 * 지금 보고 있는 대상의 주소·설비용량·상태를 보여 준다.
 * 인버터까지 좁히면 용량과 상태가 그 인버터 기준으로 바뀐다.
 */
export function PlantSummary({ orientation = 'row' }: PlantSummaryProps) {
  const { node, plant } = usePlantScope();
  // 용량은 지금 보고 있는 계층 기준으로 읽는다. 접속반·스트링까지 내려가도 그 칸의 용량이 나온다.
  const capacity = formatCapacity(node.kind === 'root' ? REGION_TOTAL.capacityKw : node.capacityKw);
  const childKind = childKindOf(node);

  return (
    <motion.dl
      key={node.id}
      className={cn(styles.summary, styles[`summary--${orientation}`])}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.summary__item}>
        <dt>{plant ? '주소' : '관할 구역'}</dt>
        <dd>{plant ? plant.address : `충청남도 ${REGIONS.length}개 시·군`}</dd>
      </div>

      <div className={styles.summary__item}>
        <dt>설비용량</dt>
        <dd className={styles.summary__data}>
          {capacity.value}
          <span className={styles.summary__unit}>{capacity.unit}</span>
          {childKind ? (
            <span className={styles.summary__sub}>
              {KIND_LABEL[childKind]} {node.childIds.length}
            </span>
          ) : (
            <span className={styles.summary__sub}>최말단 설비</span>
          )}
        </dd>
      </div>

      <div className={styles.summary__item}>
        <dt>{node.kind === 'root' ? '발전소 상태' : `${KIND_LABEL[node.kind]} 상태`}</dt>
        <dd>
          {node.kind !== 'root' ? (
            <Badge tone={OPERATION_TONE[node.status]} withDot>
              {OPERATION_LABEL[node.status]}
            </Badge>
          ) : (
            <span className={styles.summary__ratio}>
              가동 {formatNumber(STATUS_COUNT.running)}
              <span className={styles.summary__sub}>/ {formatNumber(SCHOOLS.length)}개소</span>
            </span>
          )}
        </dd>
      </div>

      <div className={styles.summary__item}>
        <dt>일사량계 상태</dt>
        <dd>
          {plant ? (
            <Badge tone={RTU_TONE[plant.pyranometerStatus]} withDot>
              {RTU_LABEL[plant.pyranometerStatus]}
            </Badge>
          ) : (
            <span className={styles.summary__ratio}>
              정상 {formatNumber(PYRANOMETER_NORMAL)}
              <span className={styles.summary__sub}>/ {formatNumber(SCHOOLS.length)}대</span>
            </span>
          )}
        </dd>
      </div>
    </motion.dl>
  );
}
