import { useMemo, useRef, useState } from 'react';
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
  findRepeatIssues,
  flattenTemplate,
  REPEAT_WINDOW_DAYS,
  REPORT_STATE_LABEL,
  STATE_ORDER,
} from '@/mocks/fieldReport';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW, TODAY } from '@/mocks/today';
import { DownloadIcon, PlusIcon, PrinterIcon, UserIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Select } from '@/components/common/Select';
import { cn } from '@/utils/cn';
import { mergeFieldReports, mergeTemplates } from '@/stores/fieldReportStore';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import { usePrint } from '@/hooks/usePrint';
import { useReportPdf } from '@/hooks/useReportPdf';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { BadgeTone } from '@/components/common/Badge';
import type { CheckResult, FieldReport, InspectedDevice, ReportState, ReportTemplate } from '@/interface/fieldReport';
import type { ManagedUser } from '@/interface/account';
import sheetStyles from '@/components/report/Report.module.scss';
import type { UploadFile } from '@/components/common/Form';
import styles from './FieldReport.module.scss';
import { InspectionSchedule } from './components/InspectionSchedule';
import { FieldCompareModal } from './components/FieldCompareModal';
import { FieldReportSheet } from './components/FieldReportSheet';
import { FieldShareModal } from './components/FieldShareModal';
import { getFieldPermission } from './utils/fieldPermission';

const STATE_TONE: Record<ReportState, BadgeTone> = {
  draft: 'neutral',
  submitted: 'brand',
  reviewing: 'caution',
  confirmed: 'ok',
  rejected: 'critical',
};

/** 점검 설비로 고를 수 있는 갈래 (SFR-021-06) */
const DEVICE_KINDS = ['인버터', 'RTU', '접속반', '모듈 어레이', '일사량계', '기타'];

interface DraftState {
  id: string;
  templateId: string;
  targetName: string;
  inspector: string;
  summary: string;
  actionNote: string;
  results: Record<string, CheckResult | null>;
  notes: Record<string, string>;
  /** 점검한 설비와 설비별 특이사항 (SFR-021-06) */
  devices: InspectedDevice[];
  photos: UploadFile[];
  /** 사진 id → 점검 항목 id. 비어 있으면 보고서 전체에 붙은 사진이다 (SFR-021-06). */
  photoLinks: Record<string, string>;
  /** 되돌아온 보고서를 고쳐 다시 내는 중인지 (SFR-021-09) */
  resubmitOf: FieldReport | null;
}

/**
 * 현장 보고서 온라인 작성·관리 (SFR-021).
 * 양식을 골라 체크리스트를 채우고 사진을 붙여 임시 저장했다가 제출한다.
 */
function FieldReportPage() {
  const { plant, label } = usePlantScope();
  const user = useAuthUser();
  const print = usePrint();
  const { download, busy } = useReportPdf();
  const sheetRef = useRef<HTMLDivElement>(null);
  const save = useFieldReportStore((state) => state.save);
  const patch = useFieldReportStore((state) => state.patch);
  const nextId = useFieldReportStore((state) => state.nextId);
  // 스토어가 바뀌면 목록을 다시 읽는다.
  const created = useFieldReportStore((state) => state.created);
  const patched = useFieldReportStore((state) => state.patched);
  const deleted = useFieldReportStore((state) => state.deleted);
  const templatePatched = useFieldReportStore((state) => state.templatePatched);

  const [openId, setOpenId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState<'draft' | 'submit' | null>(null);
  const [sharing, setSharing] = useState<FieldReport | null>(null);
  const [rejecting, setRejecting] = useState<FieldReport | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // 나란히 견줄 두 건 (SFR-021-12)
  const [picked, setPicked] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  const permission = getFieldPermission(user);
  const templates = useMemo(() => mergeTemplates(templatePatched), [templatePatched]);
  const templateOf = (id: string) => templates.find((item) => item.id === id) ?? templates[0];

  const reports = useMemo(() => {
    const all = mergeFieldReports(created, patched, deleted).filter(permission.canRead);

    return plant ? all.filter((item) => item.schoolId === plant.id) : all;
    // permission 은 user 에서 파생된다 — 의존성은 user 하나로 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant, created, patched, deleted, user]);

  const repeats = useMemo(() => findRepeatIssues(reports), [reports]);
  const detail = reports.find((item) => item.id === openId) ?? null;
  const template: ReportTemplate | null = draft ? templateOf(draft.templateId) : null;
  const questions = template ? flattenTemplate(template) : [];
  const pickedReports = picked.map((id) => reports.find((item) => item.id === id)).filter(Boolean) as FieldReport[];

  const startWriting = () => {
    setDraft({
      id: nextId(),
      templateId: templates[0].id,
      targetName: plant?.name ?? '',
      inspector: user?.name ?? '',
      summary: '',
      actionNote: '',
      results: {},
      notes: {},
      devices: [],
      photos: [],
      photoLinks: {},
      resubmitOf: null,
    });
    setError(undefined);
    setIsWriting(true);
  };

  /** 되돌아온(또는 작성중인) 보고서를 그대로 열어 고친다 (SFR-021-09) */
  const startEditing = (report: FieldReport) => {
    setDraft({
      id: report.id,
      templateId: report.templateId,
      targetName: report.targetName,
      inspector: report.inspector,
      summary: report.summary,
      actionNote: report.actionNote,
      results: Object.fromEntries(report.checklist.map((item) => [item.id, item.result])),
      notes: Object.fromEntries(report.checklist.map((item) => [item.id, item.note])),
      devices: report.devices,
      // 이미 올린 사진은 파일 자체를 다시 받아 오지 않는다 — 이름만 들고 목록에 남긴다.
      photos: report.photos.map((photo) => ({
        id: photo.id,
        name: photo.name,
        size: 0,
        type: 'image/jpeg',
        previewUrl: null,
      })),
      photoLinks: Object.fromEntries(
        report.photos.filter((photo) => photo.itemId).map((photo) => [photo.id, photo.itemId as string]),
      ),
      resubmitOf: report,
    });
    setError(undefined);
    setOpenId(null);
    setIsWriting(true);
  };

  /** 필수 항목이 다 채워졌는지 (SIF-001-02) */
  const validate = (): boolean => {
    if (!draft || !template) return false;

    if (!draft.inspector.trim()) {
      setError(MSG.requiredField('점검자'));

      return false;
    }

    const missing = questions.findIndex((item) => !draft.results[item.id]);

    if (missing >= 0) {
      setError(MSG.selectRequired(`${missing + 1}번 점검 항목`));

      return false;
    }

    setError(undefined);

    return true;
  };

  const buildReport = (state: ReportState): FieldReport | null => {
    if (!draft || !template) return null;

    const origin = draft.resubmitOf;
    const school = origin ?? plant;

    if (!school) return null;

    const checklist = questions.map((item) => ({
      ...item,
      result: draft.results[item.id] ?? null,
      note: draft.notes[item.id] ?? '',
    }));
    const abnormal = checklist.filter((item) => item.result === 'abnormal').length;
    // 되돌아온 건을 다시 내는 것이면 제출 횟수를 올리고 반려 사유를 지운다.
    const resubmitting = Boolean(origin && origin.state === 'rejected' && state !== 'draft');

    return {
      id: draft.id,
      schoolId: origin?.schoolId ?? plant?.id ?? '',
      schoolName: origin?.schoolName ?? plant?.name ?? '',
      templateId: template.id,
      templateVersion: template.version,
      inspectType: template.inspectType,
      targetKind: template.targetKind,
      targetName: draft.targetName || (origin?.schoolName ?? plant?.name ?? ''),
      inspector: draft.inspector,
      date: origin?.date ?? TODAY.format('YYYY-MM-DD'),
      state,
      checklist,
      devices: draft.devices,
      photos: draft.photos.map((file) => ({
        id: file.id,
        name: file.name,
        itemId: draft.photoLinks[file.id] || null,
      })),
      summary:
        draft.summary
        || (abnormal > 0 ? `점검 항목 ${abnormal}건에서 이상을 확인했습니다.` : '점검 항목 전체 정상입니다.'),
      actionNote: draft.actionNote,
      rejectReason: resubmitting ? '' : origin?.rejectReason ?? '',
      resubmitCount: (origin?.resubmitCount ?? 0) + (resubmitting ? 1 : 0),
      history: [
        ...(origin?.history ?? []),
        {
          at: NOW.format('YYYY-MM-DD HH:mm'),
          actor: draft.inspector,
          change: state === 'draft'
            ? '임시 저장했습니다.'
            : resubmitting
              ? '수정 후 재기안했습니다.'
              : origin
                ? '수정해 다시 제출했습니다.'
                : '제출했습니다.',
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

  /** 이력 한 줄을 붙여 상태를 옮긴다 — 진행·반려가 같은 형식을 쓴다. */
  const move = (report: FieldReport, next: ReportState, change: string, extra?: Partial<FieldReport>) => {
    patch(report.id, {
      state: next,
      ...extra,
      history: [
        ...report.history,
        { at: NOW.format('YYYY-MM-DD HH:mm'), actor: user?.name ?? '담당자', change },
      ],
    });
  };

  /** 확인완료 직전까지 다음 단계로 넘긴다 (SFR-021-08) */
  const advance = (report: FieldReport) => {
    const index = STATE_ORDER.indexOf(report.state);

    if (index < 0 || index >= STATE_ORDER.length - 1) return;

    const next = STATE_ORDER[index + 1];

    move(report, next, `${REPORT_STATE_LABEL[next]}(으)로 바꿨습니다.`);
    toast.success(`${REPORT_STATE_LABEL[next]}(으)로 처리했습니다.`);
  };

  /** 검토에서 되돌려 보낸다 — 현장이 고쳐 다시 낸다 (SFR-021-08/09) */
  const reject = () => {
    if (!rejecting || !rejectReason.trim()) return;

    move(rejecting, 'rejected', `반려했습니다. — ${rejectReason.trim()}`, { rejectReason: rejectReason.trim() });
    toast.success(`${rejecting.schoolName} 보고서를 반려했습니다.`);
    setRejecting(null);
    setRejectReason('');
  };

  /** 공유한 사실을 이력에 남긴다 (SFR-021-18) */
  const share = (report: FieldReport, recipients: ManagedUser[]) => {
    patch(report.id, {
      history: [
        ...report.history,
        {
          at: NOW.format('YYYY-MM-DD HH:mm'),
          actor: user?.name ?? '담당자',
          change: `${recipients.map((item) => item.name).join(', ')}에게 공유했습니다.`,
        },
      ],
    });
    toast.success(`${recipients.length}명에게 공유했습니다.`);
  };

  /** 목록에서 견줄 두 건을 고른다 — 셋째를 누르면 가장 먼저 고른 것을 놓는다. */
  const togglePick = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(-2)));
  };

  return (
    <div className={styles.tab}>
      <div className={cn(styles.toolbar, 'no-print')}>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__note}>
            {label} · 보고서 {reports.length}건
          </p>
          {permission.writeBlockedReason ? (
            <p className={styles.toolbar__note}>{permission.writeBlockedReason}</p>
          ) : null}
        </div>
        <div className={styles.toolbar__actions}>
          <Button
            variant="secondary"
            onClick={() => setComparing(true)}
            disabled={pickedReports.length < 2}
          >
            선택한 2건 비교{picked.length > 0 ? ` (${picked.length}/2)` : ''}
          </Button>
          {permission.canWrite ? (
            <Button iconLeft={<PlusIcon />} onClick={startWriting} disabled={!plant}>
              보고서 작성
            </Button>
          ) : null}
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
            <p className={styles.repeat__title}>
              같은 항목이 반복해 이상으로 나왔습니다
              <span className={styles.repeat__scope}> · 최근 {REPEAT_WINDOW_DAYS / 365}년, 같은 발전소 기준</span>
            </p>
            {repeats.map((item) => (
              <p key={`${item.schoolId}-${item.label}`} className={styles.repeat__item}>
                {item.schoolName} · {item.label} — {item.count}회 (최근 {item.lastDate})
              </p>
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.06}>
        <Card
          eyebrow="Reports"
          title="점검 보고서 목록"
          description="보고서를 누르면 점검 항목과 상태 이력을 펼쳐 봅니다. 왼쪽 칸으로 두 건을 골라 나란히 견줄 수 있습니다."
        >
          {reports.length === 0 ? (
            <EmptyState title="보고서가 없습니다" description="위 버튼으로 첫 보고서를 작성해 보세요." />
          ) : (
            <div className={styles.list}>
              {reports.map((report) => (
                <div key={report.id} className={styles.rowWrap}>
                  <label className={styles.rowPick}>
                    <input
                      type="checkbox"
                      checked={picked.includes(report.id)}
                      onChange={() => togglePick(report.id)}
                    />
                    <span className={styles.rowPick__label}>{report.date} 보고서 비교 대상으로 고르기</span>
                  </label>
                  <button type="button" className={styles.row} onClick={() => setOpenId(report.id)}>
                    <span className={styles.row__body}>
                      <span className={styles.row__title}>
                        {report.schoolName} · {templateOf(report.templateId).label}
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
                </div>
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
            ? `${detail.date} · ${templateOf(detail.templateId).label} v${detail.templateVersion} · 점검자 ${detail.inspector}`
            : undefined
        }
        footer={detail ? (
          <>
            <Button
              variant="secondary"
              iconLeft={<DownloadIcon />}
              onClick={() => download(sheetRef, `현장보고서_${detail.schoolName}_${detail.date}`)}
              disabled={busy}
            >
              {busy ? '내려받는 중…' : 'PDF 내려받기'}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<PrinterIcon />}
              onClick={() => print(`현장보고서_${detail.schoolName}_${detail.date}`)}
            >
              인쇄
            </Button>
            {permission.canShare ? (
              <Button variant="secondary" iconLeft={<UserIcon />} onClick={() => setSharing(detail)}>
                관계자 공유
              </Button>
            ) : null}
            {permission.canEdit(detail) ? (
              <Button variant="secondary" onClick={() => startEditing(detail)}>
                {detail.state === 'rejected' ? '수정 후 재기안' : '수정'}
              </Button>
            ) : null}
            {permission.canReject(detail) ? (
              <Button variant="ghost" onClick={() => setRejecting(detail)}>
                반려
              </Button>
            ) : null}
            {permission.canAdvance(detail) ? (
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

            {detail.state === 'rejected' ? (
              <div className={styles.reject}>
                <p className={styles.reject__title}>반려됨 · 고쳐서 다시 제출해 주세요</p>
                <p className={styles.post__body}>{detail.rejectReason}</p>
              </div>
            ) : null}

            <p className={styles.post__body}>{detail.summary}</p>

            {/* 어느 설비를 봤는지 (SFR-021-06) */}
            {detail.devices.length > 0 ? (
              <div className={styles.checkItem}>
                <p className={styles.checkItem__label}>점검 설비</p>
                {detail.devices.map((device) => (
                  <p key={device.id} className={styles.post__meta}>
                    <span>{device.kind} · {device.name}</span>
                    {device.note ? <span>{device.note}</span> : null}
                  </p>
                ))}
              </div>
            ) : null}

            {detail.checklist.map((item, index) => (
              <div key={item.id}>
                {index === 0 || item.section !== detail.checklist[index - 1].section ? (
                  <p className={styles.sectionHead}>{item.section}</p>
                ) : null}
                <div
                  className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: item.result === 'abnormal' })}
                >
                  <p className={styles.checkItem__label}>{item.label}</p>
                  <p className={styles.post__meta}>
                    <span>{item.result ? CHECK_LABEL[item.result] : '미기재'}</span>
                    {item.note ? <span>{item.note}</span> : null}
                  </p>
                </div>
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
                {detail.photos.map((photo) => {
                  const linked = detail.checklist.find((item) => item.id === photo.itemId);

                  return (
                    <span key={photo.id} className={styles.post__file}>
                      {photo.name}
                      {linked ? <small className={styles.post__fileItem}>{linked.label}</small> : null}
                    </span>
                  );
                })}
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
        title={draft?.resubmitOf ? '현장 점검 보고서 수정' : '현장 점검 보고서 작성'}
        description={`${draft?.resubmitOf?.schoolName ?? plant?.name ?? ''} · ${draft?.resubmitOf?.date ?? TODAY.format('YYYY-MM-DD')}`}
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
              {draft?.resubmitOf?.state === 'rejected' ? '재기안' : '제출'}
            </Button>
          </>
        )}
      >
        {draft && template ? (
          <div className={styles.form}>
            {draft.resubmitOf?.state === 'rejected' ? (
              <div className={styles.reject}>
                <p className={styles.reject__title}>반려 사유</p>
                <p className={styles.post__body}>{draft.resubmitOf.rejectReason}</p>
              </div>
            ) : null}

            <FormSection legend="점검 개요" hint="양식을 고르면 아래 체크리스트가 그 양식으로 바뀝니다.">
              <FormRow cols={2}>
                <Select
                  label="점검 양식"
                  value={draft.templateId}
                  onChange={(value) => setDraft({ ...draft, templateId: value, results: {}, notes: {} })}
                  options={templates.map((item) => ({
                    value: item.id,
                    label: `${item.label} (${item.inspectType} · v${item.version})`,
                  }))}
                />
                <TextField
                  label="점검 대상"
                  value={draft.targetName}
                  onChange={(value) => setDraft({ ...draft, targetName: value })}
                  width="md"
                  hint="인버터 번호나 RTU 이름을 적어도 됩니다."
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
                <TextField
                  label="점검일"
                  value={draft.resubmitOf?.date ?? TODAY.format('YYYY-MM-DD')}
                  onChange={() => {}}
                  readOnly
                  width="md"
                />
              </FormRow>
            </FormSection>

            {/*
              점검한 설비를 따로 적는다 (SFR-021-06).
              점검 항목은 "무엇을 봤는가"이고, 여기는 "어느 설비를 봤는가"다 — 사진·이상 이력이 이 축으로 묶인다.
            */}
            <FormSection legend="점검 설비" hint="이번 점검에서 실제로 본 설비와 설비별 특이사항을 적습니다.">
              {draft.devices.map((device, index) => (
                <FormRow key={device.id} cols={3}>
                  <Select
                    label={`${index + 1}번 설비 구분`}
                    value={device.kind}
                    options={DEVICE_KINDS.map((kind) => ({ value: kind, label: kind }))}
                    onChange={(value) => setDraft({
                      ...draft,
                      devices: draft.devices.map((item) => (item.id === device.id ? { ...item, kind: value } : item)),
                    })}
                  />
                  <TextField
                    label={`${index + 1}번 설비명`}
                    value={device.name}
                    onChange={(value) => setDraft({
                      ...draft,
                      devices: draft.devices.map((item) => (item.id === device.id ? { ...item, name: value } : item)),
                    })}
                  />
                  <TextField
                    label={`${index + 1}번 특이사항`}
                    value={device.note}
                    onChange={(value) => setDraft({
                      ...draft,
                      devices: draft.devices.map((item) => (item.id === device.id ? { ...item, note: value } : item)),
                    })}
                    placeholder="없으면 비워 둡니다"
                  />
                </FormRow>
              ))}
              <div className={styles.toolbar__actions}>
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<PlusIcon />}
                  onClick={() => setDraft({
                    ...draft,
                    devices: [
                      ...draft.devices,
                      { id: `dev-${draft.id}-${draft.devices.length + 1}`, kind: DEVICE_KINDS[0], name: '', note: '' },
                    ],
                  })}
                >
                  설비 추가
                </Button>
                {draft.devices.length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDraft({ ...draft, devices: draft.devices.slice(0, -1) })}
                  >
                    마지막 줄 삭제
                  </Button>
                ) : null}
              </div>
            </FormSection>

            <FormSection
              legend="점검 항목"
              hint="항목마다 정상·이상·해당없음 중 하나를 골라 주세요. 전부 골라야 제출할 수 있습니다."
            >
              {questions.map((question, index) => {
                const result = draft.results[question.id] ?? null;
                const isFirstOfSection = index === 0 || question.section !== questions[index - 1].section;

                return (
                  <div key={question.id}>
                    {isFirstOfSection ? <p className={styles.sectionHead}>{question.section}</p> : null}
                    <div
                      className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: result === 'abnormal' })}
                    >
                      <RadioGroup
                        legend={`${index + 1}. ${question.label}`}
                        value={result}
                        onChange={(value) => setDraft({
                          ...draft,
                          results: { ...draft.results, [question.id]: value },
                        })}
                        options={CHECK_OPTIONS}
                        required
                        error={error?.includes(`${index + 1}번`) ? error : undefined}
                      />
                      {result === 'abnormal' ? (
                        <TextField
                          label="이상 내용"
                          value={draft.notes[question.id] ?? ''}
                          onChange={(value) => setDraft({
                            ...draft,
                            notes: { ...draft.notes, [question.id]: value },
                          })}
                          placeholder="무엇이 어떻게 이상한지 적어 주세요."
                        />
                      ) : null}
                    </div>
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

              {/*
                사진마다 어느 점검 항목을 찍은 것인지 붙여 둔다 (SFR-021-06).
                나중에 보고서를 다시 열었을 때 "이 사진이 무엇에 대한 자료인지" 를 답한다.
              */}
              {draft.photos.length > 0 ? (
                <ul className={styles.photoLinks}>
                  {draft.photos.map((file) => (
                    <li key={file.id} className={styles.photoLinks__row}>
                      <span className={styles.photoLinks__name}>{file.name}</span>
                      <Select
                        label={`${file.name} 연계 항목`}
                        hideLabel
                        value={draft.photoLinks[file.id] ?? ''}
                        options={[
                          { value: '', label: '보고서 전체' },
                          ...questions.map((question) => ({
                            value: question.id,
                            label: `${question.section} · ${question.label}`,
                          })),
                        ]}
                        onChange={(value) => setDraft({
                          ...draft,
                          photoLinks: { ...draft.photoLinks, [file.id]: value },
                        })}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
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

      {/* 반려는 사유가 있어야 한다 — 현장이 무엇을 고쳐야 할지 알아야 다시 낼 수 있다 (SFR-021-08). */}
      <Modal
        isOpen={rejecting !== null}
        onClose={() => setRejecting(null)}
        size="md"
        title="보고서 반려"
        description={rejecting ? `${rejecting.schoolName} · ${rejecting.date}` : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              취소
            </Button>
            <Button onClick={reject} disabled={!rejectReason.trim()}>
              반려
            </Button>
          </>
        )}
      >
        <TextArea
          label="반려 사유"
          value={rejectReason}
          onChange={setRejectReason}
          required
          placeholder="무엇을 고쳐서 다시 내야 하는지 적어 주세요."
          maxLength={300}
        />
      </Modal>

      <FieldCompareModal
        isOpen={comparing && pickedReports.length === 2}
        reports={pickedReports}
        onClose={() => setComparing(false)}
      />

      <FieldShareModal report={sharing} onClose={() => setSharing(null)} onShare={share} />

      {/*
        PDF 로 담을 지면. 화면 밖에 세워 두고 내려받을 때만 캡처한다 (SFR-021-18) —
        `display: none` 이면 크기가 0이라 캡처되지 않아 자리만 밀어 둔다.
      */}
      {detail ? (
        <div aria-hidden className={styles.offscreen}>
          <div ref={sheetRef} className={sheetStyles.sheet}>
            <FieldReportSheet report={detail} />
          </div>
        </div>
      ) : null}

      {/* 점검 일정은 현장 점검과 한 흐름이라 보고서 아래 붙여 둔다 (SFR-021-19). */}
      <InspectionSchedule />
    </div>
  );
}

export default FieldReportPage;
