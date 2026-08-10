import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import { useDiagnosisScopeRoute } from '@/hooks/useDiagnosisScopeRoute';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisFilter } from './AnalysisFilter';
import { DiagnosisEquipment } from './EquipmentTab';
import { DiagnosisFaults } from './FaultsTab';
import { InverterTrendChart } from './InverterTrendChart';

/**
 * AI 진단 한 화면 (SFR-011 · SFR-013).
 * 조회 조건을 위에 한 번만 두고, 설비별 진단 → 일자별 효율 순으로
 * 넓은 곳에서 좁은 곳으로 내려가며 읽도록 한 줄로 세웠다.
 *
 * 상단 발전성능비(PR)·이용률(CF)은 걷어냈다 — 요구사항에 없는 지표다.
 */
export function DiagnosisTab() {
  // 조회 뎁스를 주소에 담는다 — 발전소·인버터·회로가 각자 주소를 갖는다 (SFR-013).
  useDiagnosisScopeRoute();
  const { target } = useDiagnosisScope();

  return (
    <div className={styles.tab}>
      <AnalysisFilter />
      {/* 인버터까지 좁혔을 때만 — 계측 추이는 인버터 단위로 나오는 값이다 (SFR-013-09). */}
      {target.kind === 'inverter' ? <InverterTrendChart target={target} /> : null}
      <DiagnosisEquipment />
      <DiagnosisFaults />
    </div>
  );
}
