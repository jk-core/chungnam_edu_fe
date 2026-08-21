import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatCapacity, formatNumber } from '@/utils/format';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { toast } from '@/stores/toastStore';
import { useManagedUsers } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import useAssetStore from '@/stores/assetStore';
import type { School } from '@/interface/energy';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePlantChangeLog } from '../hooks/usePlantChangeLog';
import { useAssetOf, usePlantCapacity, usePlantRows } from '../hooks/usePlantData';
import { PlantHistory } from './PlantHistory';
import { PlantTable } from './PlantTable';

/**
 * 발전소·설비 등록 및 수정 (SFR-016).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function PlantsBoard() {
  const removePlant = useAssetStore((state) => state.removePlant);
  const assetOf = useAssetOf();
  const capacityOf = usePlantCapacity();
  const users = useManagedUsers();
  const allRows = usePlantRows();
  const entryOf = usePlantChangeLog();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [deleting, setDeleting] = useState<School | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    if (!trimmed) return allRows;

    // 전체 검색 — ID·발전소 이름·사용자 어느 쪽에 걸려도 남긴다.
    return allRows.filter((school) => {
      const asset = assetOf(school.id);
      const owner = users.find((item) => item.userId === asset?.userId);

      return (asset?.plantName ?? school.name).includes(trimmed)
        || school.regionName.includes(trimmed)
        || String(asset?.powerPlantId ?? '').includes(trimmed)
        || Boolean(owner?.name.includes(trimmed))
        || Boolean(owner?.orgName.includes(trimmed));
    });
  }, [keyword, allRows, assetOf, users]);

  const remove = () => {
    if (!deleting) return;

    const capacity = formatCapacity(capacityOf(deleting.id));

    removePlant(deleting.id, entryOf(
      { id: deleting.id, name: deleting.name },
      '발전소 삭제',
      `${capacity.value}${capacity.unit} · ${deleting.regionName}`,
      '—',
      // 같은 발전소의 등록 이력과 id 가 겹치지 않게 갈래를 붙인다 — 목록 key 로 쓰인다.
      'del',
    ));
    toast.success(MSG.deleteSuccess(deleting.name));
    setDeleting(null);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={setKeyword}
            placeholder="ID·발전소 이름·사용자로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'plant'))}>
            발전소 등록
          </Button>
        </div>
      </div>

      <PlantTable rows={rows} onDelete={setDeleting} />

      <PlantHistory />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '발전소')}
        description="딸린 설비·스트링·일사량계와 RTU·접속반도 함께 감춰집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
