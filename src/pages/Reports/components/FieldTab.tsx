import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  CHECK_OPTIONS,
  FileUpload,
  FormRow,
  FormSection,
  RadioGroup,
  TextArea,
  TextField,
} from '@/components/common/Form';
import {
  CHECK_LABEL,
  CHECKLIST_TEMPLATES,
  findRepeatIssues,
  getTemplate,
  REPORT_STATE_LABEL,
  STATE_ORDER,
} from '@/mocks/fieldReport';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW, TODAY } from '@/mocks/today';
import { PlusIcon, PrinterIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Select } from '@/components/common/Select';
import { cn } from '@/utils/cn';
import { mergeFieldReports } from '@/stores/fieldReportStore';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import { usePrint } from '@/hooks/usePrint';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { BadgeTone } from '@/components/common/Badge';
import type { CheckResult, FieldReport, ReportState } from '@/interface/fieldReport';
import type { UploadFile } from '@/components/common/Form';
import styles from '../Reports.module.scss';

const STATE_TONE: Record<ReportState, BadgeTone> = {
  draft: 'neutral',
  submitted: 'brand',
  reviewing: 'caution',
  confirmed: 'ok',
};

interface DraftState {
  id: string;
  templateId: string;
  targetName: string;
  inspector: string;
  summary: string;
  actionNote: string;
  results: Record<string, CheckResult | null>;
  notes: Record<string, string>;
  photos: UploadFile[];
}

/**
 * 현장 보고서 온라인 작성·관리 (SFR-021).
 * 양식을 골라 체크리스트를 채우고 사진을 붙여 임시 저장했다가 제출한다.
 */
export function FieldTab() {
  const { plant, label } = usePlantScope();
  const user = useAuthUser();
  const print = usePrint();
  const save = useFieldReportStore((state) => state.save);
  const patch = useFieldReportStore((state) => state.patch);
  const nextId = useFieldReportStore((state) => state.nextId);
  // 스토어가 바뀌면 목록을 다시 읽는다.
  const created = useFieldReportStore((state) => state.created);
  const patched = useFieldReportStore((state) => state.patched);
  const deleted = useFieldReportStore((state) => state.deleted);

  const [openId, setOpenId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState<'draft' | 'submit' | null>(null);

  const reports = useMemo(() => {
    const all = mergeFieldReports(created, patched, deleted);

    return plant ? all.filter((item) => item.schoolId === plant.id) : all;
  }, [plant, created, patched, deleted]);

  const repeats = useMemo(() => findRepeatIssues(reports), [reports]);
  const detail = reports.find((item) => item.id === openId) ?? null;
  const template = draft ? getTemplate(draft.templateId) : null;

  const startWriting = () => {
    setDraft({
      id: nextId(),
      templateId: CHECKLIST_TEMPLATES[0].id,
      targetName: plant?.name ?? '',
      inspector: user?.name ?? '',
      summary: '',
      actionNote: '',
      results: {},
      notes: {},
      photos: [],
    });
    setError(undefined);
    setIsWriting(true);
  };

  /** 필수 항목이 다 채워졌는지 (SIF-001-02) */
  const validate = (): boolean => {
    if (!draft || !template) return false;

    if (!draft.inspector.trim()) {
      setError(MSG.requiredField('점검자'));

      return false;
    }

    const missing = template.items.findIndex((_, index) => !draft.results[`${template.id}-${index}`]);

    if (missing >= 0) {
      setError(MSG.selectRequired(`${missing + 1}번 점검 항목`));

      return false;
    }

    setError(undefined);

    return true;
  };

  const buildReport = (state: ReportState): FieldReport | null => {
    if (!draft || !template || !plant) return null;

    const checklist = template.items.map((itemLabel, index) => {
      const id = `${template.id}-${index}`;

      return { id, label: itemLabel, result: draft.results[id] ?? null, note: draft.notes[id] ?? '' };
    });
    const abnormal = checklist.filter((item) => item.result === 'abnormal').length;

    return {
      id: draft.id,
      schoolId: plant.id,
      schoolName: plant.name,
      templateId: template.id,
      inspectType: template.inspectType,
      targetKind: template.targetKind,
      targetName: draft.targetName || plant.name,
      inspector: draft.inspector,
      date: TODAY.format('YYYY-MM-DD'),
      state,
      checklist,
      photos: draft.photos.map((file) => ({ id: file.id, name: file.name, itemId: null })),
      summary:
        draft.summary
        || (abnormal > 0 ? `점검 항목 ${abnormal}건에서 이상을 확인했습니다.` : '점검 항목 전체 정상입니다.'),
      actionNote: draft.actionNote,
      history: [
        {
          at: NOW.format('YYYY-MM-DD HH:mm'),
          actor: draft.inspector,
          change: state === 'draft' ? '임시 저장했습니다.' : '제출했습니다.',
        },
      ],
    };
  };

  const commit = (state: ReportState) => {
    const report = buildReport(state);

    if (!report) return;

    save(report);
    toast.success(state === 'draft' ? MSG.saveDraftSuccess : MSG.submitSuccess('현장보고서'));
    setIsWriting(false);
    setDraft(null);
  };

  /** 확인완료 직전까지 다음 단계로 넘긴다 (SFR-021-08) */
  const advance = (report: FieldReport) => {
    const index = STATE_ORDER.indexOf(report.state);

    if (index < 0 || index >= STATE_ORDER.length - 1) return;

    const next = STATE_ORDER[index + 1];

    patch(report.id, {
      state: next,
      history: [
        ...report.history,
        {
          at: NOW.format('YYYY-MM-DD HH:mm'),
          actor: user?.name ?? '담당자',
          change: `${REPORT_STATE_LABEL[next]}(으)로 바꿨습니다.`,
        },
      ],
    });
    toast.success(`${REPORT_STATE_LABEL[next]}(으)로 처리했습니다.`);
  };

  return (
    <div className={styles.tab}>
      <div className={cn(styles.toolbar, 'no-print')}>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__note}>
            {label} · 보고서 {reports.length}건
          </p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={startWriting} disabled={!plant}>
            보고서 작성
          </Button>
        </div>
      </div>

      {!plant ? (
        <Card padding="none">
          <EmptyState
            title="발전소를 먼저 고르세요"
            description="현장보고서는 발전소 한 곳을 기준으로 작성합니다. 좌측 조회 대상에서 학교를 골라 주세요."
          />
        </Card>
      ) : null}

      {repeats.length > 0 ? (
        <Reveal>
          <div className={styles.repeat}>
            <p className={styles.repeat__title}>같은 항목이 반복해 이상으로 나왔습니다</p>
            {repeats.map((item) => (
              <p key={`${item.schoolName}-${item.label}`} className={styles.repeat__item}>
                {item.schoolName} · {item.label} — {item.count}회
              </p>
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.06}>
        <Card
          eyebrow="Reports"
          title="점검 보고서 목록"
          description="보고서를 누르면 점검 항목과 상태 이력을 펼쳐 봅니다. 과거 보고서와 견주어 반복 이슈를 찾습니다."
        >
          {reports.length === 0 ? (
            <EmptyState title="보고서가 없습니다" description="위 버튼으로 첫 보고서를 작성해 보세요." />
          ) : (
            <div className={styles.list}>
              {reports.map((report) => (
                <button key={report.id} type="button" className={styles.row} onClick={() => setOpenId(report.id)}>
                  <span className={styles.row__body}>
                    <span className={styles.row__title}>
                      {report.schoolName} · {getTemplate(report.templateId).label}
                    </span>
                    <span className={styles.row__meta}>
                      {report.date} · 점검자 {report.inspector} · {report.summary}
                    </span>
                  </span>
                  <span className={styles.row__right}>
                    <Badge tone="neutral">{report.inspectType}</Badge>
                    <Badge tone={STATE_TONE[report.state]} withDot>
                      {REPORT_STATE_LABEL[report.state]}
                    </Badge>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      <Modal
        isOpen={detail !== null}
        onClose={() => setOpenId(null)}
        size="lg"
        title={detail ? `${detail.schoolName} 점검 보고서` : ''}
        description={
          detail
            ? `${detail.date} · ${getTemplate(detail.templateId).label} · 점검자 ${detail.inspector}`
            : undefined
        }
        footer={detail ? (
          <>
            <Button
              variant="secondary"
              iconLeft={<PrinterIcon />}
              onClick={() => print(`현장보고서_${detail.schoolName}_${detail.date}`)}
            >
              PDF 로 저장
            </Button>
            {STATE_ORDER.indexOf(detail.state) < STATE_ORDER.length - 1 ? (
              <Button onClick={() => advance(detail)}>
                {REPORT_STATE_LABEL[STATE_ORDER[STATE_ORDER.indexOf(detail.state) + 1]]}로 처리
              </Button>
            ) : null}
          </>
        ) : null}
      >
        {detail ? (
          <div className={styles.post}>
            <div className={styles.stateFlow}>
              {STATE_ORDER.map((state, index) => {
                const current = STATE_ORDER.indexOf(detail.state);

                return (
                  <span key={state} className={styles.stateFlow__step}>
                    <span
                      className={cn({
                        [styles['stateFlow__step--done']]: index < current,
                        [styles['stateFlow__step--current']]: index === current,
                      })}
                    >
                      {REPORT_STATE_LABEL[state]}
                    </span>
                  </span>
                );
              })}
            </div>

            <p className={styles.post__body}>{detail.summary}</p>

            {detail.checklist.map((item) => (
              <div
                key={item.id}
                className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: item.result === 'abnormal' })}
              >
                <p className={styles.checkItem__label}>{item.label}</p>
                <p className={styles.post__meta}>
                  <span>{item.result ? CHECK_LABEL[item.result] : '미기재'}</span>
                  {item.note ? <span>{item.note}</span> : null}
                </p>
              </div>
            ))}

            {detail.actionNote ? (
              <div className={styles.checkItem}>
                <p className={styles.checkItem__label}>조치 내용</p>
                <p className={styles.post__body}>{detail.actionNote}</p>
              </div>
            ) : null}

            {detail.photos.length > 0 ? (
              <div className={styles.post__files}>
                {detail.photos.map((photo) => (
                  <span key={photo.id} className={styles.post__file}>
                    {photo.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className={styles.comments}>
              {detail.history.map((item, index) => (
                <div key={`${item.at}-${index}`} className={styles.comment}>
                  <p className={styles.comment__head}>
                    <span className={styles.comment__author}>{item.actor}</span>
                    <span>{item.at}</span>
                  </p>
                  <p className={styles.comment__body}>{item.change}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isWriting}
        onClose={() => setIsWriting(false)}
        size="lg"
        title="현장 점검 보고서 작성"
        description={`${plant?.name ?? ''} · ${TODAY.format('YYYY년 M월 D일')}`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirming('draft')}>
              임시 저장
            </Button>
            <Button
              onClick={() => {
                if (validate()) setConfirming('submit');
              }}
            >
              제출
            </Button>
          </>
        )}
      >
        {draft && template ? (
          <div className={styles.form}>
            <FormSection legend="점검 개요" hint="양식을 고르면 아래 체크리스트가 그 양식으로 바뀝니다.">
              <FormRow cols={2}>
                <Select
                  label="점검 양식"
                  value={draft.templateId}
                  onChange={(value) => setDraft({ ...draft, templateId: value, results: {}, notes: {} })}
                  options={CHECKLIST_TEMPLATES.map((item) => ({
                    value: item.id,
                    label: `${item.label} (${item.inspectType})`,
                  }))}
                />
                <TextField
                  label="점검 대상"
                  value={draft.targetName}
                  onChange={(value) => setDraft({ ...draft, targetName: value })}
                  width="md"
                  hint="인버터 번호나 수집장치 이름을 적어도 됩니다."
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="점검자"
                  value={draft.inspector}
                  onChange={(value) => setDraft({ ...draft, inspector: value })}
                  required
                  error={error?.includes('점검자') ? error : undefined}
                  width="md"
                />
                <TextField label="점검일" value={TODAY.format('YYYY-MM-DD')} onChange={() => {}} readOnly width="md" />
              </FormRow>
            </FormSection>

            <FormSection
              legend="점검 항목"
              hint="항목마다 정상·이상·해당없음 중 하나를 골라 주세요. 전부 골라야 제출할 수 있습니다."
            >
              {template.items.map((itemLabel, index) => {
                const id = `${template.id}-${index}`;
                const result = draft.results[id] ?? null;

                return (
                  <div
                    key={id}
                    className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: result === 'abnormal' })}
                  >
                    <RadioGroup
                      legend={`${index + 1}. ${itemLabel}`}
                      value={result}
                      onChange={(value) => setDraft({ ...draft, results: { ...draft.results, [id]: value } })}
                      options={CHECK_OPTIONS}
                      required
                      error={error?.includes(`${index + 1}번`) ? error : undefined}
                    />
                    {result === 'abnormal' ? (
                      <TextField
                        label="이상 내용"
                        value={draft.notes[id] ?? ''}
                        onChange={(value) => setDraft({ ...draft, notes: { ...draft.notes, [id]: value } })}
                        placeholder="무엇이 어떻게 이상한지 적어 주세요."
                      />
                    ) : null}
                  </div>
                );
              })}
            </FormSection>

            <FormSection legend="현장 사진" hint="이상 항목이 있으면 사진을 함께 남겨 주세요.">
              <FileUpload
                label="사진 올리기"
                value={draft.photos}
                onChange={(files) => setDraft({ ...draft, photos: files })}
                onError={(message) => toast.error(message)}
              />
            </FormSection>

            <FormSection legend="정리">
              <TextArea
                label="점검 요약"
                value={draft.summary}
                onChange={(value) => setDraft({ ...draft, summary: value })}
                optional
                placeholder="비워 두면 이상 건수로 자동 요약합니다."
                maxLength={200}
              />
              <TextArea
                label="조치 내용"
                value={draft.actionNote}
                onChange={(value) => setDraft({ ...draft, actionNote: value })}
                optional
                hint="여기 적은 내용은 월간보고서에 함께 실립니다."
                maxLength={300}
              />
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming !== null}
        title={confirming === 'draft' ? '임시 저장할까요?' : MSG.submitConfirm('현장보고서')}
        description={
          confirming === 'draft'
            ? '작성중 상태로 저장합니다. 나중에 이어서 채울 수 있습니다.'
            : '제출하면 상태가 제출완료로 바뀌고, 이후 변경은 이력에 남습니다.'
        }
        confirmLabel={confirming === 'draft' ? '임시 저장' : '제출'}
        onConfirm={() => commit(confirming === 'draft' ? 'draft' : 'submitted')}
        onClose={() => setConfirming(null)}
      />
    </div>
  );
}
