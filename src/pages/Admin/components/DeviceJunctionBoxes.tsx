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
import useEquipmentStore, { mergeInverterMasters, mergeJunctions } from '@/stores/equipmentStore';
import type { Column } from '@/components/common/Table';
import type { JunctionBoxMaster } from '@/interface/deviceMaster';
import styles from '../Admin.module.scss';
import { createdEntry, deletedEntry, diffEntries } from './deviceChangeLog';
import { DeviceHistory } from './DeviceHistory';

/** 한 접속반이 받을 수 있는 직렬·병렬 수 */
const COUNT_MAX = 50;

/** 표 한 줄 — 접속반 등록 정보에 소속 설비 이름을 붙인 것 */
interface JunctionRow extends JunctionBoxMaster {
  plantName: string;
  inverterName: string;
}

interface Draft {
  id: string | null;
  inverterId: string;
  name: string;
  seriesCount: number | '';
  parallelCount: number | '';
}

/** 접속반 관리 (SFR-017-06) — 인버터 아래 모듈이 어떻게 묶여 들어오는지를 적는다. */
export function DeviceJunctionBoxes() {
  const junctionCreated = useEquipmentStore((state) => state.junctionCreated);
  const junctionPatched = useEquipmentStore((state) => state.junctionPatched);
  const junctionDeleted = useEquipmentStore((state) => state.junctionDeleted);
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const saveJunction = useEquipmentStore((state) => state.saveJunction);
  const removeJunction = useEquipmentStore((state) => state.removeJunction);
  const nextId = useEquipmentStore((state) => state.nextId);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<JunctionRow | null>(null);

  const allInverters = useMemo(
    () => mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted),
    [inverterCreated, inverterPatched, inverterDeleted],
  );

  // 지운 발전소의 설비는 고를 수도, 그 아래 접속반을 볼 수도 없다 (SFR-016-05).
  const inverters = useMemo(
    () => allInverters.filter((item) => !deletedPlants.includes(item.plantId)),
    [allInverters, deletedPlants],
  );

  const allRows = useMemo<JunctionRow[]>(() => {
    const byId = new Map(inverters.map((item) => [item.inverterId, item]));
    const hidden = new Set(
      allInverters.filter((item) => deletedPlants.includes(item.plantId)).map((item) => item.inverterId),
    );

    return mergeJunctions(junctionCreated, junctionPatched, junctionDeleted)
      .filter((box) => !hidden.has(box.inverterId))
      .map((box) => {
        const owner = byId.get(box.inverterId);

        return {
          ...box,
          plantName: getSchoolById(owner?.plantId ?? null)?.name ?? '소속 미지정',
          inverterName: owner?.name ?? '삭제된 인버터',
        };
      });
  }, [junctionCreated, junctionPatched, junctionDeleted, inverters, allInverters, deletedPlants]);

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

  const openEditor = (target: JunctionRow | null) => {
    setErrors({});
    setDraft(target
      ? {
        id: target.id,
        inverterId: target.inverterId,
        name: target.name,
        seriesCount: target.seriesCount,
        parallelCount: target.parallelCount,
      }
      : {
        id: null,
        inverterId: inverters[0]?.inverterId ?? '',
        name: '',
        seriesCount: '',
        parallelCount: '',
      });
  };

  const submit = () => {
    if (!draft) return;

    const found: Record<string, string> = {};

    if (!draft.inverterId) found.inverterId = MSG.selectRequired('설비');
    if (!draft.name.trim()) found.name = MSG.requiredField('접속반 이름');

    if (draft.seriesCount === '' || draft.seriesCount < 1 || draft.seriesCount > COUNT_MAX) {
      found.seriesCount = MSG.numberRange('모듈 직렬', 1, COUNT_MAX);
    }

    if (draft.parallelCount === '' || draft.parallelCount < 1 || draft.parallelCount > COUNT_MAX) {
      found.parallelCount = MSG.numberRange('모듈 병렬', 1, COUNT_MAX);
    }

    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const commit = () => {
    if (!draft) return;

    const isNew = draft.id === null;
    const before = isNew ? null : allRows.find((row) => row.id === draft.id) ?? null;
    const saved: JunctionBoxMaster = {
      id: draft.id ?? nextId('JB'),
      inverterId: draft.inverterId,
      name: draft.name.trim(),
      seriesCount: Number(draft.seriesCount),
      parallelCount: Number(draft.parallelCount),
    };
    const owner = inverters.find((item) => item.inverterId === saved.inverterId);
    const target = { kind: 'junction' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(target, `${owner?.name ?? ''} · ${saved.seriesCount}직렬 × ${saved.parallelCount}병렬`)
      : diffEntries(target, [
        { label: '접속반 이름', before: before?.name ?? '', after: saved.name },
        { label: '소속 설비', before: before?.inverterName ?? '', after: owner?.name ?? '' },
        { label: '모듈 직렬', before: String(before?.seriesCount ?? ''), after: String(saved.seriesCount) },
        { label: '모듈 병렬', before: String(before?.parallelCount ?? ''), after: String(saved.parallelCount) },
      ]);

    saveJunction(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('접속반') : MSG.updateSuccess(saved.name));
    setConfirming(false);
    setDraft(null);
  };

  const columns: Column<JunctionRow>[] = [
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
    { key: 'name', header: '접속반', width: '160px', render: (row) => row.name },
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
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => openEditor(row)}>
            수정
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

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
            placeholder="접속반명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => openEditor(null)}>
            접속반 등록
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Junction"
          title="접속반 목록"
          description="접속반 한 면이 받는 직렬·병렬 수를 적습니다. 스트링 구성과 어긋나면 진단 기대값이 흔들립니다."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 접속반이 없습니다" description="검색어를 지우거나 새 접속반을 등록해 보세요." />
          ) : (
            <>
              <Table
                caption="접속반 목록. 발전소와 설비, 접속반 이름, 모듈 직렬·병렬, 모듈 수 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="접속반 목록"
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

      <DeviceHistory kind="junction" keyword={keyword} title="접속반 변경 이력" />

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id === null ? '접속반 등록' : '접속반 수정'}
        description="어느 인버터에 물리는 접속반인지 먼저 고릅니다."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              취소
            </Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        {draft ? (
          <div className={styles.form}>
            <FormSection legend="소속 설비">
              <FormRow cols={2}>
                <Select
                  label="설비"
                  value={draft.inverterId}
                  onChange={(value) => setDraft({ ...draft, inverterId: value })}
                  options={inverters.map((item) => ({
                    value: item.inverterId,
                    label: `${getSchoolById(item.plantId)?.name ?? ''} · ${item.name}`,
                  }))}
                />
                <TextField
                  label="접속반 이름"
                  value={draft.name}
                  onChange={(value) => setDraft({ ...draft, name: value })}
                  required
                  error={errors.name}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="모듈 구성" hint="직렬 장수 × 병렬 조 수가 이 접속반이 받는 모듈 수입니다.">
              <FormRow cols={2}>
                <NumberField
                  label="모듈 직렬"
                  value={draft.seriesCount}
                  onChange={(value) => setDraft({ ...draft, seriesCount: value })}
                  min={1}
                  max={COUNT_MAX}
                  unit="직렬"
                  required
                  error={errors.seriesCount}
                />
                <NumberField
                  label="모듈 병렬"
                  value={draft.parallelCount}
                  onChange={(value) => setDraft({ ...draft, parallelCount: value })}
                  min={1}
                  max={COUNT_MAX}
                  unit="병렬"
                  required
                  error={errors.parallelCount}
                />
              </FormRow>
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft?.id === null ? MSG.createConfirm('접속반') : MSG.updateConfirm(draft?.name ?? '접속반')}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '접속반')}
        description="접속반을 지워도 그 아래 스트링 등록 정보는 남습니다. 스트링 관리에서 따로 정리해 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removeJunction(deleting.id, deletedEntry(
            { kind: 'junction', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
            `${deleting.inverterName} · ${deleting.seriesCount}직렬 × ${deleting.parallelCount}병렬`,
          ));
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
