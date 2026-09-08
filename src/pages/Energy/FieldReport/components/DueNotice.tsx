import { DUE_SOON_DAYS, scheduleProgress } from '@/mocks/fieldReport';
import { Reveal } from '@/components/common/Reveal';
import type { FieldReport, ReportTemplate } from '@/interface/fieldReport';
import styles from '../FieldReport.module.scss';

interface DueNoticeProps {
  templates: ReportTemplate[];
  /** 지연인지 임박인지는 이 발전소가 냈는지로 갈린다 */
  reports: FieldReport[];
}

/**
 * 아직 안 낸 점검을 목록 위에 세운다 (SFR-021-19).
 *
 * 마감이 지난 것도 함께 싣고 줄마다 갈라 적는다 — 「다가온다」고만 적으면 이미 넘긴 점검이
 * 다가오는 것처럼 읽힌다. 되풀이 지적 배너와 같은 자리·같은 모양이다.
 */
export function DueNotice({ templates, reports }: DueNoticeProps) {
  if (templates.length === 0) return null;

  return (
    <Reveal>
      <div className={styles.repeat}>
        <p className={styles.repeat__title}>
          아직 내지 않은 점검이 있습니다
          <span className={styles.repeat__scope}> · 마감 {DUE_SOON_DAYS}일 이내이거나 이미 지난 것</span>
        </p>
        {templates.map((template) => (
          <p key={template.id} className={styles.repeat__item}>
            {template.label} · {template.inspectType}점검 — {template.dueDate} 마감
            {scheduleProgress(template, reports) === 'overdue' ? ' (기한 초과)' : ''}
          </p>
        ))}
      </div>
    </Reveal>
  );
}
