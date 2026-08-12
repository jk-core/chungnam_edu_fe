import { buildEduLogs } from '@/mocks/eduDiagnosis';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './AiParts.module.scss';

interface AiScanStageProps {
  stats: EduStats;
  /** 이 단계 안에서 얼마나 왔는지 (0~1) */
  progress: number;
}

/**
 * 값을 읽어 들이는 단계의 본문 (SFR-005-02).
 *
 * 확인한 것을 한 줄씩 적어 남긴다. 진단이 갑자기 답을 내놓는 일이 아니라 값을 하나씩 짚어 가는 일이라는 것을,
 * 쌓이는 줄이 대신 말해 준다. 적는 내용은 전부 실제 계열에서 나온다.
 */
export function AiScanStage({ stats, progress }: AiScanStageProps) {
  const logs = buildEduLogs(stats);
  const shown = Math.round(Math.min(1, progress * 1.1) * logs.length);

  return (
    <ul className={styles.logs}>
      {logs.slice(0, shown).map((log) => (
        <li key={log.id} className={styles.log}>
          <span className={styles.log__mark} aria-hidden="true">▸</span>
          {log.text}
        </li>
      ))}
    </ul>
  );
}
