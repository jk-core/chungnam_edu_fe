import { AlertIcon, CheckIcon, ClockIcon, UserIcon, WrenchIcon } from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { formatDuration, formatNumber } from '@/utils/format';
import { getFaultCode } from '@/mocks/equipment';
import { Modal } from '@/components/common/Modal';
import { PHASE_LABEL, timelineDurationMinutes } from '@/mocks/faultTimeline';
import type { FaultTimeline, TimelinePhase } from '@/interface/faultTimeline';
import styles from './FaultTimeline.module.scss';

const PHASE_ICON: Record<TimelinePhase, typeof AlertIcon> = {
  detected: AlertIcon,
  notified: ClockIcon,
  inProgress: WrenchIcon,
  resolved: CheckIcon,
};

interface TimelineDetailProps {
  timeline: FaultTimeline;
  onClose: () => void;
  onRecord: () => void;
}

/** 고장 한 건의 단계별 이력 (SFR-015) */
export function TimelineDetail({ timeline, onClose, onRecord }: TimelineDetailProps) {
  const fault = getFaultCode(timeline.faultCode);
  const elapsed = formatDuration(timelineDurationMinutes(timeline));

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={`${timeline.plantName} · ${timeline.deviceName}`}
      description={
        `발생 ${timeline.startedAt} · ${timeline.resolved ? `완료 ${timeline.endedAt}` : '조치 진행 중'} · 경과 ${elapsed}`
      }
      footer={<Button iconLeft={<WrenchIcon />} onClick={onRecord}>조치 기록</Button>}
    >
      <div className={styles.detail}>
        <div className={styles.item__badges}>
          <Badge tone={timeline.source === 'ai' ? 'brand' : 'offline'}>
            {timeline.source === 'ai' ? 'AI 판별' : '시스템 감지'}
          </Badge>
          {fault && fault.code !== 0 ? (
            <Badge tone="critical">{fault.label} · {fault.summary}</Badge>
          ) : null}
          <Badge tone={timeline.resolved ? 'ok' : 'caution'} withDot>
            {timeline.resolved ? '조치 완료' : '미조치'}
          </Badge>
          <Badge tone="neutral">추정 손실 {formatNumber(timeline.lossKwh, 1)}kWh</Badge>
        </div>

        <ol className={styles.steps}>
          {timeline.steps.map((step, index) => {
            const Icon = PHASE_ICON[step.phase];

            return (
              <li key={`${step.at}-${index}`} className={styles.step}>
                <span className={cn(styles.step__marker, styles[`step__marker--${step.phase}`])}>
                  <Icon width={13} height={13} />
                </span>
                <div className={styles.step__body}>
                  <p className={styles.step__top}>
                    <span className={styles.step__phase}>{PHASE_LABEL[step.phase]}</span>
                    <span className={styles.step__at}>{step.at}</span>
                    {step.manual ? (
                      <span className={styles.step__manual}>
                        <UserIcon width={11} height={11} />
                        {step.actor ?? '관리자'} 직접 입력
                      </span>
                    ) : null}
                  </p>
                  <p className={styles.step__note}>{step.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Modal>
  );
}
