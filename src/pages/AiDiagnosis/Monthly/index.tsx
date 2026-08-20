import styles from '../AiDiagnosis.module.scss';
import { MonthlyPreview } from './components/MonthlyPreview';

/**
 * 설비별 월간보고서 자동 생성 (SFR-019, SFR-020).
 *
 * 화면을 위에서 아래로 잇는 대신 A4 지면을 여러 장 쌓는다 — 어느 장에 무엇이 실리는지
 * 미리 보이고, 그대로 PDF 한 장씩으로 떨어진다. 인버터가 늘면 진단 장이 함께 늘어난다.
 */
function MonthlyPage() {
  return (
    <div className={styles.tab}>
      <MonthlyPreview />
    </div>
  );
}

export default MonthlyPage;
