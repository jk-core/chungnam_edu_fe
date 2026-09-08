import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { INSPECTION_TARGET_OPTIONS, templateQuestions } from '@/mocks/fieldReport';
import { FormField, FormRow, FormSection, SelectControl, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW, TODAY } from '@/mocks/today';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type {
  CheckResult,
  FieldReport,
  InspectionTarget,
  ReportState,
} from '@/interface/fieldReport';
import type { UploadFile } from '@/components/common/Form';
import styles from '../../FieldReport.module.scss';
import { useFieldReports } from '../../hooks/useFieldReports';
import { ChecklistFields } from './ChecklistFields';
import { PhotoFields } from './PhotoFields';

interface DraftState {
  id: string;
  templateId: string;
  targetType: InspectionTarget;
  inspector: string;
  inspectorPhone: string;
  summary: string;
  actionNote: string;
  results: Record<string, CheckResult | null>;
  notes: Record<string, string>;
  photos: UploadFile[];
  /** 사진 id → 점검 항목 id. 비어 있으면 보고서 전체에 붙은 사진이다 (SFR-021-06). */
  photoLinks: Record<string, string>;
}

interface ReportEditorProps {
  /** 되돌아온(또는 작성중인) 보고서를 고쳐 다시 내는 경우 그 원본 (SFR-021-09) */
  origin: FieldReport | null;
  onClose: () => void;
}

/**
 * 현장 점검 보고서 작성·수정 (SFR-021).
 * 양식을 골라 체크리스트를 채우고 사진을 붙여 임시 저장했다가 제출한다.
 */
export function ReportEditor({ origin, onClose }: ReportEditorProps) {
  const { plant, templates, templateOf } = useFieldReports();
  const save = useFieldReportStore((state) => state.save);
  const nextId = useFieldReportStore((state) => state.nextId);
  const user = useAuthUser();

  const [draft, setDraft] = useState<DraftState>(() => (origin
    ? {
      id: origin.id,
      templateId: origin.templateId,
      targetType: origin.targetType,
      inspector: origin.inspector,
      inspectorPhone: origin.inspectorPhone,
      summary: origin.summary,
      actionNote: origin.actionNote,
      results: Object.fromEntries(origin.checklist.map((item) => [item.id, item.result])),
      notes: Object.fromEntries(origin.checklist.map((item) => [item.id, item.note])),
      // 이미 올린 사진은 파일 자체를 다시 받아 오지 않는다 — 이름만 들고 목록에 남긴다.
      photos: origin.photos.map((photo) => ({
        id: photo.id,
        name: photo.name,
        size: 0,
        type: 'image/jpeg',
        previewUrl: null,
      })),
      photoLinks: Object.fromEntries(
        origin.photos.filter((photo) => photo.itemId).map((photo) => [photo.id, photo.itemId as string]),
      ),
    }
    : {
      id: nextId(),
      templateId: templates[0].id,
      targetType: templates[0].targetType,
      inspector: user?.name ?? '',
      inspectorPhone: '',
      summary: '',
      actionNote: '',
      results: {},
      notes: {},
      photos: [],
      photoLinks: {},
    }));
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState<'draft' | 'submit' | null>(null);

  const template = templateOf(draft.templateId);
  const questions = templateQuestions(template);
  const change = (next: Partial<DraftState>) => setDraft({ ...draft, ...next });

  /** 필수 항목이 다 채워졌는지 (SIF-001-02) */
  const validate = (): boolean => {
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

  const commit = (state: ReportState) => {
    const school = origin ?? plant;

    if (!school) return;

    const checklist = questions.map((item) => ({
      ...item,
      result: draft.results[item.id] ?? null,
      note: draft.notes[item.id] ?? '',
    }));
    const abnormal = checklist.filter((item) => item.result === 'abnormal').length;
    // 되돌아온 건을 다시 내는 것이면 제출 횟수를 올리고 반려 사유를 지운다.
    const resubmitting = Boolean(origin && origin.state === 'rejected' && state !== 'draft');

    const report: FieldReport = {
      id: draft.id,
      schoolId: origin?.schoolId ?? plant?.id ?? '',
      schoolName: origin?.schoolName ?? plant?.name ?? '',
      templateId: template.id,
      templateVersion: template.version,
      inspectType: template.inspectType,
      targetType: draft.targetType,
      inspector: draft.inspector,
      inspectorPhone: draft.inspectorPhone,
      date: origin?.date ?? TODAY.format('YYYY-MM-DD'),
      state,
      checklist,
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

    save(report);
    toast.success(state === 'draft' ? MSG.saveDraftSuccess : MSG.submitSuccess('현장보고서'));
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={origin ? '현장 점검 보고서 수정' : '현장 점검 보고서 작성'}
        description={`${origin?.schoolName ?? plant?.name ?? ''} · ${origin?.date ?? TODAY.format('YYYY-MM-DD')}`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirming('draft')}>임시 저장</Button>
            <Button
              onClick={() => {
                if (validate()) setConfirming('submit');
              }}
            >
              {origin?.state === 'rejected' ? '재기안' : '제출'}
            </Button>
          </>
        )}
      >
        <div className={styles.form}>
          {origin?.state === 'rejected' ? (
            <div className={styles.reject}>
              <p className={styles.reject__title}>반려 사유</p>
              <p className={styles.post__body}>{origin.rejectReason}</p>
            </div>
          ) : null}

          <FormSection legend="점검 개요" hint="양식을 고르면 아래 체크리스트가 그 양식으로 바뀝니다.">
            <FormRow cols={2}>
              <FormField label="점검 양식">
                <SelectControl
                  value={draft.templateId}
                  /*
                    양식이 바뀌면 문항 자체가 달라지므로 앞서 고른 답은 남기지 않는다.
                    점검대상도 새 양식이 겨눈 곳으로 돌린다 — 고쳐 고를 수 있다.
                  */
                  onChange={(value) => change({
                    templateId: value,
                    targetType: templateOf(value).targetType,
                    results: {},
                    notes: {},
                  })}
                  options={templates.map((item) => ({
                    value: item.id,
                    label: `${item.label} (${item.inspectType} · v${item.version})`,
                  }))}
                />
              </FormField>
              <FormField label="점검 대상" hint="이번 점검에서 무엇을 봤는지 고릅니다.">
                <SelectControl
                  value={draft.targetType}
                  onChange={(value) => change({ targetType: value })}
                  options={INSPECTION_TARGET_OPTIONS.map((item) => ({ value: item, label: item }))}
                />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <TextField
                label="점검자"
                value={draft.inspector}
                onChange={(value) => change({ inspector: value })}
                required
                error={error?.includes('점검자') ? error : undefined}
                width="md"
              />
              <TextField
                label="점검자 연락처"
                value={draft.inspectorPhone}
                onChange={(value) => change({ inspectorPhone: value })}
                ime="numeric"
                width="md"
                placeholder="000-0000-0000"
              />
            </FormRow>
            <TextField
              label="점검일"
              value={origin?.date ?? TODAY.format('YYYY-MM-DD')}
              onChange={() => undefined}
              readOnly
              width="md"
            />
          </FormSection>

          <ChecklistFields
            questions={questions}
            results={draft.results}
            notes={draft.notes}
            onResult={(id, value) => change({ results: { ...draft.results, [id]: value } })}
            onNote={(id, value) => change({ notes: { ...draft.notes, [id]: value } })}
            error={error}
          />

          <PhotoFields
            photos={draft.photos}
            onChange={(photos) => change({ photos })}
            links={draft.photoLinks}
            onLink={(photoId, itemId) => change({ photoLinks: { ...draft.photoLinks, [photoId]: itemId } })}
            questions={questions}
          />

          <FormSection legend="정리">
            <TextArea
              label="점검 요약"
              value={draft.summary}
              onChange={(value) => change({ summary: value })}
              optional
              placeholder="비워 두면 이상 건수로 자동 요약합니다."
              maxLength={200}
            />
            <TextArea
              label="조치 내용"
              value={draft.actionNote}
              onChange={(value) => change({ actionNote: value })}
              optional
              hint="여기 적은 내용은 월간보고서에 함께 실립니다."
              maxLength={300}
            />
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirming !== null}
        title={confirming === 'draft' ? '임시 저장할까요?' : MSG.submitConfirm('현장보고서')}
        description={confirming === 'draft'
          ? '작성중 상태로 저장합니다. 나중에 이어서 채울 수 있습니다.'
          : '제출하면 상태가 제출완료로 바뀌고, 이후 변경은 이력에 남습니다.'}
        confirmLabel={confirming === 'draft' ? '임시 저장' : '제출'}
        onConfirm={() => commit(confirming === 'draft' ? 'draft' : 'submitted')}
        onClose={() => setConfirming(null)}
      />
    </>
  );
}
