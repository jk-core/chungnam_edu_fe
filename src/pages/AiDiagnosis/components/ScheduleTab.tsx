import { motion } from 'motion/react';
import { AlertIcon, CalendarIcon, CheckIcon } from '@/components/common/Icon';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { INSPECTIONS } from '@/mocks/diagnosis';
import { Reveal } from '@/components/common/Reveal';
import { cn } from '@/utils/cn';
import { formatShort, isWithinRange } from '@/utils/date';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useDiagnosisRange } from '@/stores/filterStore';
import type { Inspection } from '@/interface/energy';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisFilter } from './AnalysisFilter';

const STATE_META: Record<Inspection['state'], { label: string; icon: typeof CheckIcon }> = {
  done: { label: '완료', icon: CheckIcon },
  scheduled: { label: '예정', icon: CalendarIcon },
  overdue: { label: '지연', icon: AlertIcon },
};

export function ScheduleTab() {
  const { plant, plantLabel: label } = usePlantScope();
  const [range] = useDiagnosisRange();
  const items = INSPECTIONS.filter(
    (item) => (!plant || item.schoolId === plant.id) && isWithinRange(item.date, range.start, range.end),
  );

  const toolbar = <AnalysisFilter trailing={<p className={styles.toolbar__count}>{items.length}건</p>} />;

  if (items.length === 0) {
    return (
      <div className={styles.tab}>
        {toolbar}
        <Card padding="none">
          <EmptyState
            title="이 기간에 잡힌 점검이 없습니다"
            description={`${label}에는 ${formatShort(range.start)} ~ ${formatShort(range.end)} 사이 점검 일정이 없습니다. 기간을 넓혀 보세요.`}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      {toolbar}

      <Reveal>
        <Card
          eyebrow="Schedule"
          title="점검 일정"
          description={`${label} · ${formatShort(range.start)} ~ ${formatShort(range.end)}. 예정된 점검과 완료된 점검을 시간 순으로 보여줍니다.`}
        >
          <ol className={styles.timeline}>
            {items.map((item, index) => {
              const meta = STATE_META[item.state];
              const Icon = meta.icon;

              return (
                <motion.li
                  key={item.id}
                  className={styles.timeline__item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: index * 0.06 }}
                >
                  <span className={cn(styles.timeline__marker, styles[`timeline__marker--${item.state}`])}>
                    <Icon />
                  </span>

                  <div className={styles.timeline__body}>
                    <div className={styles.timeline__head}>
                      <p className={styles.timeline__title}>{item.schoolName}</p>
                      <p className={cn(styles.timeline__state, styles[`timeline__state--${item.state}`])}>
                        {meta.label}
                      </p>
                    </div>
                    <p className={styles.timeline__meta}>
                      {item.date} · {item.type}
                    </p>
                    <p className={styles.timeline__note}>{item.note}</p>
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
