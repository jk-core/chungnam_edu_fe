import { useDiagnosisScopeRoute } from '@/hooks/useDiagnosisScopeRoute';
import { AnalysisFilter } from '@/components/plant/AnalysisFilter';
import styles from '../../AiDiagnosis.module.scss';
import { DiagnosisEquipment } from './Equipment';
import { DiagnosisFaults } from './Faults';
import { InverterTrendChart } from './InverterTrendChart';

/**
 * AI 진단 한 화면 본문 (SFR-011 · SFR-013).
 *
 * 조회 조건을 위에 한 번만 두고, 설비별 진단 → 일자별 효율 순으로 넓은 곳에서 좁은 곳으로
 * 내려가며 읽도록 한 줄로 세웠다.
 *
 * 조회 뎁스를 주소에 담는 일만 여기서 한다 — 발전소·인버터·회로가 각자 주소를 갖는데(SFR-013),
 * 그 주소를 맞추는 것은 어느 한 판의 일이 아니라 이 화면 전체의 일이다. 판들은 저마다 필요한
 * 조회 조건을 스스로 읽으므로 여기서 내려 줄 것이 없다.
 */
export function OverviewBoard() {
  useDiagnosisScopeRoute();

  return (
    <div className={styles.tab}>
      <AnalysisFilter />
      <InverterTrendChart />
      <DiagnosisEquipment />
      <DiagnosisFaults />
    </div>
  );
}
