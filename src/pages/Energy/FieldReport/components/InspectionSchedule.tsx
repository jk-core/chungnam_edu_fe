import { motion } from 'motion/react';
import { AlertIcon, CalendarIcon, CheckIcon } from '@/components/common/Icon';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { scheduleProgress } from '@/mocks/fieldReport';
import { cn } from '@/utils/cn';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useTemplates } from '@/stores/fieldReportStore';
import type { FieldReport, ScheduleProgress } from '@/interface/fieldReport';
import styles from '../FieldReport.module.scss';

const STATE_META: Record<ScheduleProgress, { label: string; icon: typeof CheckIcon }> = {
  done: { label: '완료', icon: CheckIcon },
  scheduled: { label: '예정', icon: CalendarIcon },
  overdue: { label: '지연', icon: AlertIcon },
};

interface InspectionScheduleProps {
  /** 이 발전소가 낸 보고서 — 이번 회차를 이행했는지 여기서 가린다 */
  reports: FieldReport[];
}

/**
 * 점검 양식마다 잡힌 이번 회차 일정과 그 이행 상태 (SFR-021-19).
 *
 * 기간 필터를 두지 않는다 — 「일정이 다가올 때 알린다」가 요구인데 지난 기간만 보여 주면
 * 정작 아직 안 낸 점검이 화면에서 사라진다. 마감이 이른 것부터 위에 둔다.
 */
export function InspectionSchedule({ reports }: InspectionScheduleProps) {
  const { plant, plantLabel: label } = usePlantScope();
  const templates = useTemplates();

  const items = [...templates]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((template) => ({ template, progress: scheduleProgress(template, reports) }));

  if (!plant || items.length === 0) {
    return (
      <div className={styles.tab}>
        <Card padding="none">
          <EmptyState
            title="잡힌 점검 일정이 없습니다"
            description="관리자 콘솔에서 점검 양식에 기간을 넣으면 여기에 나타납니다."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          title="점검 일정"
          description={`${label} · 점검 ${items.length}건입니다. 마감이 이른 것부터 보여 줍니다.`}
        >
          <ol className={styles.timeline}>
            {items.map(({ template, progress }, index) => {
              const meta = STATE_META[progress];
              const Icon = meta.icon;

              return (
                <motion.li
                  key={template.id}
                  className={styles.timeline__item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: index * 0.06 }}
                >
                  <span className={cn(styles.timeline__marker, styles[`timeline__marker--${progress}`])}>
                    <Icon />
                  </span>

                  <div className={styles.timeline__body}>
                    <div className={styles.timeline__head}>
                      <p className={styles.timeline__title}>{template.label}</p>
                      <p className={cn(styles.timeline__state, styles[`timeline__state--${progress}`])}>
                        {meta.label}
                      </p>
                    </div>
                    <p className={styles.timeline__meta}>
                      {template.startDate} ~ {template.dueDate} · {template.inspectType}점검 · {template.targetType}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </Card>
      </Reveal>
    </div>
  );
}
