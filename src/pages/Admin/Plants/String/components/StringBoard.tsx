import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { formatNumber } from '@/utils/format';
import { SearchInput } from '@/components/common/SearchInput';
import styles from '@/pages/Admin/Admin.module.scss';
import { useChangeHistory } from '@/pages/Admin/_shared/hooks/useChangeHistory';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringList } from '../hooks/useStringList';
import { StringTable } from './StringTable';

/**
 * 스트링 관리 (SFR-016-01, SFR-017-06).
 *
 * 목록에 스트링 인버터 설비가 모두 서므로 — 스트링이 0조인 설비까지 — 새로 심는 자리도
 * 그 줄이다. 그래서 등록 버튼을 따로 두지 않는다.
 */
export function StringBoard() {
  const changes = useChangeHistory('STRING');
  const list = useStringList();

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
            placeholder="발전소명·설비명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(list.totalCount)}대</p>
        </div>
      </div>

      <StringTable list={list} />

      <ChangeHistory title="스트링 변경 이력" rows={changes.rows} />
    </>
  );
}
