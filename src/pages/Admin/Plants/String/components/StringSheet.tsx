import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/changeLog';
import { createForm } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { getSchoolById } from '@/mocks/schools';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { RecordPicker } from '@/components/common/RecordPicker';
import { stringSheetFormSchema } from '@/service/string/type';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useSelectableEquipment } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore from '@/stores/equipmentStore';
import type { StringSheetFormValues } from '@/service/string/type';
import type { StringMaster } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { summarizeString, useStringOwners, useStringsOf } from '../hooks/useStringData';
import { StringRows } from './StringRows';

const Form = createForm<StringSheetFormValues>();

interface StringSheetProps {
  /** 고칠 설비의 서버 식별자. 없으면 설비부터 고르는 자리다 */
  cid: number | null;
}

/**
 * 스트링 편집판 (SFR-016-01, SFR-017-06).
 *
 * 등록은 이미 있는 목록 뒤에 새 줄만 더하고, 수정은 편집판이 곧 그 설비의 전체 목록이라
 * 뺀 줄이 저장할 때 함께 지워진다.
 */
export function StringSheet({ cid }: StringSheetProps) {
  const saveStrings = useEquipmentStore((state) => state.saveStrings);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();
  const equipment = useSelectableEquipment('string');
  const owners = useStringOwners();
  const navigate = useNavigate();
  const { listOf } = useStringsOf();

  const target = owners.find((row) => row.cid === cid) ?? null;
  const isEdit = target !== null;
  const backTo = listPath('plants', 'string');

  // 수정판은 줄을 모두 빼는 것이 곧 전체 삭제라 빈 판도 저장할 수 있어야 한다.
  const schema = useMemo(() => stringSheetFormSchema(isEdit), [isEdit]);
  const methods = useForm<StringSheetFormValues>({
    defaultValues: target
      ? {
        cid: target.cid,
        equipmentLabel: labelOf(target.cid, equipment),
        rows: listOf(target.inverterId).map((row) => ({
          stringId: row.stringId,
          stringNumber: row.seq,
          stringName: row.name,
          moduleSerialCount: row.seriesCount,
          moduleParallelCount: row.parallelCount,
        })),
        // 수정판은 편집판이 곧 전체 목록이라 피할 순번이 없다.
        takenNumbers: [],
      }
      : { cid: Number.NaN, equipmentLabel: '', rows: [], takenNumbers: [] },
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<StringSheetFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pickedCid = useWatch({ control: methods.control, name: 'cid' });

  const owner = equipment.find((item) => item.cid === pickedCid);

  const commit = (values: StringSheetFormValues) => {
    // 스토어는 목업 설비 키로 묶여 있다 — 계약이 쓰는 cid 를 그 키로 옮겨 준다.
    const inverterId = equipment.find((item) => item.cid === values.cid)?.inverterId ?? '';
    const current = listOf(inverterId);
    const known = new Map(current.map((row) => [row.stringId, row.id]));
    const built: StringMaster[] = values.rows.map((row, index) => ({
      // 새 줄은 저장 시각과 줄 번호를 섞어 시드 id 와 겹치지 않게 한다.
      id: (row.stringId === null ? undefined : known.get(row.stringId))
        ?? `str-${inverterId}-${Date.now().toString(36)}-${index + 1}`,
      stringId: row.stringId ?? nextSeq() + index + 1,
      inverterId,
      seq: row.stringNumber,
      name: row.stringName,
      seriesCount: row.moduleSerialCount,
      parallelCount: row.moduleParallelCount,
    }));

    if (!isEdit) {
      const entries = built.flatMap((row) => createdEntry(
        { targetType: 'string', id: row.id, name: row.name, actor: actor?.name ?? '관리자' },
        `${owner?.name ?? ''} · 순번 ${row.seq} · ${row.seriesCount}직렬 × ${row.parallelCount}병렬`,
      ));

      saveStrings(inverterId, [...current, ...built], entries);
      toast.success(MSG.createSuccess(`스트링 ${built.length}조`));
    } else {
      const before = new Map(current.map((row) => [row.id, row]));
      const after = new Map(built.map((row) => [row.id, row]));
      const ids = [...new Set([...before.keys(), ...after.keys()])];

      // 설비 한 대를 대상으로 남기고, 줄마다 "순번 N 스트링" 으로 묶는다 (SFR-016-06).
      const entries = diffEntries(
        { targetType: 'string', id: inverterId, name: owner?.name ?? '설비', actor: actor?.name ?? '관리자' },
        ids.map((id) => {
          const prev = before.get(id);
          const next = after.get(id);

          return {
            label: `순번 ${next?.seq ?? prev?.seq ?? 0} 스트링`,
            before: prev ? summarizeString(prev) : '',
            after: next ? summarizeString(next) : '',
          };
        }),
      );

      saveStrings(inverterId, built, entries);
      toast.success(entries.length === 0
        ? '바뀐 내용이 없습니다.'
        : MSG.updateSuccess(`${owner?.name ?? '설비'} 스트링`));
    }

    navigate(backTo);
  };

  /** 이 설비의 스트링을 통째로 비운다 — 한 조만 지우려면 편집판에서 그 줄을 뺀다. */
  const clearAll = () => {
    const inverterId = owner?.inverterId ?? '';
    const entries = listOf(inverterId).map((row) => deletedEntry(
      { targetType: 'string', id: row.id, name: row.name, actor: actor?.name ?? '관리자' },
      `${owner?.name ?? ''} · ${summarizeString(row)}`,
    ));

    saveStrings(inverterId, [], entries);
    toast.success(MSG.deleteSuccess(`${owner?.name ?? '설비'} 스트링`));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isEdit ? `${labelOf(target.cid, equipment)} 스트링 수정` : '스트링 등록'}
          description={isEdit
            ? '이 설비의 스트링을 한꺼번에 고칩니다. 줄을 빼면 저장할 때 함께 삭제됩니다.'
            : '설비를 고르고 줄을 추가합니다. 이미 등록된 스트링은 그대로 두고 새 줄만 더합니다.'}
          backTo={backTo}
          danger={isEdit ? <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button> : null}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          {isEdit ? null : (
            <>
              <Form.Picker
                label="설비"
                name="cid"
                displayName="equipmentLabel"
                placeholder="스트링 인버터를 고르세요"
                required
                modal={({ onSelect, onClose }) => (
                  <Modal
                    isOpen
                    onClose={onClose}
                    size="lg"
                    title="설비 검색"
                    description="스트링을 가질 수 있는 스트링 인버터만 보여 줍니다."
                  >
                    <RecordPicker
                      rows={equipment}
                      getRowKey={(row) => String(row.cid)}
                      selectedKey={String(pickedCid)}
                      caption="스트링 인버터 목록. CID, 발전소, 설비 이름 순입니다."
                      placeholder="설비 이름·CID·발전소로 검색"
                      emptyTitle="조건에 맞는 스트링 인버터가 없습니다"
                      match={(row, word) => row.name.includes(word)
                        || String(row.cid).includes(word)
                        || (getSchoolById(row.plantId)?.name ?? '').includes(word)}
                      columns={[
                        { key: 'cid', header: 'CID', width: '130px', render: (row) => row.cid },
                        {
                          key: 'plant',
                          header: '발전소',
                          render: (row) => getSchoolById(row.plantId)?.name ?? '소속 미지정',
                        },
                        { key: 'name', header: '설비 이름', render: (row) => row.name },
                      ]}
                      // 설비를 바꾸면 앞서 적던 줄은 다른 설비의 것이라 버리고, 피할 순번을 새로 받는다.
                      onPick={(row) => onSelect(row.cid === pickedCid
                        ? { cid: row.cid, equipmentLabel: labelOf(row.cid, equipment) }
                        : {
                          cid: row.cid,
                          equipmentLabel: labelOf(row.cid, equipment),
                          rows: [],
                          takenNumbers: listOf(row.inverterId).map((item) => item.seq),
                        })}
                    />
                  </Modal>
                )}
              />
              <p className={styles.toolbar__note}>
                지금 {owner?.name ?? '이 설비'}에 등록된 스트링 {formatNumber(listOf(owner?.inverterId ?? '').length)}조
              </p>
            </>
          )}

          <StringRows legend={isEdit ? '스트링 구성' : '추가할 스트링'} />
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isEdit
          ? MSG.updateConfirm(`${owner?.name ?? '설비'} 스트링 ${formatNumber(pending?.rows.length ?? 0)}조`)
          : MSG.createConfirm(`스트링 ${formatNumber(pending?.rows.length ?? 0)}조`)}
        description={isEdit ? '편집판에서 뺀 스트링은 함께 삭제됩니다.' : undefined}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        /*
          지우는 것은 저장돼 있는 전체다 — 편집판의 초안 줄 수를 세면 줄을 다 뺀 상태에서
          「0조를 삭제할까요?」라고 묻고 저장분을 전부 지운다.
        */
        title={MSG.deleteConfirm(`${owner?.name ?? '설비'} 스트링 ${formatNumber(listOf(owner?.inverterId ?? '').length)}조`)}
        description="이 설비에 등록된 스트링을 모두 지웁니다. 한 조만 지우려면 위 편집판에서 그 줄을 빼세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={clearAll}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}

function labelOf(cid: number, equipment: ReturnType<typeof useSelectableEquipment>): string {
  const owner = equipment.find((item) => item.cid === cid);

  return owner ? `${getSchoolById(owner.plantId)?.name ?? ''} · ${owner.name}` : '';
}
