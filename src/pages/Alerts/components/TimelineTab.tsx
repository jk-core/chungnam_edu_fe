import { useMemo, useState } from 'react';
import { AlertIcon, CheckIcon, ClockIcon, UserIcon, WrenchIcon } from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { getFaultCode } from '@/mocks/equipment';
import { getFaultTimelines, PHASE_LABEL, timelineDurationMinutes } from '@/mocks/faultTimeline';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { cn } from '@/utils/cn';
import { formatDuration, formatNumber } from '@/utils/format';
import { mergeSteps, useAddAction, useManualActions } from '@/stores/faultActionStore';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { FaultTimeline, TimelinePhase } from '@/interface/faultTimeline';
import shared from '../AiDiagnosis.module.scss';
import styles from './TimelineTab.module.scss';
import { AnalysisFilter } from './AnalysisFilter';

const PHASE_ICON: Record<TimelinePhase, typeof AlertIcon> = {
  detected: AlertIcon,
  notified: ClockIcon,
  inProgress: WrenchIcon,
  resolved: CheckIcon,
};

type ResolveChoice = 'resolve' | 'progress';

/**
 * 고장 발생부터 조치 완료까지 단계별 이력 (SFR-015).
 * 정상 가동 기간은 만들지 않고 이상 발생 구간만 모아 보여 준다.
 */
export function TimelineTab() {
  const { target, label } = useDiagnosisScope();
  const user = useAuthUser();
  const addAction = useAddAction();
  // 사용자가 넣은 조치가 바뀌면 목록을 다시 그린다.
  const manual = useManualActions();

  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actor, setActor] = useState(user?.name ?? '');
  const [choice, setChoice] = useState<ResolveChoice>('resolve');
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);

  const timelines = useMemo(() => {
    const rows = getFaultTimelines(target);

    return rows.map((row) => {
      const steps = mergeSteps(row.steps, manual[row.id]);
      const resolvedStep = steps.findLast((step) => step.phase === 'resolved');

      return {
        ...row,
        steps,
        resolved: Boolean(resolvedStep),
        endedAt: resolvedStep?.at ?? null,
      } satisfies FaultTimeline;
    });
  }, [target, manual]);

  const open = timelines.filter((item) => !item.resolved);
  const editing = timelines.find((item) => item.id === openId) ?? null;

  const totalLoss = timelines.reduce((sum, item) => sum + item.lossKwh, 0);
  const avgMinutes = timelines.length > 0
    ? Math.round(timelines.reduce((sum, item) => sum + timelineDurationMinutes(item), 0) / timelines.length)
    : 0;

  const submit = () => {
    if (!editing) return;

    if (!note.trim()) {
      setError(MSG.requiredField('조치 내용'));

      return;
    }

    if (!actor.trim()) {
      setError(MSG.requiredField('조치자'));

      return;
    }

    setError(undefined);
    setConfirming(true);
  };

  const commit = () => {
    if (!editing) return;

    addAction(editing.id, {
      at: NOW.format('YYYY-MM-DD HH:mm'),
      note: note.trim(),
      actor: actor.trim(),
      resolves: choice === 'resolve',
    });

    toast.success(choice === 'resolve' ? '조치 완료로 처리했습니다.' : '조치 진행 이력을 남겼습니다.');
    setOpenId(null);
    setNote('');
  };

  return (
    <div className={shared.tab}>
      <AnalysisFilter trailing={<p className={shared.toolbar__count}>이상 구간 {timelines.length}건</p>} />

      <Reveal>
        <div className={styles.summary}>
          <StatCard label="이상 발생 구간" value={timelines.length} unit="건" icon={<AlertIcon />} />
          <StatCard label="미조치" value={open.length} unit="건" icon={<WrenchIcon />} />
          <StatCard
            label="평균 경과 시간"
            value={Math.round(avgMinutes / 60)}
            unit="시간"
            icon={<ClockIcon />}
          />
          <StatCard label="추정 발전 손실" value={totalLoss} unit="kWh" fractionDigits={0} accent />
        </div>
      </Reveal>

      {timelines.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="이상 발생 구간이 없습니다"
            description={`${label}에는 조회 범위 안에 기록된 고장이 없습니다.`}
          />
        </Card>
      ) : (
        <Reveal delay={0.06}>
          <Card
            eyebrow="Timeline"
            title="고장 타임라인"
            description="정상 가동 기간은 빼고 이상이 있던 구간만 모았습니다. AI 가 판별한 고장과 시스템이 잡은 통신 장애를 구분하고, 관리자가 넣은 조치는 따로 표시합니다."
          >
            <div className={styles.list}>
              {timelines.map((item) => {
                const fault = getFaultCode(item.faultCode);

                return (
                  <article
                    key={item.id}
                    className={cn(styles.item, item.resolved ? styles['item--done'] : styles['item--open'])}
                  >
                    <header className={styles.item__head}>
                      <div>
                        <p className={styles.item__title}>
                          {item.plantName} · {item.deviceName}
                        </p>
                        <p className={styles.item__meta}>
                          <span>발생 {item.startedAt}</span>
                          <span>
                            {item.resolved ? `완료 ${item.endedAt}` : '조치 진행 중'} · 경과{' '}
                            {formatDuration(timelineDurationMinutes(item))}
                          </span>
                          <span>추정 손실 {formatNumber(item.lossKwh, 1)}kWh</span>
                        </p>
                      </div>

                      <div className={styles.item__badges}>
                        <Badge tone={item.source === 'ai' ? 'brand' : 'offline'}>
                          {item.source === 'ai' ? 'AI 판별' : '시스템 감지'}
                        </Badge>
                        {fault && fault.code !== 'F-000' ? (
                          <Badge tone="critical">
                            {fault.code} {fault.label}
                          </Badge>
                        ) : null}
                        <Badge tone={item.resolved ? 'ok' : 'caution'} withDot>
                          {item.resolved ? '조치 완료' : '미조치'}
                        </Badge>
                      </div>
                    </header>

                    <ol className={styles.steps}>
                      {item.steps.map((step, index) => {
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

                    <div className={styles.actions}>
                      <span className={styles.actions__note}>
                        {item.resolved
                          ? '조치가 끝난 건입니다. 추가 이력이 필요하면 다시 기록할 수 있습니다.'
                          : '현장 확인 결과를 남기거나 완료로 처리하세요.'}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={<WrenchIcon />}
                        onClick={() => {
                          setOpenId(item.id);
                          setNote('');
                          setActor(user?.name ?? '');
                          setChoice(item.resolved ? 'progress' : 'resolve');
                          setError(undefined);
                        }}
                      >
                        조치 기록
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Card>
        </Reveal>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setOpenId(null)}
        title="조치 기록"
        description={editing ? `${editing.plantName} · ${editing.deviceName}` : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setOpenId(null)}>
              취소
            </Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <RadioGroup
            legend="처리 구분"
            value={choice}
            onChange={setChoice}
            options={[
              { value: 'resolve', label: '조치 완료', tone: 'ok' },
              { value: 'progress', label: '조치 진행', tone: 'brand' },
            ]}
            required
          />

          <FormRow cols={2}>
            <TextField label="조치자" value={actor} onChange={setActor} required width="md" />
            <TextField label="조치 일시" value={NOW.format('YYYY-MM-DD HH:mm')} onChange={() => {}} readOnly width="md" />
          </FormRow>

          <TextArea
            label="조치 내용"
            value={note}
            onChange={setNote}
            required
            error={error}
            placeholder="무엇을 확인하고 어떻게 처리했는지 적어 주세요."
            maxLength={300}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={choice === 'resolve' ? '조치 완료로 처리할까요?' : '조치 이력을 남길까요?'}
        description={
          choice === 'resolve'
            ? '완료로 처리하면 미조치 목록에서 빠집니다. 기록은 타임라인에 남습니다.'
            : '진행 이력으로 남기고 건은 미조치 상태를 유지합니다.'
        }
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
