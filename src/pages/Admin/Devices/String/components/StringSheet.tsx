import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, TextField } from '@/components/common/Form';
import { getSchoolById } from '@/mocks/schools';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { StringMaster } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { createdEntry, diffEntries } from '../../utils/deviceChangeLog';
import { useSelectableInverters } from '../../hooks/useSelectableInverters';
import { summarizeString, useStringsOf } from '../hooks/useStringData';
import type { EquipmentRow } from '../hooks/useStringData';

/** 한 스트링이 받을 수 있는 직렬·병렬 수 */
const COUNT_MIN = 1;
const COUNT_MAX = 50;

/** 줄을 새로 만들 때의 기본 구성 */
const DEFAULT_SERIES = 18;
const DEFAULT_PARALLEL = 1;

/**
 * 편집판의 한 줄.
 * 스트링은 한 설비 안에서 함께 늘고 주는 값이라, 등록도 수정도 여러 줄을 한 판에 놓고 다룬다.
 * `id` 가 없으면 이번에 새로 만든 줄이다.
 */
interface DraftRow {
  key: number;
  id: string | null;
  seq: number | '';
  name: string;
  seriesCount: number | '';
  parallelCount: number | '';
}

interface StringSheetProps {
  /** 고칠 설비. null 이면 새로 등록하는 판이다 */
  target: EquipmentRow | null;
  onClose: () => void;
}

/**
 * 스트링 편집판 (SFR-016-01, SFR-017-06).
 *
 * 등록은 이미 있는 목록 뒤에 새 줄만 더하고, 수정은 편집판이 곧 그 설비의 전체 목록이라
 * 뺀 줄이 저장할 때 함께 지워진다.
 */
export function StringSheet({ target, onClose }: StringSheetProps) {
  const saveStrings = useEquipmentStore((state) => state.saveStrings);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();
  const inverters = useSelectableInverters();
  const { listOf } = useStringsOf();

  const isEdit = target !== null;

  const [inverterId, setInverterId] = useState(() => target?.inverterId ?? inverters[0]?.inverterId ?? '');
  const [rows, setRows] = useState<DraftRow[]>(() => (target
    ? listOf(target.inverterId).map((row, index) => ({
      key: index + 1,
      id: row.id,
      seq: row.seq,
      name: row.name,
      seriesCount: row.seriesCount,
      parallelCount: row.parallelCount,
    }))
    : []));
  /** 줄 key 를 겹치지 않게 매기는 카운터 */
  const [keySeq, setKeySeq] = useState(() => (target ? listOf(target.inverterId).length : 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const owner = inverters.find((item) => item.inverterId === inverterId);
  const ownerLabel = owner ? `${getSchoolById(owner.plantId)?.name ?? ''} · ${owner.name}` : '';
  const draftPanels = rows.reduce(
    (sum, row) => sum + Number(row.seriesCount || 0) * Number(row.parallelCount || 0),
    0,
  );

  const patchRow = (key: number, patch: Partial<DraftRow>) => {
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = (from: DraftRow | null) => {
    // 등록은 기존 목록 뒤에 붙고, 수정은 편집판이 이미 전체 목록이라 그 안에서만 다음 번호를 찾는다.
    const base = isEdit ? [] : listOf(inverterId).map((row) => row.seq);
    const seq = Math.max(0, ...base, ...rows.map((row) => Number(row.seq) || 0)) + 1;

    setKeySeq(keySeq + 1);
    setRows([
      ...rows,
      {
        key: keySeq + 1,
        id: null,
        seq,
        name: from ? `${from.name} 복사` : `스트링 ${seq}`,
        seriesCount: from?.seriesCount ?? DEFAULT_SERIES,
        parallelCount: from?.parallelCount ?? DEFAULT_PARALLEL,
      },
    ]);
  };

  const submit = () => {
    const found: Record<string, string> = {};

    if (!inverterId) found.inverterId = MSG.selectRequired('설비');
    if (!isEdit && rows.length === 0) found.rows = '등록할 스트링을 한 줄 이상 추가해 주세요.';

    // 등록은 이미 저장된 순번과도 겹치면 안 된다. 수정은 편집판이 곧 전체 목록이다.
    const seen = new Set(isEdit ? [] : listOf(inverterId).map((row) => row.seq));

    rows.forEach((row) => {
      if (!row.name.trim()) found[`${row.key}.name`] = MSG.requiredField('이름');

      if (row.seq === '' || row.seq < 1) found[`${row.key}.seq`] = MSG.numberRange('순번', 1, 999);
      else if (seen.has(row.seq)) found[`${row.key}.seq`] = '순번이 겹칩니다.';
      else seen.add(row.seq);

      if (row.seriesCount === '' || row.seriesCount < COUNT_MIN || row.seriesCount > COUNT_MAX) {
        found[`${row.key}.seriesCount`] = MSG.numberRange('직렬', COUNT_MIN, COUNT_MAX);
      }

      if (row.parallelCount === '' || row.parallelCount < COUNT_MIN || row.parallelCount > COUNT_MAX) {
        found[`${row.key}.parallelCount`] = MSG.numberRange('병렬', COUNT_MIN, COUNT_MAX);
      }
    });

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
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={isEdit ? `${ownerLabel} 스트링 수정` : '스트링 등록'}
        description={isEdit
          ? '이 설비의 스트링을 한꺼번에 고칩니다. 줄을 빼면 저장할 때 함께 삭제됩니다.'
          : '설비를 고르고 줄을 추가합니다. 이미 등록된 스트링은 그대로 두고 새 줄만 더합니다.'}
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          {isEdit ? null : (
            <FormSection legend="소속 설비">
              <FormRow cols={2}>
                <Select
                  label="설비"
                  value={inverterId}
                  onChange={(value) => {
                    // 설비를 바꾸면 앞서 적던 줄은 다른 설비의 것이라 버린다.
                    setInverterId(value);
                    setRows([]);
                  }}
                  options={inverters.map((item) => ({
                    value: item.inverterId,
                    label: `${getSchoolById(item.plantId)?.name ?? ''} · ${item.name}`,
                  }))}
                />
              </FormRow>
              <p className={styles.toolbar__note}>
                지금 {owner?.name ?? '이 설비'}에 등록된 스트링 {formatNumber(listOf(inverterId).length)}조
              </p>
            </FormSection>
          )}

          <FormSection
            legend={isEdit ? '스트링 구성' : '추가할 스트링'}
            hint="복사를 누르면 같은 구성으로 한 줄이 더 생깁니다."
          >
            {rows.length === 0 ? (
              <p className={styles.toolbar__note}>
                아래 버튼으로 줄을 추가해 주세요.{errors.rows ? ` ${errors.rows}` : ''}
              </p>
            ) : (
              <div className={styles.stringList}>
                {rows.map((row) => (
                  <div key={row.key} className={styles.stringRow}>
                    <NumberField
                      label="순번"
                      value={row.seq}
                      onChange={(value) => patchRow(row.key, { seq: value })}
                      min={1}
                      width="sm"
                      error={errors[`${row.key}.seq`]}
                    />
                    <TextField
                      label="이름"
                      value={row.name}
                      onChange={(value) => patchRow(row.key, { name: value })}
                      width="full"
                      error={errors[`${row.key}.name`]}
                    />
                    <NumberField
                      label="직렬"
                      value={row.seriesCount}
                      onChange={(value) => patchRow(row.key, { seriesCount: value })}
                      min={COUNT_MIN}
                      max={COUNT_MAX}
                      width="sm"
                      error={errors[`${row.key}.seriesCount`]}
                    />
                    <NumberField
                      label="병렬"
                      value={row.parallelCount}
                      onChange={(value) => patchRow(row.key, { parallelCount: value })}
                      min={COUNT_MIN}
                      max={COUNT_MAX}
                      width="sm"
                      error={errors[`${row.key}.parallelCount`]}
                    />
                    <span className={styles.toolbar__actions}>
                      <Button size="sm" variant="secondary" onClick={() => addRow(row)}>복사</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRows(rows.filter((item) => item.key !== row.key))}
                      >
                        빼기
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.stringFoot}>
              <p className={styles.toolbar__note}>
                {formatNumber(rows.length)}조 · 모듈 {formatNumber(draftPanels)}장
              </p>
              <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => addRow(null)}>줄 추가</Button>
            </div>
          </FormSection>
        </div>
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
    </>
  );
}
