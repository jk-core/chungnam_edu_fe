import { Card } from '@/components/common/Card';
import { KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { formatShort } from '@/utils/date';
import type { NodeKind } from '@/interface/tree';
import { ChildGrid } from '../components/ChildGrid';
import type { StatisticsView } from '../hooks/useStatisticsView';

interface InverterDepthProps {
  view: StatisticsView;
  childKind: NodeKind;
}

/**
 * 인버터 뎁스 — 여기가 끝이다.
 *
 * 발전통계는 인버터까지가 조회 단위다. 그 아래 스트링은 붙어 있는 것을 알려 주기 위해
 * 보여만 주고 눌러 내려가지 않는다 — 누를 수 있게 두면 값이 없는 화면으로 들어가게 된다.
 * 스트링 단위 판정은 AI진단이 맡는다.
 */
export function InverterDepth({ view, childKind }: InverterDepthProps) {
  const { node, label, date, childStats } = view;

  return (
    <Reveal delay={0.06}>
      <Card
        title={`${KIND_LABEL[childKind]}별 발전`}
        description={`${node.name} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개입니다. 발전통계는 인버터까지가 조회 단위라 여기서 더 내려가지는 않습니다 — ${KIND_LABEL[childKind]} 단위 판정은 AI진단에서 봅니다.`}
      >
        <ChildGrid
          stats={childStats}
          selectedId={node.id}
          dateLabel={formatShort(date)}
          emptyLabel={`${label} 아래에는 더 내려갈 설비가 없습니다.`}
          interactive={false}
        />
      </Card>
    </Reveal>
  );
}
