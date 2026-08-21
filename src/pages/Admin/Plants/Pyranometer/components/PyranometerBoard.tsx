import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { DeviceHistory } from '@/pages/Admin/_shared/device/DeviceHistory';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import styles from '@/pages/Admin/Admin.module.scss';
import { usePyranometerRows } from '../hooks/usePyranometerRows';
import { PyranometerTable } from './PyranometerTable';

/**
 * 일사량계(환경센서) 관리 (SFR-016-01/05) — 발전소마다 한 대가 기본이다.
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function PyranometerBoard() {
  const allRows = usePyranometerRows();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.name.includes(trimmed)
        || row.rtuCommId.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={setKeyword}
            placeholder="일사량계명·RTU 통신ID 로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'pyranometer'))}>
            일사량계 등록
          </Button>
        </div>
      </div>

      <PyranometerTable rows={rows} />

      <DeviceHistory kind="pyranometer" keyword={keyword} title="일사량계 변경 이력" />
    </>
  );
}
