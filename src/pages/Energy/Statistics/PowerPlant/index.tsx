import { Card } from '@/components/common/Card';
import { KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { formatShort } from '@/utils/date';
import type { NodeKind } from '@/interface/tree';
import { ChildGrid } from '../components/ChildGrid';
import type { StatisticsView } from '../hooks/useStatisticsView';

interface PowerPlantDepthProps {
  view: StatisticsView;
  childKind: NodeKind;
}

/**
 * 발전소 뎁스 — 아래를 눌러 내려간다.
 *
 * 도 전체·지역·발전소까지가 여기다. 하위 카드가 곧 다음 뎁스로 가는 문이라 누를 수 있고,
 * 설명도 "내려간다" 를 말한다.
 */
export function PowerPlantDepth({ view, childKind }: PowerPlantDepthProps) {
  const { node, label, date, childStats } = view;

  return (
    <Reveal delay={0.06}>
      <Card
        title={`${KIND_LABEL[childKind]}별 발전`}
        description={
          node.kind === 'root'
            ? `이상이 있는 발전소를 앞세워 ${childStats.length}개소를 보여 줍니다. 카드를 누르면 그 발전소로 내려갑니다.`
            : `${node.name} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개입니다. 카드를 누르면 그 설비로 내려갑니다.`
        }
      >
        <ChildGrid
          stats={childStats}
          selectedId={node.id}
          dateLabel={formatShort(date)}
          emptyLabel={`${label} 아래에는 더 내려갈 설비가 없습니다.`}
          interactive
        />
      </Card>
    </Reveal>
  );
}
