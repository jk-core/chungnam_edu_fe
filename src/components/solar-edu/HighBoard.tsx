import { useMemo } from 'react';
import { buildEduInsight } from '@/mocks/eduDiagnosis';
import { cn } from '@/utils/cn';
import { useEduAiScan } from '@/hooks/useEduAiScan';
import type { EduStats } from '@/mocks/solarEdu';
import type { HighContent } from '@/mocks/eduContent';
import { AiScanPanel } from './AiScanPanel';
import { DayCurvePanel } from './DayCurvePanel';
import { ImpactPanel } from './ImpactPanel';
import { JourneyPanel } from './JourneyPanel';
import { ScanFrame } from './ScanFrame';
import { SunPathPanel } from './SunPathPanel';
import styles from './HighBoard.module.scss';

interface HighBoardProps {
  scopeLabel: string;
  stats: EduStats;
  content: HighContent;
}

/**
 * 고등 판 본문 (SFR-005-01/02/03/07).
 *
 * 왼쪽이 오늘 쌓인 데이터, 가운데가 그 데이터를 두고 AI 가 내리는 판단, 오른쪽이 그래서 무슨 뜻인지다.
 * 읽는 순서가 그대로 이야기가 되도록 세 열을 그렇게 놓았다 — AI 가 자료와 의미 사이에 앉아 있는 자리가
 * 이 회사가 하는 일의 자리이기도 하다.
 *
 * 진단 상태를 여기서 쥐는 까닭은, 가운데 게이지만 도는 것으로는 AI 가 **무엇을** 보고 있는지 알 수 없어서다.
 * 단계에 따라 옆 칸에 스캔 틀을 씌워, 계측값을 읽을 때는 곡선 위에 원인을 따질 때는 계통도 위에
 * 시선이 옮겨 가는 것이 보이게 했다.
 */
export function HighBoard({ scopeLabel, stats, content }: HighBoardProps) {
  const insight = useMemo(() => buildEduInsight(stats, scopeLabel), [stats, scopeLabel]);
  const scan = useEduAiScan(insight.lines.length);
  const stage = scan.stage.stage;

  return (
    <div className={styles.grid}>
      <div className={styles.column}>
        {/* 값을 모으고 견주는 두 단계는 계측 곡선을 읽는다 */}
        <ScanFrame active={stage === 'scan' || stage === 'classify'} label="계측값 수집 중">
          <DayCurvePanel stats={stats} content={content.day} />
        </ScanFrame>

        <SunPathPanel stats={stats} content={content.sunPath} />
      </div>

      <div className={styles.center}>
        <AiScanPanel content={content.ai} stats={stats} insight={insight} scan={scan} />
      </div>

      <div className={cn(styles.column, styles['column--story'])}>
        <ImpactPanel scopeLabel={scopeLabel} stats={stats} content={content.impact} />

        {/* 왜 그런지 따질 때는 설비 쪽을 살핀다 */}
        <ScanFrame active={stage === 'reason'} label="설비 점검 중">
          <JourneyPanel stats={stats} content={content.journey} />
        </ScanFrame>
      </div>
    </div>
  );
}
