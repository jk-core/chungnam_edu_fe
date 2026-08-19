import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { NodeKind } from '@/interface/tree';
import { ChildCompareChart, childCompareHead } from './ChildCompareChart';
import { DetailTrend, detailTrendHead } from './DetailTrend';
import type { StatisticsView } from '../hooks/useStatisticsView';

type TrendMode = 'total' | 'children';

interface TrendSectionProps {
  view: StatisticsView;
  /** 하위 계층이 없으면(최말단) 전체 추이만 남는다 */
  childKind: NodeKind | null;
}

/**
 * 시점별 추이 (SFR-007-03, SFR-008-05/06/07).
 *
 * 「시간대별 발전량」과 「시간별 인버터 발전시간」은 같은 가로축(시각)을 놓고 같은 하루를 말하는
 * 두 그림이다. 위아래로 따로 세워 두면 같은 시각을 견주려고 눈이 화면을 오르내려야 하고,
 * 아래 판은 스크롤을 내려야 나오므로 있는 줄도 모르고 지나친다.
 *
 * 한 칸에 넣고 토글로 바꿔 끼우면 그림이 늘 같은 자리에 서서, 축이 그대로인 채 안의 선만 갈린다 —
 * 무엇이 달라졌는지가 자리 이동 없이 읽힌다.
 *
 * 하위 계층이 없는 최말단에서는 바꿀 것이 없으므로 토글을 내지 않는다.
 */
export function TrendSection({ view, childKind }: TrendSectionProps) {
  const [mode, setMode] = useState<TrendMode>('total');
  const showChildren = childKind !== null && mode === 'children';

  const head = showChildren && childKind
    ? childCompareHead(view.period, childKind)
    : detailTrendHead(view);

  return (
    <Reveal delay={0.1}>
      <Card
        title={head.title}
        description={head.description}
        action={childKind ? (
          <SegmentedControl
            label="추이 보기"
            size="sm"
            options={[
              { value: 'total', label: '전체' },
              { value: 'children', label: `${KIND_LABEL[childKind]}별` },
            ]}
            value={mode}
            onChange={setMode}
          />
        ) : undefined}
      >
        {showChildren && childKind
          ? <ChildCompareChart view={view} childKind={childKind} />
          : <DetailTrend view={view} />}
      </Card>
    </Reveal>
  );
}
