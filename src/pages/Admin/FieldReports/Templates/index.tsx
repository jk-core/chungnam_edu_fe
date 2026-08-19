import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { flattenTemplate } from '@/mocks/fieldReport';
import { FormSection, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { NOW, TODAY } from '@/mocks/today';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore, { mergeRevisions, mergeTemplates } from '@/stores/fieldReportStore';
import type { Column } from '@/components/common/Table';
import type { ReportTemplate, TemplateSection } from '@/interface/fieldReport';
import styles from '../../Admin.module.scss';

interface Draft {
  template: ReportTemplate;
  sections: TemplateSection[];
  /** 무엇을 왜 고쳤는지 — 개정 이력에 그대로 남는다 */
  note: string;
}

/**
 * 점검 양식 편집과 판 관리 (SFR-021-14).
 *
 * 문항을 고치면 **판 번호를 올려** 새 판으로 낸다 — 이미 쓰인 보고서는 자기 문항을 통째로
 * 들고 있어(`FieldReport.checklist`) 과거 보고서가 뒤늦게 바뀌는 일이 없다.
 * 문항은 대분류마다 한 줄에 하나씩 적는다. 표 형태 편집기보다 옮겨 붙이기 쉽다.
 */
function TemplatesDepth() {
  const templatePatched = useFieldReportStore((state) => state.templatePatched);
  const revisions = useFieldReportStore((state) => state.revisions);
  const saveTemplate = useFieldReportStore((state) => state.saveTemplate);
  const actor = useAuthUser();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirming, setConfirming] = useState(false);

  const templates = useMemo(() => mergeTemplates(templatePatched), [templatePatched]);
  const history = useMemo(() => mergeRevisions(revisions), [revisions]);

  const openEditor = (template: ReportTemplate) => {
    setDraft({ template, sections: template.sections.map((section) => ({ ...section })), note: '' });
  };

  const setSection = (index: number, change: Partial<TemplateSection>) => {
    if (!draft) return;

    setDraft({
      ...draft,
      sections: draft.sections.map((section, order) => (order === index ? { ...section, ...change } : section)),
    });
  };

  const itemCount = draft ? draft.sections.reduce((sum, section) => sum + section.items.length, 0) : 0;
  const canSave = Boolean(
    draft
    && draft.note.trim()
    && itemCount > 0
    && draft.sections.every((section) => section.title.trim()),
  );

  const commit = () => {
    if (!draft || !canSave) return;

    const version = draft.template.version + 1;
    const next: ReportTemplate = {
      ...draft.template,
      version,
      revisedAt: TODAY.format('YYYY-MM-DD'),
      // 빈 줄은 문항으로 세지 않는다 — 붙여 넣다 남은 줄이 문항이 되면 점검자가 헛클릭한다.
      sections: draft.sections.map((section) => ({
        title: section.title.trim(),
        items: section.items.map((item) => item.trim()).filter(Boolean),
      })).filter((section) => section.items.length > 0),
    };

    saveTemplate(next, {
      id: `TR-${NOW.format('MMDDHHmm')}-${next.id}`,
      templateId: next.id,
      templateLabel: next.label,
      version,
      at: NOW.format('YYYY-MM-DD HH:mm'),
      actor: actor?.name ?? '관리자',
      note: draft.note.trim(),
    });
    toast.success(`${next.label} v${version} 판을 냈습니다.`);
    setConfirming(false);
    setDraft(null);
  };

  const columns: Column<ReportTemplate>[] = [
    {
      key: 'label',
      header: '양식명',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.label}</strong>
          <span className={styles.stackCell__sub}>{row.sections.map((section) => section.title).join(' · ')}</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: '점검 유형',
      width: '100px',
      render: (row) => <Badge tone={row.inspectType === '특별' ? 'caution' : 'neutral'}>{row.inspectType}</Badge>,
    },
    {
      key: 'count',
      header: '분류 · 문항',
      width: '120px',
      align: 'right',
      render: (row) => `${row.sections.length}분류 · ${flattenTemplate(row).length}문항`,
    },
    {
      key: 'version',
      header: '판',
      width: '120px',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>v{row.version}</strong>
          <span className={styles.stackCell__sub}>{row.revisedAt}</span>
        </span>
      ),
    },
    {
      key: 'action',
      header: '관리',
      width: '110px',
      align: 'center',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => openEditor(row)}>
          문항 편집
        </Button>
      ),
    },
  ];

  return (
    <>
      <Reveal>
        <Card
          title="점검 양식"
          description="문항을 고치면 새 판으로 나갑니다. 이미 작성된 보고서는 그때 문항을 그대로 지킵니다."
        >
          <Table caption="점검 양식 목록" columns={columns} rows={templates} getRowKey={(row) => row.id} />
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card title="양식 개정 이력" description="누가 언제 무엇을 고쳐 몇 판으로 냈는지 남습니다.">
          <div className={styles.history}>
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyItem__at}>{item.at}</span>
                <span className={styles.historyItem__body}>
                  <strong>{item.templateLabel} v{item.version}</strong> — {item.note}
                </span>
                <span className={styles.historyItem__at}>{item.actor}</span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft ? `${draft.template.label} 문항 편집` : ''}
        description={draft ? `현재 v${draft.template.version} · 저장하면 v${draft.template.version + 1} 로 나갑니다.` : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              취소
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={!canSave}>
              새 판으로 저장
            </Button>
          </>
        )}
      >
        {draft ? (
          <div className={styles.form}>
            {draft.sections.map((section, index) => (
              <FormSection
                key={`section-${index}`}
                legend={`${index + 1}번 분류`}
                hint="문항은 한 줄에 하나씩 적습니다. 빈 줄은 무시합니다."
              >
                <TextField
                  label="분류 이름"
                  value={section.title}
                  onChange={(value) => setSection(index, { title: value })}
                  required
                />
                <TextArea
                  label="문항"
                  value={section.items.join('\n')}
                  onChange={(value) => setSection(index, { items: value.split('\n') })}
                  hint={`${section.items.filter((item) => item.trim()).length}문항`}
                />
                <div className={styles.toolbar__actions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDraft({
                      ...draft,
                      sections: draft.sections.filter((_, order) => order !== index),
                    })}
                  >
                    이 분류 삭제
                  </Button>
                </div>
              </FormSection>
            ))}

            <div className={styles.toolbar__actions}>
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<PlusIcon />}
                onClick={() => setDraft({ ...draft, sections: [...draft.sections, { title: '', items: [''] }] })}
              >
                분류 추가
              </Button>
            </div>

            <FormSection legend="개정 사유" hint="이력에 그대로 남습니다. 무엇을 왜 고쳤는지 적어 주세요.">
              <TextArea
                label="개정 사유"
                hideLabel
                value={draft.note}
                onChange={(value) => setDraft({ ...draft, note: value })}
                required
                placeholder="예: 태양전지 분류에 적외선 열화상 항목을 더했습니다."
                maxLength={200}
              />
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft ? `${draft.template.label} v${draft.template.version + 1} 로 낼까요?` : ''}
        description="새 판은 지금부터 작성하는 보고서에만 적용됩니다. 이미 쓴 보고서는 그대로입니다."
        confirmLabel="새 판으로 저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}

export default TemplatesDepth;
