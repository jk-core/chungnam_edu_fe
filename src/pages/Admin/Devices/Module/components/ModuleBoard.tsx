import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import { useChangeHistory } from '@/pages/Admin/_shared/hooks/useChangeHistory';
import { useDebounce } from '@/hooks/useDebounce';
import styles from '@/pages/Admin/Admin.module.scss';
import { useModuleList } from '../hooks/useModuleList';
import { ModuleTable } from './ModuleTable';

/**
 * 모듈 제품 마스터 관리 (SFR-016-01/05, SFR-017-05).
 * 검색은 서버가 한다 — 입력 DOM 이 즉시값을 쥐고, 조회 조건만 늦춰 갱신한다.
 */
export function ModuleBoard() {
  const changes = useChangeHistory('MODULE');
  const list = useModuleList();
  const navigate = useNavigate();

  const search = useDebounce((keyword: string) => list.setParam((prev) => ({
    ...prev,
    keyword: keyword.trim() || undefined,
    page: 0,
  })));

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="이름 검색"
            defaultValue={list.param.keyword}
            onChange={search}
            placeholder="모듈명·업체명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(list.totalCount)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('devices', 'module'))}>
            모듈 등록
          </Button>
        </div>
      </div>

      <ModuleTable list={list} />

      <ChangeHistory title="모듈 제품 변경 이력" rows={changes.rows} />
    </>
  );
}
