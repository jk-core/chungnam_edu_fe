import { useNavigate, useParams } from 'react-router-dom';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import styles from '../Admin.module.scss';
import ReportsDepth from './Reports';
import TemplatesDepth from './Templates';

/** 무엇을 관리할지 (SFR-021-08/14) */
type Kind = 'reports' | 'templates';

/**
 * 현장보고서 관리 (SFR-021-08/14).
 *
 * 발전관리 › 현장보고서는 학교 한 곳을 기준으로 쓰고 읽는 자리다. 여기는 그 반대로,
 * 전체 학교 보고서를 한 목록에서 훑고 상태를 정리하며, 점검 양식 자체를 손보는 자리다.
 */
function FieldReportsPage({ depth }: { depth: AdminDepth }) {
  const { kind = 'reports' } = useParams<{ kind: Kind }>();
  const navigate = useNavigate();

  return (
    <div className={styles.tab}>
      {/* 폼에서는 갈래를 갈아 끼울 자리가 아니다 — 적던 값이 주소와 함께 날아간다. */}
      {depth === 'list' ? (
        <div className={styles.toolbar}>
          <SegmentedControl
            value={kind as Kind}
            onChange={(value) => navigate(listPath('field-reports', value))}
            label="관리 대상"
            options={[
              { value: 'reports', label: '보고서 관리' },
              { value: 'templates', label: '점검 양식' },
            ]}
          />
        </div>
      ) : null}

      {kind === 'templates' ? <TemplatesDepth depth={depth} /> : <ReportsDepth />}
    </div>
  );
}

export default FieldReportsPage;
