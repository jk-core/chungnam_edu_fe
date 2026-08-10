import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import styles from '../Admin.module.scss';
import { FieldReportList } from './FieldReportList';
import { FieldTemplateEditor } from './FieldTemplateEditor';

/** 무엇을 관리할지 (SFR-021-08/14) */
type Kind = 'reports' | 'templates';

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'reports', label: '보고서 관리' },
  { value: 'templates', label: '점검 양식' },
];

/**
 * 현장보고서 관리 (SFR-021-08/14).
 *
 * 발전관리 › 현장보고서는 학교 한 곳을 기준으로 쓰고 읽는 자리다. 여기는 그 반대로,
 * 전체 학교 보고서를 한 목록에서 훑고 상태를 정리하며, 점검 양식 자체를 손보는 자리다.
 */
export function FieldReportsTab() {
  const [kind, setKind] = useState<Kind>('reports');

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <SegmentedControl value={kind} onChange={setKind} options={KIND_OPTIONS} label="관리 대상" />
      </div>

      {kind === 'reports' ? <FieldReportList /> : <FieldTemplateEditor />}
    </div>
  );
}
