import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import type { summarizeQuality } from '@/mocks/quality';
import styles from '../../Admin.module.scss';

/** 조회 기간 전체의 수집 품질 (SFR-012-10). */
export function QualitySummary({ total }: { total: ReturnType<typeof summarizeQuality> }) {
  return (
    <Reveal>
      <div className={styles.summary}>
        <StatCard label="전체 품질률" value={total.qualityRate * 100} unit="%" fractionDigits={1} accent />
        <StatCard label="검증 대상" value={total.totalRows} unit="건" />
        <StatCard label="기준 미달 발전소" value={total.belowThreshold} unit="개소" />
      </div>
    </Reveal>
  );
}
