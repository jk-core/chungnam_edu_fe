import styles from '../AiDiagnosis.module.scss';
import { AnalysisFilter } from './AnalysisFilter';
import { DiagnosisEquipment } from './EquipmentTab';
import { DiagnosisFaults } from './FaultsTab';
import { DiagnosisSummary } from './SummaryTab';

/**
 * AI 진단 한 화면 (SFR-011 · SFR-013).
 * 조회 조건을 위에 한 번만 두고, 발전 지표 → 설비별 진단 → 일자별 효율 순으로
 * 넓은 곳에서 좁은 곳으로 내려가며 읽도록 한 줄로 세웠다.
 */
export function DiagnosisTab() {
  return (
    <div className={styles.tab}>
      <AnalysisFilter />
      <DiagnosisSummary />
      <DiagnosisEquipment />
      <DiagnosisFaults />
    </div>
  );
}
