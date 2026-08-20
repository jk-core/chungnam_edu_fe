import { REPEAT_WINDOW_DAYS } from '@/mocks/fieldReport';
import { Reveal } from '@/components/common/Reveal';
import styles from '../FieldReport.module.scss';

interface RepeatIssue {
  schoolId: string;
  schoolName: string;
  label: string;
  count: number;
  lastDate: string;
}

/** 같은 항목이 되풀이해 이상으로 나온 경우를 목록 위에 세운다 (SFR-021-11) */
export function RepeatNotice({ issues }: { issues: RepeatIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <Reveal>
      <div className={styles.repeat}>
        <p className={styles.repeat__title}>
          같은 항목이 반복해 이상으로 나왔습니다
          <span className={styles.repeat__scope}> · 최근 {REPEAT_WINDOW_DAYS / 365}년, 같은 발전소 기준</span>
        </p>
        {issues.map((item) => (
          <p key={`${item.schoolId}-${item.label}`} className={styles.repeat__item}>
            {item.schoolName} · {item.label} — {item.count}회 (최근 {item.lastDate})
          </p>
        ))}
      </div>
    </Reveal>
  );
}
