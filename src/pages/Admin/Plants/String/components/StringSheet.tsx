import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { formatNumber } from '@/utils/format';
import { getSchoolById } from '@/mocks/schools';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { PickerField, RecordPicker } from '@/components/common/RecordPicker';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useSelectableEquipment } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore from '@/stores/equipmentStore';
import type { StringMaster } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { summarizeString, useStringOwners, useStringsOf } from '../hooks/useStringData';
import { StringRows, validateStringRows } from './StringRows';
import type { StringDraftRow } from './StringRows';

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

  const [inverterId, setInverterId] = useState(() => target?.inverterId ?? '');
  const [rows, setRows] = useState<StringDraftRow[]>(() => (target
    ? listOf(target.inverterId).map((row, index) => ({
      key: index + 1,
      id: row.id,
      seq: row.seq,
      name: row.name,
      seriesCount: row.seriesCount,
      parallelCount: row.parallelCount,
    }))
    : []));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPicking, setIsPicking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const owner = equipment.find((item) => item.inverterId === inverterId);
  const ownerLabel = owner ? `${getSchoolById(owner.plantId)?.name ?? ''} · ${owner.name}` : '';
  // 등록판은 이미 저장된 순번을 피해야 하고, 수정판은 편집판이 곧 전체 목록이다.
  const takenSeqs = isEdit ? [] : listOf(inverterId).map((row) => row.seq);

  const submit = () => {
    const found = validateStringRows(rows, takenSeqs);

    if (!inverterId) found.inverterId = MSG.selectRequired('설비');
    if (!isEdit && rows.length === 0) found.rows = '등록할 스트링을 한 줄 이상 추가해 주세요.';

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const current = listOf(inverterId);
    const known = new Map(current.map((row) => [row.id, row.stringId]));
    const built: StringMaster[] = rows.map((row) => ({
      // 새 줄은 저장 시각과 줄 번호를 섞어 시드 id 와 겹치지 않게 한다.
      id: row.id ?? `str-${inverterId}-${Date.now().toString(36)}-${row.key}`,
      stringId: (row.id ? known.get(row.id) : undefined) ?? nextSeq() + row.key,
      inverterId,
      seq: Number(row.seq),
      name: row.name.trim(),
      seriesCount: Number(row.seriesCount),
      parallelCount: Number(row.parallelCount),
    }));

    if (!isEdit) {
      const entries = built.flatMap((row) => createdEntry(
        { kind: 'string', id: row.id, name: row.name, actor: actor?.name ?? '관리자' },
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
        { kind: 'string', id: inverterId, name: owner?.name ?? '설비', actor: actor?.name ?? '관리자' },
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

    setIsConfirming(false);
    navigate(backTo);
  };

  /** 이 설비의 스트링을 통째로 비운다 — 한 조만 지우려면 편집판에서 그 줄을 뺀다. */
  const clearAll = () => {
    const entries = listOf(inverterId).map((row) => deletedEntry(
      { kind: 'string', id: row.id, name: row.name, actor: actor?.name ?? '관리자' },
      `${owner?.name ?? ''} · ${summarizeString(row)}`,
    ));

    saveStrings(inverterId, [], entries);
    toast.success(MSG.deleteSuccess(`${owner?.name ?? '설비'} 스트링`));
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={isEdit ? `${ownerLabel} 스트링 수정` : '스트링 등록'}
        description={isEdit
          ? '이 설비의 스트링을 한꺼번에 고칩니다. 줄을 빼면 저장할 때 함께 삭제됩니다.'
          : '설비를 고르고 줄을 추가합니다. 이미 등록된 스트링은 그대로 두고 새 줄만 더합니다.'}
        backTo={backTo}
        danger={isEdit ? <Button variant="danger" onClick={() => setIsDeleting(true)}>전체 삭제</Button> : null}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        {isEdit ? null : (
          <>
            <PickerField
              label="설비"
              value={ownerLabel}
              placeholder="스트링 인버터를 고르세요"
              onOpen={() => setIsPicking(true)}
              required
              error={errors.inverterId}
            />
            <p className={styles.toolbar__note}>
              지금 {owner?.name ?? '이 설비'}에 등록된 스트링 {formatNumber(listOf(inverterId).length)}조
            </p>
          </>
        )}

        <StringRows
          rows={rows}
          onChange={setRows}
          errors={errors}
          takenSeqs={takenSeqs}
          legend={isEdit ? '스트링 구성' : '추가할 스트링'}
        />
      </FormPage>

      <Modal
        isOpen={isPicking}
        onClose={() => setIsPicking(false)}
        size="lg"
        title="설비 검색"
        description="스트링을 가질 수 있는 스트링 인버터만 보여 줍니다."
      >
        <RecordPicker
          rows={equipment}
          getRowKey={(row) => row.inverterId}
          selectedKey={inverterId}
          caption="스트링 인버터 목록. CID, 발전소, 설비 이름 순입니다."
          placeholder="설비 이름·CID·발전소로 검색"
          emptyTitle="조건에 맞는 스트링 인버터가 없습니다"
          match={(row, word) => row.name.includes(word)
              || String(row.cid).includes(word)
              || (getSchoolById(row.plantId)?.name ?? '').includes(word)}
          columns={[
            { key: 'cid', header: 'CID', width: '130px', render: (row) => row.cid },
            { key: 'plant', header: '발전소', render: (row) => getSchoolById(row.plantId)?.name ?? '소속 미지정' },
            { key: 'name', header: '설비 이름', render: (row) => row.name },
          ]}
          onPick={(row) => {
            // 설비를 바꾸면 앞서 적던 줄은 다른 설비의 것이라 버린다.
            if (row.inverterId !== inverterId) setRows([]);
            setInverterId(row.inverterId);
            setIsPicking(false);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isEdit
          ? MSG.updateConfirm(`${owner?.name ?? '설비'} 스트링 ${formatNumber(rows.length)}조`)
          : MSG.createConfirm(`스트링 ${formatNumber(rows.length)}조`)}
        description={isEdit ? '편집판에서 뺀 스트링은 함께 삭제됩니다.' : undefined}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(`${owner?.name ?? '설비'} 스트링 ${formatNumber(rows.length)}조`)}
        description="이 설비에 등록된 스트링을 모두 지웁니다. 한 조만 지우려면 위 편집판에서 그 줄을 빼세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={clearAll}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
