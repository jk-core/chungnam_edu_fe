import { Button } from '@/components/common/Button';
import { MANAGE_ACTIONS } from '@/mocks/fieldReport';
import type { FieldReport, ReportState } from '@/interface/fieldReport';

interface ReportStateActionsProps {
  report: FieldReport;
  /** 표 안에서는 줄 높이에 맞춰 작게 세운다 */
  size?: 'sm';
  onSelect: (report: FieldReport, state: ReportState) => void;
}

/**
 * 반려·검토·확인 (SFR-021-08).
 *
 * 셋을 나란히 두고 곧바로 고른다 — 단계를 밟아 나아가지 않으므로 「다음 단계」 하나만
 * 세우지 않는다.
 *
 * **지금 상태인 것도 자리는 지킨다.** 빼 버리면 남은 단추가 옆으로 밀려, 보고서마다
 * 같은 말이 다른 자리에 서고 표를 훑을 때 엉뚱한 것을 누르게 된다 — 그래서 끄기만 한다.
 *
 * 셋은 같은 모양이다. 반려만 테두리를 벗겨 두었더니 꺼진 것인지 그냥 연한 것인지 갈리지
 * 않았다 — 나란히 선 단추는 테두리를 함께 두르거나 함께 없앤다.
 */
export function ReportStateActions({ report, size, onSelect }: ReportStateActionsProps) {
  return (
    <>
      {MANAGE_ACTIONS.map((action) => (
        <Button
          key={action.state}
          size={size}
          variant="secondary"
          disabled={action.state === report.state}
          onClick={() => onSelect(report, action.state)}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}
