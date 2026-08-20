import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MSG } from '@/configs/messages';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { School } from '@/interface/energy';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { useAssetOf, usePlantRows } from '../hooks/usePlantData';
import { PlantCreator } from './PlantCreator';
import { PlantEditor } from './PlantEditor';
import { PlantHistory } from './PlantHistory';
import { PlantTable } from './PlantTable';

/**
 * 발전소·설비 등록 및 수정 (SFR-016).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function PlantsBoard() {
  const removePlant = useAssetStore((state) => state.removePlant);
  const assetOf = useAssetOf();
  const allRows = usePlantRows();
  const entryOf = usePlantChangeLog();

  const [keyword, setKeyword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleting, setDeleting] = useState<School | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((school) => school.name.includes(trimmed)
        || school.regionName.includes(trimmed)
        || String(assetOf(school.id)?.powerPlantId ?? '').includes(trimmed))
      : allRows;
  }, [keyword, allRows, assetOf]);

  const editing = editingId ? assetOf(editingId) : null;

  const remove = () => {
    if (!deleting) return;

    removePlant(deleting.id, entryOf(
      { id: deleting.id, name: deleting.name },
      '발전소 삭제',
      `${formatNumber(deleting.capacityKw, 1)}kW · ${deleting.regionName}`,
      '—',
      // 같은 발전소의 등록 이력과 id 가 겹치지 않게 갈래를 붙인다 — 목록 key 로 쓰인다.
      'del',
    ));
    toast.success(MSG.deleteSuccess(deleting.name));
    setDeleting(null);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={setKeyword}
            placeholder="발전소명으로 검색"
            width="md"
          />
        </div>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
          <Button size="sm" onClick={() => setIsCreating(true)}>발전소 등록</Button>
        </div>
      </div>

      <PlantTable rows={rows} onEdit={setEditingId} onDelete={setDeleting} />

      <PlantHistory />

      {/* 고른 발전소가 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <PlantEditor key={editing.plantId} asset={editing} onClose={() => setEditingId(null)} />
      ) : null}

      {isCreating ? <PlantCreator onClose={() => setIsCreating(false)} /> : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '발전소')}
        description="딸린 RTU·인버터·접속반·스트링·일사량계도 시스템장비 관리에서 함께 감춰집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
