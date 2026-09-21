import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { MSG } from '@/configs/messages';
import { PageSkeleton } from '@/components/common/Skeleton';
import type { StringRow } from '@/schemas/stringRow';
import { useStringSheet } from '../hooks/useStringSheet';
import { stringSheetFormSchema } from './form';
import { StringRows } from './StringRows';
import type { StringSheetFormValues } from './form';

const Form = createForm<StringSheetFormValues>();

/** 빼기를 누른 줄 — 저장돼 있던 줄이면 확인을 거쳐 그 자리에서 지운다 */
interface PendingDrop {
  stringId: number;
  stringName: string;
  drop: () => void;
}

/**
 * 스트링 편집판 (SFR-016-01, SFR-017-06).
 *
 * 설비 한 대의 스트링을 한 판에서 다룬다 — 목록에서 설비를 골라 들어오므로 등록과 수정이
 * 갈리지 않는다. 스트링이 0조인 설비도 목록에 서므로 새로 심는 자리도 여기다.
 */
export function StringSheet({ cid }: { cid: number }) {
  const sheet = useStringSheet(cid);

  if (sheet.isLoading) return <PageSkeleton />;

  return <StringForm sheet={sheet} />;
}

function StringForm({ sheet }: { sheet: ReturnType<typeof useStringSheet> }) {
  const { target, save, removeOne, removeAll, backTo } = sheet;
  const navigate = useNavigate();

  const methods = useForm<StringSheetFormValues>({
    defaultValues: {
      rows: target?.list.map((row) => ({
        stringId: row.stringId,
        stringNumber: row.stringNumber,
        stringName: row.stringName,
        moduleSerialCount: row.moduleSerialCount,
        moduleParallelCount: row.moduleParallelCount,
      })) ?? [],
      // 판이 곧 이 설비의 전체 목록이라 피할 순번이 없다.
      takenNumbers: [],
    },
    resolver: zodResolver(stringSheetFormSchema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<StringSheetFormValues | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const savedCount = target?.list.length ?? 0;
  const label = `${target?.powerPlantName ?? ''} · ${target?.equipmentName ?? '설비'}`;

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={`${label} 스트링`}
          description="이 설비의 스트링을 한꺼번에 고칩니다. 저장돼 있는 줄을 빼면 그 자리에서 삭제됩니다."
          backTo={backTo}
          danger={savedCount > 0
            ? <Button variant="solar" onClick={() => setIsClearing(true)}>전체 삭제</Button>
            : null}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <StringRows
            legend="스트링 구성"
            onRemove={(row: StringRow, drop) => {
              // 아직 저장되지 않은 줄은 판에서만 빼면 된다.
              if (row.stringId === null) {
                drop();

                return;
              }

              setPendingDrop({ stringId: row.stringId, stringName: row.stringName, drop });
            }}
          />
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={MSG.updateConfirm(`${label} 스트링 ${formatNumber(pending?.rows.length ?? 0)}조`)}
        confirmLabel="저장"
        onConfirm={() => pending && save.mutate(pending.rows)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={pendingDrop !== null}
        title={MSG.deleteConfirm(pendingDrop?.stringName ?? '스트링')}
        description="저장돼 있는 스트링이라 이 자리에서 바로 지웁니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => pendingDrop && removeOne.mutate(
          { stringId: pendingDrop.stringId, stringName: pendingDrop.stringName },
          { onSuccess: pendingDrop.drop },
        )}
        onClose={() => setPendingDrop(null)}
      />

      <ConfirmDialog
        isOpen={isClearing}
        /*
          지우는 것은 저장돼 있는 전체다 — 편집판의 초안 줄 수를 세면 줄을 다 뺀 상태에서
          「0조를 삭제할까요?」라고 묻고 저장분을 전부 지운다.
        */
        title={MSG.deleteConfirm(`${label} 스트링 ${formatNumber(savedCount)}조`)}
        description="이 설비에 등록된 스트링을 모두 지웁니다. 한 조만 지우려면 위 편집판에서 그 줄을 빼세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => removeAll.mutate()}
        onClose={() => setIsClearing(false)}
      />
    </>
  );
}
