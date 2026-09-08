import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import { useDeviceChanges } from '@/stores/equipmentStore';
import { useModuleProducts } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentRows';
import styles from '@/pages/Admin/Admin.module.scss';
import { ModuleTable } from './ModuleTable';

/**
 * 모듈 제품 마스터 관리 (SFR-016-01/05, SFR-017-05).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function ModuleBoard() {
  const changes = useDeviceChanges('module');
  const products = useModuleProducts();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? products.filter((item) => item.name.includes(trimmed)
        || item.maker.includes(trimmed)
        || String(item.moduleId).includes(trimmed))
      : products;
  }, [products, keyword]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="이름 검색"
            value={keyword}
            onChange={setKeyword}
            placeholder="모듈명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('devices', 'module'))}>
            모듈 등록
          </Button>
        </div>
      </div>

      <ModuleTable rows={rows} />

      <ChangeHistory title="모듈 제품 변경 이력" rows={changes} />
    </>
  );
}
