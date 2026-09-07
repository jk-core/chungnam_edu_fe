import { cn } from '@/utils/cn';
import type { EduStats } from '@/mocks/solarEdu';
import type { HighContent } from '@/mocks/eduContent';
import { DayCurvePanel } from './DayCurvePanel';
import { ImpactPanel } from './ImpactPanel';
import { JourneyPanel } from './JourneyPanel';
import { StagePanel } from './StagePanel';
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
 * 왼쪽이 오늘 쌓인 데이터, 가운데가 그 전기가 만들어지는 원리, 오른쪽이 그래서 무슨 뜻인지다.
 * 읽는 순서가 그대로 이야기가 되도록 세 열을 그렇게 놓았다 — 값을 보고, 그 값이 어떻게 생기는지를
 * 알고, 그것이 무엇을 바꾸는지로 끝난다.
 *
 * 가운데 칸은 한때 AI 진단 과정을 돌렸다. 학생이 보는 화면에서 배워야 할 것은 진단 절차가 아니라
 * 발전 원리라, 자리마다 무슨 일이 일어나는지만 남기고 걷어냈다(2026-08-24).
 */
export function HighBoard({ scopeLabel, stats, content }: HighBoardProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.column}>
        <DayCurvePanel stats={stats} content={content.day} />
        <SunPathPanel stats={stats} content={content.sunPath} />
      </div>

      <div className={styles.center}>
        <StagePanel content={content.stage} />
      </div>

      <div className={cn(styles.column, styles['column--story'])}>
        <ImpactPanel scopeLabel={scopeLabel} stats={stats} content={content.impact} />
        {/*
          기상 칸을 걷었다 (2026-09-07 지시).

          이 판에는 이미 하루 발전 곡선과 해의 고도가 있어 「오늘 하늘이 어땠나」 를 그 둘이
          말한다. 이레 예보까지 얹으면 같은 이야기가 세 번 되고, 무엇보다 이 열에서 계통도가
          그만큼 눌렸다 — 비운 높이는 계통도가 받는다.
        */}
        <JourneyPanel stats={stats} content={content.journey} />
      </div>
    </div>
  );
}
