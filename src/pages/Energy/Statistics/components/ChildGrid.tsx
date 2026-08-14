import { motion } from 'motion/react';
import { EquipmentIcon } from '@/components/plant/EquipmentIcon';
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
  /**
   * 카드를 눌러 그 설비로 내려갈 수 있는지.
   * 조회 단위 아래를 보여 주기만 할 때는 끈다 — 눌러도 갈 데가 없는 카드에
   * 손가락 커서와 눌림 효과를 남기면 못 가는 곳을 가리키는 셈이다.
   */
  interactive?: boolean;
}

/**
 * 한 계층 아래 설비들을 카드로 늘어놓는다.
 * 카드마다 기준일 하루의 발전 곡선을 넣어, 모양이 무너진 설비가 바로 눈에 띈다.
 * 누를 수 있는 카드면 그 설비가 조회 대상이 된다.
 */
export function ChildGrid({ stats, selectedId, dateLabel, emptyLabel, interactive = true }: ChildGridProps) {
  const selectNode = useSelectNode();
  const Shell = interactive ? motion.button : motion.div;

  if (stats.length === 0) return <EmptyState title="하위 설비가 없습니다" description={emptyLabel} />;

  const maxGeneration = Math.max(...stats.map((stat) => stat.generationKwh), 1);
  const { divider, unit } = pickEnergyUnit(maxGeneration);
  // 형제 설비를 다 더한 값 — 이 카드가 그중 얼마를 맡았는지 보여 준다.
  const siblingTotal = stats.reduce((sum, stat) => sum + stat.generationKwh, 0);

  return (
    <div className={styles.inverterCards}>
      {stats.map((stat, index) => {
        const { node } = stat;
        const isSelected = node.id === selectedId;

        return (
          <Shell
            key={node.id}
            // 누를 수 없을 때는 버튼이 아니다. disabled 버튼으로 두면 브라우저 기본 회색 글자가
            // 딸려 오고, 읽을거리인 카드가 꺼진 것처럼 보인다.
            {...(interactive
              ? { type: 'button' as const, onClick: () => selectNode(node.id), 'aria-pressed': isSelected }
              : {})}
            className={cn(styles.inverterCard, {
              [styles['inverterCard--selected']]: isSelected,
              [styles['inverterCard--abnormal']]: isAbnormal(node.status),
              [styles['inverterCard--static']]: !interactive,
            })}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: Math.min(index, 8) * 0.04 }}
          >
            <span className={styles.inverterCard__head}>
              <span className={styles.inverterCard__title}>
                <span className={styles.inverterCard__name}>
                  <EquipmentIcon kind={node.kind} className={styles.inverterCard__icon} />
                  {node.name}
                </span>
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
                <span className={styles.inverterCard__metricLabel}>점유율</span>
                {formatPercent(siblingTotal > 0 ? stat.generationKwh / siblingTotal : 0, 1)}
              </span>
            </span>
          </Shell>
        );
      })}
    </div>
  );
}
