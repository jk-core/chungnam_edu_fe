import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import { useManagedUsers } from '@/hooks/usePlantAssets';
import { usePlantChanges } from '@/stores/assetStore';
import styles from '@/pages/Admin/Admin.module.scss';
import { useAssetOf, usePlantRows } from '../hooks/usePlantData';
import { PlantTable } from './PlantTable';

/**
 * 발전소 등록 및 수정 (SFR-016).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function PlantsBoard() {
  const assetOf = useAssetOf();
  const users = useManagedUsers();
  const allRows = usePlantRows();
  const changes = usePlantChanges();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

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
        || Boolean(owner?.name.includes(trimmed));
    });
  }, [keyword, allRows, assetOf, users]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="이름 검색"
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

      <PlantTable rows={rows} />

      <ChangeHistory title="수정 이력" rows={changes} />
    </>
  );
}
