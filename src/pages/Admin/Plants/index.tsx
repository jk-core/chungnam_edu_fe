import { useNavigate, useParams } from 'react-router-dom';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import styles from '../Admin.module.scss';
import EquipmentDepth from './Equipment';
import PlantDepth from './Plant';
import PyranometerDepth from './Pyranometer';
import RtuEnterpriseDepth from './RtuEnterprise';
import StringDepth from './String';

/** 어느 갈래를 볼지 (SFR-016) */
type Kind = 'plant' | 'equipment' | 'string' | 'pyranometer' | 'rtu-enterprise';

const DEPTHS = {
  plant: PlantDepth,
  equipment: EquipmentDepth,
  string: StringDepth,
  pyranometer: PyranometerDepth,
  'rtu-enterprise': RtuEnterpriseDepth,
} as const;

/**
 * 발전소·설비 관리 (SFR-016) — 발전소와 그 아래 붙는 것들을 갈아 가며 다룬다.
 *
 * 설비·스트링·일사량계는 발전소가 있어야 설 수 있는 것들이라 여기 함께 둔다.
 * RTU 업체는 발전소에 매이지는 않지만 발전소 등록에서 곧바로 고르는 값이라 같은 자리에 둔다.
 * 어느 발전소에도 매이지 않는 제품 카탈로그(인버터·모듈)는 시스템장비 관리 몫이다.
 */
function PlantsPage({ depth }: { depth: AdminDepth }) {
  const { kind = 'plant' } = useParams<{ kind: Kind }>();
  const navigate = useNavigate();
  const Depth = DEPTHS[kind as Kind] ?? DEPTHS.plant;

  return (
    <div className={styles.tab}>
      {/* 폼에서는 갈래를 갈아 끼울 자리가 아니다 — 적던 값이 주소와 함께 날아간다. */}
      {depth === 'list' ? (
        <div className={styles.toolbar}>
          <SegmentedControl
            value={kind as Kind}
            onChange={(value) => navigate(listPath('plants', value))}
            label="관리 갈래"
            options={[
              { value: 'plant', label: '발전소' },
              { value: 'equipment', label: '설비' },
              { value: 'string', label: '스트링' },
              { value: 'pyranometer', label: '일사량계' },
              { value: 'rtu-enterprise', label: 'RTU업체' },
            ]}
          />
        </div>
      ) : null}

      <Depth depth={depth} />
    </div>
  );
}

export default PlantsPage;
