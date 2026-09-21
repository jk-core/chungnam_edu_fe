import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { INVERTER_TYPE } from '@/configs/codes';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Select';
import { useChangeHistory } from '@/pages/Admin/_shared/hooks/useChangeHistory';
import { useDebounce } from '@/hooks/useDebounce';
import styles from '@/pages/Admin/Admin.module.scss';
import type { InverterTypeCode } from '@/configs/codes';
import { useInverterList } from '../hooks/useInverterList';
import { InverterTable } from './InverterTable';

/**
 * 인버터 제품 마스터 관리 (SFR-017-04).
 * 검색과 기종 좁히기를 서버가 하므로 여기서는 조건만 갱신한다.
 */
export function InverterBoard() {
  const changes = useChangeHistory('INVERTER');
  const list = useInverterList();
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
            placeholder="인버터 이름·업체 이름으로 검색"
            width="md"
          />
          <Select
            label="인버터 타입"
            hideLabel
            value={list.param.inverterTypeCode === undefined ? '' : String(list.param.inverterTypeCode)}
            onChange={(value) => list.setParam((prev) => ({
              ...prev,
              inverterTypeCode: value ? (Number(value) as InverterTypeCode) : undefined,
              page: 0,
            }))}
            options={[
              { value: '', label: '전체 기종' },
              ...Object.entries(INVERTER_TYPE.NAME).map(([code, label]) => ({ value: code, label })),
            ]}
          />
          <p className={styles.toolbar__note}>총 {formatNumber(list.totalCount)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('devices', 'inverter'))}>
            인버터 등록
          </Button>
        </div>
      </div>

      <InverterTable list={list} />

      <ChangeHistory title="인버터 제품 변경 이력" rows={changes.rows} />
    </>
  );
}
