import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, FormSection, NumberField, TextField } from '@/components/common/Form';
import { getSchoolById } from '@/mocks/schools';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Select } from '@/components/common/Select';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeInverterMasters, mergeStrings } from '@/stores/equipmentStore';
import type { Column } from '@/components/common/Table';
import type { StringMaster } from '@/interface/deviceMaster';
import styles from '../Admin.module.scss';
import { createdEntry, deletedEntry, diffEntries } from './deviceChangeLog';
import { DeviceHistory } from './DeviceHistory';

/** 한 스트링이 받을 수 있는 직렬·병렬 수 */
const COUNT_MAX = 50;

/** 표 한 줄 — 스트링 등록 정보에 소속 설비 이름을 붙인 것 */
interface StringRow extends StringMaster {
  plantName: string;
  inverterName: string;
}

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

interface Sheet {
  mode: 'add' | 'edit';
  inverterId: string;
  rows: DraftRow[];
  /** 줄 key 를 겹치지 않게 매기는 카운터 */
  seq: number;
}

function summarize(row: Pick<StringMaster, 'name' | 'seriesCount' | 'parallelCount'>): string {
  return `${row.name} · ${row.seriesCount}직렬 × ${row.parallelCount}병렬`;
}

/**
 * 스트링 관리 (SFR-016-01, SFR-017-06).
 * 목록에서 조회하고, 등록·수정은 설비 한 대의 스트링을 한꺼번에 다룬다.
 */
export function DeviceStrings() {
  const stringCreated = useEquipmentStore((state) => state.stringCreated);
  const stringPatched = useEquipmentStore((state) => state.stringPatched);
  const stringDeleted = useEquipmentStore((state) => state.stringDeleted);
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const saveStrings = useEquipmentStore((state) => state.saveStrings);
  const removeString = useEquipmentStore((state) => state.removeString);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<StringRow | null>(null);

  // 지운 발전소의 설비는 고를 수 없다 (SFR-016-05).
  const inverters = useMemo(
    () => mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted)
      .filter((item) => !deletedPlants.includes(item.plantId)),
    [inverterCreated, inverterPatched, inverterDeleted, deletedPlants],
  );

  const allStrings = useMemo(
    () => mergeStrings(stringCreated, stringPatched, stringDeleted),
    [stringCreated, stringPatched, stringDeleted],
  );

  const allRows = useMemo<StringRow[]>(() => {
    const byId = new Map(inverters.map((item) => [item.inverterId, item]));

    return allStrings
      .filter((row) => byId.has(row.inverterId))
      .map((row) => {
        const owner = byId.get(row.inverterId);

        return {
          ...row,
          plantName: getSchoolById(owner?.plantId ?? null)?.name ?? '소속 미지정',
          inverterName: owner?.name ?? '',
        };
      })
      // 설비끼리 묶어 두고 그 안에서 순번대로 — 표에서 구성을 이어 읽을 수 있게 한다.
      .sort((a, b) => (a.inverterId === b.inverterId
        ? a.seq - b.seq
        : `${a.plantName}${a.inverterName}`.localeCompare(`${b.plantName}${b.inverterName}`)));
  }, [allStrings, inverters]);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.inverterName.includes(trimmed)
        || row.name.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /** 저장은 인버터 한 대의 목록을 통째로 갈아 끼운다 — 그 설비의 지금 목록을 가져온다. */
  const listOf = (inverterId: string): StringMaster[] => allRows
    .filter((row) => row.inverterId === inverterId)
    .map(({ plantName, inverterName, ...row }) => row);

  const openAdd = () => {
    setErrors({});
    setSheet({ mode: 'add', inverterId: inverters[0]?.inverterId ?? '', rows: [], seq: 0 });
  };

  /** 목록의 수정은 그 줄만이 아니라 같은 설비의 스트링을 모두 편집판에 올린다. */
  const openEdit = (target: StringRow) => {
    setErrors({});
    setSheet({
      mode: 'edit',
      inverterId: target.inverterId,
      rows: listOf(target.inverterId).map((row, index) => ({
        key: index + 1,
        id: row.id,
        seq: row.seq,
        name: row.name,
        seriesCount: row.seriesCount,
        parallelCount: row.parallelCount,
      })),
      seq: listOf(target.inverterId).length,
    });
  };

  const patchRow = (current: Sheet, key: number, patch: Partial<DraftRow>) => {
    setSheet({
      ...current,
      rows: current.rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    });
  };

  const addRow = (current: Sheet, from: DraftRow | null) => {
    // 등록은 기존 목록 뒤에 붙고, 수정은 편집판이 이미 전체 목록이라 그 안에서만 다음 번호를 찾는다.
    const base = current.mode === 'add' ? listOf(current.inverterId).map((row) => row.seq) : [];
    const nextSeq = Math.max(
      0,
      ...base,
      ...current.rows.map((row) => Number(row.seq) || 0),
    ) + 1;

    setSheet({
      ...current,
      seq: current.seq + 1,
      rows: [
        ...current.rows,
        {
          key: current.seq + 1,
          id: null,
          seq: nextSeq,
          name: from ? `${from.name} 복사` : `스트링 ${nextSeq}`,
          seriesCount: from?.seriesCount ?? 18,
          parallelCount: from?.parallelCount ?? 1,
        },
      ],
    });
  };

  const submit = () => {
    if (!sheet) return;

    const found: Record<string, string> = {};

    if (!sheet.inverterId) found.inverterId = MSG.selectRequired('설비');
    if (sheet.mode === 'add' && sheet.rows.length === 0) found.rows = '등록할 스트링을 한 줄 이상 추가해 주세요.';

    // 등록은 이미 저장된 순번과도 겹치면 안 된다. 수정은 편집판이 곧 전체 목록이다.
    const seen = new Set(sheet.mode === 'add' ? listOf(sheet.inverterId).map((row) => row.seq) : []);

    sheet.rows.forEach((row) => {
      if (!row.name.trim()) found[`${row.key}.name`] = MSG.requiredField('이름');

      if (row.seq === '' || row.seq < 1) found[`${row.key}.seq`] = MSG.numberRange('순번', 1, 999);
      else if (seen.has(row.seq)) found[`${row.key}.seq`] = '순번이 겹칩니다.';
      else seen.add(row.seq);

      if (row.seriesCount === '' || row.seriesCount < 1 || row.seriesCount > COUNT_MAX) {
        found[`${row.key}.seriesCount`] = MSG.numberRange('직렬', 1, COUNT_MAX);
      }

      if (row.parallelCount === '' || row.parallelCount < 1 || row.parallelCount > COUNT_MAX) {
        found[`${row.key}.parallelCount`] = MSG.numberRange('병렬', 1, COUNT_MAX);
      }
    });

    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const commit = () => {
    if (!sheet) return;

    const owner = inverters.find((item) => item.inverterId === sheet.inverterId);
    const built: StringMaster[] = sheet.rows.map((row) => ({
      // 새 줄은 저장 시각과 줄 번호를 섞어 시드 id 와 겹치지 않게 한다.
      id: row.id ?? `str-${sheet.inverterId}-${Date.now().toString(36)}-${row.key}`,
      inverterId: sheet.inverterId,
      seq: Number(row.seq),
      name: row.name.trim(),
      seriesCount: Number(row.seriesCount),
      parallelCount: Number(row.parallelCount),
    }));

    if (sheet.mode === 'add') {
      const entries = built.flatMap((row) => createdEntry(
        { kind: 'string', id: row.id, name: row.name, actor: actor?.name ?? '관리자' },
        `${owner?.name ?? ''} · 순번 ${row.seq} · ${row.seriesCount}직렬 × ${row.parallelCount}병렬`,
      ));

      saveStrings(sheet.inverterId, [...listOf(sheet.inverterId), ...built], entries);
      toast.success(MSG.createSuccess(`스트링 ${built.length}조`));
    } else {
      const before = new Map(listOf(sheet.inverterId).map((row) => [row.id, row]));
      const after = new Map(built.map((row) => [row.id, row]));
      const ids = [...new Set([...before.keys(), ...after.keys()])];

      // 설비 한 대를 대상으로 남기고, 줄마다 "순번 N 스트링" 으로 묶는다 (SFR-016-06).
      const entries = diffEntries(
        {
          kind: 'string',
          id: sheet.inverterId,
          name: owner?.name ?? '설비',
          actor: actor?.name ?? '관리자',
        },
        ids.map((id) => {
          const prev = before.get(id);
          const next = after.get(id);

          return {
            label: `순번 ${next?.seq ?? prev?.seq ?? 0} 스트링`,
            before: prev ? summarize(prev) : '',
            after: next ? summarize(next) : '',
          };
        }),
      );

      saveStrings(sheet.inverterId, built, entries);
      toast.success(entries.length === 0
        ? '바뀐 내용이 없습니다.'
        : MSG.updateSuccess(`${owner?.name ?? '설비'} 스트링`));
    }

    setConfirming(false);
    setSheet(null);
  };

  const columns: Column<StringRow>[] = [
    {
      key: 'plant',
      header: '발전소 · 설비',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.inverterName}</span>
        </span>
      ),
    },
    { key: 'seq', header: '순번', align: 'right', width: '80px', render: (row) => `${row.seq}번` },
    { key: 'name', header: '스트링', width: '160px', render: (row) => row.name },
    { key: 'series', header: '모듈 직렬', align: 'right', width: '100px', render: (row) => `${row.seriesCount}직렬` },
    { key: 'parallel', header: '모듈 병렬', align: 'right', width: '100px', render: (row) => `${row.parallelCount}병렬` },
    {
      key: 'panels',
      header: '모듈 수',
      align: 'right',
      width: '100px',
      hideOnTablet: true,
      render: (row) => `${formatNumber(row.seriesCount * row.parallelCount)}장`,
    },
    {
      key: 'action',
      header: '관리',
      width: '160px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            설비 단위 수정
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  const owner = sheet ? inverters.find((item) => item.inverterId === sheet.inverterId) : null;
  const ownerLabel = owner ? `${getSchoolById(owner.plantId)?.name ?? ''} · ${owner.name}` : '';
  const draftPanels = sheet
    ? sheet.rows.reduce((sum, row) => sum + Number(row.seriesCount || 0) * Number(row.parallelCount || 0), 0)
    : 0;

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
            placeholder="스트링명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={openAdd}>
            스트링 등록
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="String"
          title="스트링 목록"
          description="설비별로 묶어 순번대로 보여 줍니다. 수정을 누르면 그 설비의 스트링을 한 판에서 함께 고칩니다."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 스트링이 없습니다" description="검색어를 지우거나 새 스트링을 등록해 보세요." />
          ) : (
            <>
              <Table
                caption="스트링 목록. 발전소와 설비, 순번, 스트링 이름, 모듈 직렬·병렬, 모듈 수 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="스트링 목록"
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </Card>
      </Reveal>

      <DeviceHistory kind="string" keyword={keyword} title="스트링 변경 이력" />

      <Modal
        isOpen={sheet !== null}
        onClose={() => setSheet(null)}
        size="lg"
        title={sheet?.mode === 'add' ? '스트링 등록' : `${ownerLabel} 스트링 수정`}
        description={sheet?.mode === 'add'
          ? '설비를 고르고 줄을 추가합니다. 이미 등록된 스트링은 그대로 두고 새 줄만 더합니다.'
          : '이 설비의 스트링을 한꺼번에 고칩니다. 줄을 빼면 저장할 때 함께 삭제됩니다.'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setSheet(null)}>
              취소
            </Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        {sheet ? (
          <div className={styles.form}>
            {sheet.mode === 'add' ? (
              <FormSection legend="소속 설비">
                <FormRow cols={2}>
                  <Select
                    label="설비"
                    value={sheet.inverterId}
                    onChange={(value) => setSheet({ ...sheet, inverterId: value, rows: [] })}
                    options={inverters.map((item) => ({
                      value: item.inverterId,
                      label: `${getSchoolById(item.plantId)?.name ?? ''} · ${item.name}`,
                    }))}
                  />
                </FormRow>
                <p className={styles.toolbar__note}>
                  지금 {owner?.name ?? '이 설비'}에 등록된 스트링 {formatNumber(listOf(sheet.inverterId).length)}조
                </p>
              </FormSection>
            ) : null}

            <FormSection
              legend={sheet.mode === 'add' ? '추가할 스트링' : '스트링 구성'}
              hint="복사를 누르면 같은 구성으로 한 줄이 더 생깁니다."
            >
              {sheet.rows.length === 0 ? (
                <p className={styles.toolbar__note}>
                  아래 버튼으로 줄을 추가해 주세요.{errors.rows ? ` ${errors.rows}` : ''}
                </p>
              ) : (
                <div className={styles.stringList}>
                  {sheet.rows.map((row) => (
                    <div key={row.key} className={styles.stringRow}>
                      <NumberField
                        label="순번"
                        value={row.seq}
                        onChange={(value) => patchRow(sheet, row.key, { seq: value })}
                        min={1}
                        width="sm"
                        error={errors[`${row.key}.seq`]}
                      />
                      <TextField
                        label="이름"
                        value={row.name}
                        onChange={(value) => patchRow(sheet, row.key, { name: value })}
                        width="full"
                        error={errors[`${row.key}.name`]}
                      />
                      <NumberField
                        label="직렬"
                        value={row.seriesCount}
                        onChange={(value) => patchRow(sheet, row.key, { seriesCount: value })}
                        min={1}
                        max={COUNT_MAX}
                        width="sm"
                        error={errors[`${row.key}.seriesCount`]}
                      />
                      <NumberField
                        label="병렬"
                        value={row.parallelCount}
                        onChange={(value) => patchRow(sheet, row.key, { parallelCount: value })}
                        min={1}
                        max={COUNT_MAX}
                        width="sm"
                        error={errors[`${row.key}.parallelCount`]}
                      />
                      <span className={styles.toolbar__actions}>
                        <Button size="sm" variant="secondary" onClick={() => addRow(sheet, row)}>
                          복사
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSheet({ ...sheet, rows: sheet.rows.filter((item) => item.key !== row.key) })}
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
                  {formatNumber(sheet.rows.length)}조 · 모듈 {formatNumber(draftPanels)}장
                </p>
                <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => addRow(sheet, null)}>
                  줄 추가
                </Button>
              </div>
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={sheet?.mode === 'add'
          ? MSG.createConfirm(`스트링 ${formatNumber(sheet?.rows.length ?? 0)}조`)
          : MSG.updateConfirm(`${owner?.name ?? '설비'} 스트링 ${formatNumber(sheet?.rows.length ?? 0)}조`)}
        description={sheet?.mode === 'edit' ? '편집판에서 뺀 스트링은 함께 삭제됩니다.' : undefined}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '스트링')}
        description="지운 스트링은 그 설비의 구성에서 빠집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removeString(deleting.id, deletedEntry(
            { kind: 'string', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
            `${deleting.inverterName} · ${summarize(deleting)}`,
          ));
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
