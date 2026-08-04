import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertIcon, ChevronRightIcon, MonitorIcon } from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DIAG_EFFICIENCY_CRITICAL, DIAG_EFFICIENCY_WARN } from '@/mocks/equipment';
import { EmptyState } from '@/components/common/EmptyState';
import { getChildNodes, getNodePath } from '@/mocks/tree';
import { getDiagEfficiencyPoints } from '@/mocks/prediction';
import { getFaultCode } from '@/mocks/faultCodes';
import { isAbnormal, OPERATION_LABEL, OPERATION_ORDER, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { Sparkline } from '@/components/common/Sparkline';
import { cn } from '@/utils/cn';
import { formatEnergy, formatNumber } from '@/utils/format';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import { useExpandPath, useSelectNode } from '@/stores/plantStore';
import type { DiagEfficiencyPoint } from '@/interface/diagnosisDetail';
import type { FaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';
import type { NodeKind, ScopeNode } from '@/interface/tree';
import styles from '../AiDiagnosis.module.scss';
import { FaultCodeModal } from './FaultCodeModal';

/** 노드 종류를 사람이 부르는 이름으로 */
const KIND_NOUN: Record<NodeKind, string> = {
  root: '전체',
  plant: '발전소',
  inverter: '인버터',
  junctionBox: '접속반',
  string: '스트링',
  channel: '채널',
};

/** 한 화면에 늘어놓을 카드 수 — 넘치면 이상 설비를 앞세워 자른다. */
const MAX_CARDS = 12;

interface UnitCard {
  node: ScopeNode;
  points: DiagEfficiencyPoint[];
  /** 기간 마지막 날의 진단 효율(%) */
  efficiency: number;
  estimateKwh: number;
  measuredKwh: number;
  fault: FaultCode | null;
  /** 정상 기준에 못 미친 날 수 */
  belowDays: number;
}

/**
 * 지금 보고 있는 계층 바로 아래 설비의 실시간 진단 (SFR-013-04/07).
 * 한 단계만 내려가 보여 주고, 카드를 누르면 그 설비로 조회 대상이 옮겨 간다.
 */
export function DiagnosisEquipment() {
  const { target, label } = useDiagnosisScope();
  const [range] = useDiagnosisRange();
  const selectNode = useSelectNode();
  const expandPath = useExpandPath();
  const [openFault, setOpenFault] = useState<{ fault: FaultCode; device: string } | null>(null);

  const children = useMemo(() => getChildNodes(target.id), [target.id]);
  const childNoun = children.length > 0 ? KIND_NOUN[children[0].kind] : '하위 설비';

  const counts = useMemo(() => children.reduce<Record<OperationStatus, number>>(
    (acc, node) => ({ ...acc, [node.status]: acc[node.status] + 1 }),
    { running: 0, degraded: 0, fault: 0, commLost: 0, ready: 0 },
  ), [children]);

  const cards = useMemo<UnitCard[]>(() => [...children]
    // 손봐야 할 설비가 뒤로 밀리지 않도록 이상부터 세운다.
    .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw)
    .slice(0, MAX_CARDS)
    .map((node) => {
      const points = getDiagEfficiencyPoints(node.id, node.status, node.capacityKw, range.start, range.end);
      const last = points[points.length - 1];
      const live = points.filter((point) => point.efficiency > 0);

      return {
        node,
        points,
        efficiency: last?.efficiency ?? 0,
        estimateKwh: points.reduce((sum, point) => sum + point.estimateKwh, 0),
        measuredKwh: points.reduce((sum, point) => sum + point.measuredKwh, 0),
        fault: getFaultCode(last?.faultCode ?? null),
        belowDays: live.filter((point) => point.efficiency < DIAG_EFFICIENCY_WARN).length,
      };
    }), [children, range.start, range.end]);

  return (
    <>
      <Reveal>
        <Card
          eyebrow="Equipment"
          title="설비별 진단 현황"
          description={`${label}의 ${childNoun} 실시간 진단`}
        >
          {cards.length === 0 ? (
            <EmptyState
              title={`${childNoun} 정보가 없습니다`}
              description={`${label} 아래에는 더 내려갈 설비가 없습니다.`}
            />
          ) : (
            <>
              <div className={styles.unitSummary}>
                <p className={styles.unitSummary__head}>
                  <MonitorIcon width={14} height={14} aria-hidden />
                  <span className={styles.unitSummary__title}>{childNoun}</span>
                  <span className={styles.unitSummary__total}>
                    {formatNumber(children.length)}
                    <small>기</small>
                  </span>
                </p>
                <ul className={styles.unitSummary__counts}>
                  {OPERATION_ORDER.filter((status) => status !== 'ready').map((status) => (
                    <li key={status} className={styles.unitSummary__chip}>
                      <span className={cn(styles.unitSummary__dot, styles[`unitDot--${status}`])} aria-hidden />
                      {OPERATION_LABEL[status]}
                      <strong>{counts[status]}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className={styles.unitGrid} aria-label={`${childNoun}별 진단 카드`}>
                {cards.map((card, index) => (
                  <UnitTile
                    key={card.node.id}
                    card={card}
                    index={index}
                    parentName={children[0]?.kind === 'plant' ? '' : label}
                    onOpenFault={(fault, device) => setOpenFault({ fault, device })}
                    onOpen={() => {
                      // 조회 대상을 옮기고, 좌측 트리에서도 그 자리가 펼쳐져 있게 한다.
                      expandPath(getNodePath(card.node.id).map((item) => item.id));
                      selectNode(card.node.id);
                    }}
                  />
                ))}
              </ul>

              {children.length > cards.length ? (
                <p className={styles.unitGrid__more}>
                  이상 설비를 앞세워 {formatNumber(cards.length)}기만 보여 줍니다. 조회 대상을 좁히면 나머지도 볼 수 있습니다.
                </p>
              ) : null}
            </>
          )}
        </Card>
      </Reveal>

      <FaultCodeModal
        fault={openFault?.fault ?? null}
        deviceLabel={openFault?.device}
        onClose={() => setOpenFault(null)}
      />
    </>
  );
}

interface UnitTileProps {
  card: UnitCard;
  index: number;
  parentName: string;
  onOpenFault: (fault: FaultCode, device: string) => void;
  onOpen: () => void;
}

function UnitTile({ card, index, parentName, onOpenFault, onOpen }: UnitTileProps) {
  const { node, fault } = card;
  const abnormal = isAbnormal(node.status);
  const deviceLabel = parentName ? `${parentName} · ${node.name}` : node.name;
  const estimate = formatEnergy(card.estimateKwh);
  const measured = formatEnergy(card.measuredKwh);

  return (
    <motion.li
      className={cn(styles.unit, styles[`unit--${node.status}`])}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
    >
      {/* 카드 빈 곳을 누르면 그 설비로 내려간다. 안쪽 버튼은 위 층에 둔다. */}
      <button
        type="button"
        className={styles.unit__overlay}
        aria-label={`${node.name} 조회 대상으로 보기`}
        onClick={onOpen}
      />

      <header className={styles.unit__head}>
        <span className={styles.unit__icon} aria-hidden>
          <MonitorIcon width={13} height={13} />
        </span>
        <span className={styles.unit__name}>{deviceLabel}</span>
        <Badge tone={OPERATION_TONE[node.status]}>{OPERATION_LABEL[node.status]}</Badge>
      </header>

      {/* 정상이면 헤더 배지로 충분하다 — 같은 말을 밴드로 되풀이하지 않는다. */}
      {fault && fault.code > 0 ? (
        <button
          type="button"
          className={cn(styles.unitAlert, styles[`unitAlert--${node.status}`])}
          onClick={(event) => {
            event.stopPropagation();
            onOpenFault(fault, deviceLabel);
          }}
          aria-label={`${node.name} 원인·조치 보기`}
        >
          <AlertIcon width={13} height={13} aria-hidden />
          <span className={styles.unitAlert__cause}>{fault.summary}</span>
          <ChevronRightIcon width={12} height={12} aria-hidden />
        </button>
      ) : null}

      <div className={styles.unit__spark}>
        <Sparkline
          className={styles.unit__sparkLine}
          values={card.points.map((point) => point.efficiency)}
          tone={abnormal ? 'critical' : 'brand'}
          width={300}
          height={44}
          animate={false}
          filled
        />
        <span className={styles.unit__sparkCaption}>
          진단 효율 추이 · {DIAG_EFFICIENCY_WARN}% 미만 주황 · {DIAG_EFFICIENCY_CRITICAL}% 미만 빨강
          {card.belowDays > 0 ? ` · 미달 ${card.belowDays}일` : ''}
        </span>
      </div>

      <dl className={styles.unit__metrics}>
        <div>
          <dt>추정값</dt>
          <dd>
            {estimate.value}
            <small>{estimate.unit}</small>
          </dd>
        </div>
        <div>
          <dt>측정값</dt>
          <dd>
            {measured.value}
            <small>{measured.unit}</small>
          </dd>
        </div>
        <div>
          <dt>발전 효율</dt>
          <dd className={card.efficiency > 0 && card.efficiency < DIAG_EFFICIENCY_WARN ? styles.deltaDown : undefined}>
            {card.efficiency <= 0 ? '—' : formatNumber(card.efficiency, 1)}
            <small>%</small>
          </dd>
        </div>
      </dl>
    </motion.li>
  );
}
