import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import styles from '@/pages/Admin/Admin.module.scss';
import { useChangeHistory } from '@/pages/Admin/_shared/hooks/useChangeHistory';
import { useDebounce } from '@/hooks/useDebounce';
import { usePyranometerList } from '../hooks/usePyranometerList';
import { PyranometerTable } from './PyranometerTable';

/**
 * 일사량계(환경센서) 관리 (SFR-016-01/05) — 발전소마다 한 대가 기본이다.
 * 검색은 서버가 한다 — 입력 DOM 이 즉시값을 쥐고, 조회 조건만 늦춰 갱신한다.
 */
export function PyranometerBoard() {
  const changes = useChangeHistory('IRRAD');
  const list = usePyranometerList();
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
            placeholder="일사량계명·RTU 통신ID 로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(list.totalCount)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'pyranometer'))}>
            일사량계 등록
          </Button>
        </div>
      </div>

      <PyranometerTable list={list} />

      <ChangeHistory title="일사량계 변경 이력" rows={changes.rows} />
    </>
  );
}
