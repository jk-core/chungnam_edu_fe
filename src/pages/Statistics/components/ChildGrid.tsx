import { motion } from 'motion/react';
import { Badge } from '@/components/common/Badge';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { EmptyState } from '@/components/common/EmptyState';
import { Sparkline } from '@/components/common/Sparkline';
import { cn } from '@/utils/cn';
import { formatNumber, formatPercent } from '@/utils/format';
import { pickEnergyUnit } from '@/mocks/generation';
import { useSelectNode } from '@/stores/plantStore';
import type { NodeStat } from '@/mocks/nodeStats';
import styles from '../Statistics.module.scss';

interface ChildGridProps {
  stats: NodeStat[];
  /** 지금 선택된 노드 id — 강조 표시에 쓴다. */
  selectedId: string;
  /** 선그래프 아래에 적을 기준일 표기 */
  dateLabel: string;
  emptyLabel: string;
}

/**
 * 한 계층 아래 설비들을 카드로 늘어놓는다.
 * 카드마다 기준일 하루의 발전 곡선을 넣어, 모양이 무너진 설비가 바로 눈에 띈다.
 * 카드를 누르면 그 설비가 조회 대상이 된다.
 */
export function ChildGrid({ stats, selectedId, dateLabel, emptyLabel }: ChildGridProps) {
  const selectNode = useSelectNode();

  if (stats.length === 0) return <EmptyState title="하위 설비가 없습니다" description={emptyLabel} />;

  const maxGeneration = Math.max(...stats.map((stat) => stat.generationKwh), 1);
  const { divider, unit } = pickEnergyUnit(maxGeneration);

  return (
    <div className={styles.inverterCards}>
      {stats.map((stat, index) => {
        const { node } = stat;
        const isSelected = node.id === selectedId;

        return (
          <motion.button
            key={node.id}
            type="button"
            className={cn(styles.inverterCard, {
              [styles['inverterCard--selected']]: isSelected,
              [styles['inverterCard--abnormal']]: isAbnormal(node.status),
            })}
            onClick={() => selectNode(node.id)}
            aria-pressed={isSelected}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: Math.min(index, 8) * 0.04 }}
          >
            <span className={styles.inverterCard__head}>
              <span className={styles.inverterCard__title}>
                <span className={styles.inverterCard__name}>{node.name}</span>
                <span className={styles.inverterCard__school}>
                  {node.childIds.length > 0 ? `하위 ${node.childIds.length}개` : '최말단 설비'}
                </span>
              </span>
              <Badge tone={OPERATION_TONE[node.status]} withDot>
                {OPERATION_LABEL[node.status]}
              </Badge>
            </span>

            <span className={styles.inverterCard__figure}>
              {formatNumber(stat.generationKwh / divider, divider === 1 ? 1 : 2)}
              <span className={styles.inverterCard__unit}>{unit}</span>
            </span>

            {/* 기준일 하루의 발전 곡선. 이상 설비는 모양이 무너져 한눈에 티가 난다. */}
            <span className={styles.inverterCard__spark}>
              <Sparkline
                values={stat.hourly}
                tone={isAbnormal(node.status) ? 'critical' : 'solar'}
                width={240}
                height={44}
                animate={false}
                filled
              />
              <span className={styles.inverterCard__sparkLabel}>{dateLabel} 시간대별</span>
            </span>

            <span className={styles.inverterCard__bar}>
              <span
                className={styles.inverterCard__barFill}
                style={{ width: `${(stat.generationKwh / maxGeneration) * 100}%` }}
              />
            </span>

            <span className={styles.inverterCard__metrics}>
              <span>
                <span className={styles.inverterCard__metricLabel}>용량</span>
                {formatNumber(node.capacityKw, 1)} kW
              </span>
              <span>
                <span className={styles.inverterCard__metricLabel}>발전시간</span>
                {formatNumber(stat.hours, 1)} h
              </span>
              <span>
                <span className={styles.inverterCard__metricLabel}>PR</span>
                <span className={stat.pr < 0.8 ? styles.deltaDown : undefined}>{formatPercent(stat.pr, 1)}</span>
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
