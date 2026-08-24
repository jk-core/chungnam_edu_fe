import { useNavigate, useParams } from 'react-router-dom';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import styles from '../Admin.module.scss';
import InverterDepth from './Inverter';
import ModuleDepth from './Module';

/** 어느 제품을 볼지 (SFR-017-04/05) */
type Kind = 'inverter' | 'module';

const DEPTHS = {
  inverter: InverterDepth,
  module: ModuleDepth,
} as const;

/**
 * 시스템장비 관리 (SFR-017-04/05).
 *
 * 어느 발전소에도 매이지 않는 제품 카탈로그다 — 설비 등록에서 여기 등록된 것을 고른다.
 * 발전소에 실제로 선 것들은 발전소·설비 관리 몫이다.
 */
function DevicesPage({ depth }: { depth: AdminDepth }) {
  const { kind = 'inverter' } = useParams<{ kind: Kind }>();
  const navigate = useNavigate();
  const Depth = DEPTHS[kind as Kind] ?? DEPTHS.inverter;

  return (
    <div className={styles.tab}>
      {/* 폼에서는 갈래를 갈아 끼울 자리가 아니다 — 적던 값이 주소와 함께 날아간다. */}
      {depth === 'list' ? (
        <div className={styles.toolbar}>
          <SegmentedControl
            value={kind as Kind}
            onChange={(value) => navigate(listPath('devices', value))}
            label="제품 종류"
            options={[
              { value: 'inverter', label: '인버터' },
              { value: 'module', label: '모듈' },
            ]}
          />
        </div>
      ) : null}

      <Depth depth={depth} />
    </div>
  );
}

export default DevicesPage;
