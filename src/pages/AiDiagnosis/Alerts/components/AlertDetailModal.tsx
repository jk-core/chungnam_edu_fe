import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DateControl, FormField, FormRow, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { daysAhead, NOW } from '@/mocks/today';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatDuration } from '@/utils/format';
import { getFaultCode } from '@/mocks/equipment';
import { toast } from '@/stores/toastStore';
import { useAddAction, useSnooze, useUnsnooze } from '@/stores/faultActionStore';
import { useAuthUser } from '@/stores/authStore';
import type { AlarmDetail } from '@/interface/alert';
import styles from '../Alerts.module.scss';
import { durationOfDetail } from './alarmDetail';

type ResolveChoice = 'resolve' | 'progress';

/** 사흘 뒤를 첫 제안으로 둔다 — 현장 방문을 잡기에 가장 흔한 간격이다 */
const DEFAULT_AHEAD_DAYS = 3;

interface AlertDetailModalProps {
  alarm: AlarmDetail | null;
  onClose: () => void;
}

/**
 * 알림 한 건의 상세와 조치 (SFR-015-04 / SFR-022-04/05).
 *
 * 표에서 누르든 간트 막대를 누르든 같은 창이다 — 보는 것이 같은데 창이 둘이면 어느 쪽에서
 * 조치했는지에 따라 남는 내용이 갈린다. 조치 예정일도 여기서 함께 받는다: 조치와 재우기가
 * 결국 같은 저장 한 번이라, 창을 따로 두면 두 번 눌러야 한다.
 */
export function AlertDetailModal({ alarm, onClose }: AlertDetailModalProps) {
  // 고른 건이 바뀌면 창을 새로 세운다 — 앞서 적던 조치 내용이 다음 건에 남지 않게.
  return alarm ? <DetailBody key={alarm.id} alarm={alarm} onClose={onClose} /> : null;
}

function DetailBody({ alarm, onClose }: { alarm: AlarmDetail; onClose: () => void }) {
  const user = useAuthUser();
  const addAction = useAddAction();
  const snooze = useSnooze();
  const unsnooze = useUnsnooze();

  const [choice, setChoice] = useState<ResolveChoice>(alarm.handled ? 'progress' : 'resolve');
  const [actor, setActor] = useState(user?.name ?? '');
  const [note, setNote] = useState('');
  const [usePlan, setUsePlan] = useState<'yes' | 'no'>(alarm.plannedAt ? 'yes' : 'no');
  const [plannedAt, setPlannedAt] = useState(alarm.plannedAt ?? daysAhead(DEFAULT_AHEAD_DAYS));
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);

  const fault = getFaultCode(alarm.faultCode);

  const submit = () => {
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
    addAction(alarm.id, {
      at: NOW.format('YYYY-MM-DD HH:mm'),
      note: note.trim(),
      actor: actor.trim(),
      resolves: choice === 'resolve',
    });

    // 재우기는 조치와 한 번에 저장한다 — 예정일을 비우면 접어 둔 것을 푼다.
    if (usePlan === 'yes') snooze(alarm.id, plannedAt);
    else unsnooze(alarm.id);

    toast.success(choice === 'resolve' ? '조치 완료로 처리했습니다.' : '조치 진행 이력을 남겼습니다.');
    setConfirming(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={alarm.title}
        description={`${alarm.plantName} · ${alarm.deviceName}`}
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>닫기</Button>
            <Button onClick={submit}>조치 저장</Button>
          </>
        )}
      >
        <div className={styles.detail}>
          <div className={styles.detail__badges}>
            <Badge tone={OPERATION_TONE[alarm.status]} withDot>
              {OPERATION_LABEL[alarm.status]}
            </Badge>
            <Badge tone={alarm.handled ? 'ok' : 'critical'} withDot>
              {alarm.handled ? '조치 완료' : '미조치'}
            </Badge>
            {/* 고장코드로 뜬 알림이면 어느 분류인지 함께 적는다 (SFR-015-02) */}
            {fault && fault.code > 0 ? <Badge tone="brand">{fault.label} · {fault.summary}</Badge> : null}
            {alarm.plannedAt ? <Badge tone="caution">조치 예정 {alarm.plannedAt}</Badge> : null}
          </div>

          <p className={styles.detail__description}>{alarm.message}</p>

          <dl className={styles.detail__meta}>
            <div>
              <dt>발생 일시</dt>
              <dd>{alarm.occurredAt}</dd>
            </div>
            <div>
              <dt>처리 일시</dt>
              <dd>{alarm.resolvedAt ?? '진행 중'}</dd>
            </div>
            <div>
              <dt>지속 시간</dt>
              <dd className={alarm.handled ? undefined : styles.deltaDown}>
                {formatDuration(durationOfDetail(alarm))}
              </dd>
            </div>
            <div>
              <dt>설비</dt>
              <dd>{alarm.plantName} · {alarm.deviceName}</dd>
            </div>
          </dl>

          <section className={styles.detail__block}>
            <h3 className={styles.detail__blockTitle}>지난 조치</h3>
            {alarm.handled || alarm.actionNote ? (
              <dl className={styles.detail__action}>
                <div>
                  <dt>조치자</dt>
                  <dd>{alarm.handler ?? '—'}</dd>
                </div>
                <div>
                  <dt>조치 방식</dt>
                  <dd>{alarm.manual ? '현장 수동 조치' : '자동 복구'}</dd>
                </div>
                <div>
                  <dt>조치 내용</dt>
                  <dd>{alarm.actionNote ?? '—'}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.detail__pending}>아직 조치되지 않았습니다. 담당자 배정이 필요합니다.</p>
            )}
          </section>

          {/* 조치 입력 (SFR-015-04). 예정일까지 한 폼에서 받아 저장 한 번으로 끝낸다. */}
          <section className={styles.detail__block}>
            <h3 className={styles.detail__blockTitle}>조치 기록</h3>
            <div className={styles.actionForm}>
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
                <TextField
                  label="조치 일시"
                  value={NOW.format('YYYY-MM-DD HH:mm')}
                  onChange={() => undefined}
                  readOnly
                  width="md"
                />
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

              <FormRow cols={2}>
                <RadioGroup
                  legend="조치 예정일"
                  value={usePlan}
                  onChange={setUsePlan}
                  options={[
                    { value: 'no', label: '두지 않음' },
                    { value: 'yes', label: '예정일까지 접어 둠', tone: 'brand' },
                  ]}
                />
                {/*
                  안내 문구를 고른 값에 따라 넣었다 뺐다 하지 않는다 — 한 줄이 생겼다 사라지면서
                  창 높이가 바뀌고, 가운데 정렬이라 라디오를 누를 때마다 머리글과 바닥글이 함께 튄다.
                */}
                <FormField label="예정일" hint="이 날짜가 지나면 다시 위로 올라옵니다.">
                  <DateControl value={plannedAt} onChange={setPlannedAt} disabled={usePlan === 'no'} />
                </FormField>
              </FormRow>
            </div>
          </section>

          {fault ? (
            <section className={`${styles.detail__block} ${styles['detail__block--fault']}`}>
              <h3 className={styles.detail__blockTitle}>
                {fault.label} · {fault.summary}
              </h3>
              <div className={styles.detail__faultGrid}>
                <div>
                  <p className={styles.detail__faultLabel}>고장 코드 문제</p>
                  <ul className={styles.detail__faultList}>
                    {fault.description.map((cause) => (
                      <li key={cause}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={styles.detail__faultLabel}>조치 방안</p>
                  <ul className={styles.detail__faultList}>
                    {fault.plan.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={choice === 'resolve' ? '조치 완료로 처리할까요?' : '조치 이력을 남길까요?'}
        description={choice === 'resolve'
          ? '완료로 처리하면 미조치 목록에서 빠집니다. 기록은 타임라인에 남습니다.'
          : '진행 이력으로 남기고 건은 미조치 상태를 유지합니다.'}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
