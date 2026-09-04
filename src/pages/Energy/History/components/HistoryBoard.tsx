import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ExcelIcon } from '@/components/common/Icon';
import { getInverters } from '@/mocks/equipment';
import { getOperationRaw, sortRawDesc } from '@/mocks/operationRaw';
import { MSG } from '@/configs/messages';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { exportCsv } from '@/utils/export';
import { toast } from '@/stores/toastStore';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import { formatNumber } from '@/utils/format';
import styles from '../History.module.scss';
import { HistoryCriteria } from './HistoryCriteria';
import { HistoryFilter } from './HistoryFilter';
import { HISTORY_CSV_COLUMNS } from './historyCsv';
import { OperationChart } from './OperationChart';
import { OperationTable } from './OperationTable';

/** 한 화면에 펼 계측 줄 수 — 하루치는 수백 건이라 나눠 본다 */
const PAGE_SIZE = 30;

type ViewMode = 'table' | 'chart';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'chart', label: '그래프' },
];

/**
 * 인버터별 통신주기 운전이력 (SFR-009, SFR-010).
 *
 * 좌측 조회 대상과 조회일이 함께 무엇을 볼지 정한다 — 인버터까지 좁혔으면 그 인버터, 발전소까지면
 * 첫 인버터를 편다. 두 값 모두 화면 밖(조회 대상 트리·날짜 필터)에서 오므로 여기서 읽어 온다.
 */
export function HistoryBoard() {
  const { plant, inverter, label } = usePlantScope();
  const [date] = useCollectionDate();
  const [view, setView] = useState<ViewMode>('table');
  // 쪽은 조회 대상·날짜에 묶어 둔다 — 대상이 바뀌면 저절로 첫 쪽으로 돌아간다.
  const [pageState, setPageState] = useState({ key: '', page: 1 });

  const inverters = useMemo(() => getInverters(plant?.id ?? null), [plant?.id]);
  const selected = inverter ?? inverters[0] ?? null;

  const rows = useMemo(
    () => (selected ? sortRawDesc(getOperationRaw(selected, date)) : []),
    [selected, date],
  );

  const pageKey = `${selected?.id ?? ''}-${dayjs(date).format('YYYYMMDD')}`;
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(pageState.key === pageKey ? pageState.page : 1, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const plantLabel = plant?.name ?? label;

  const download = () => {
    if (!selected || rows.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    const filename = `운전이력_${plantLabel}_${selected.name}_${dayjs(date).format('YYYYMMDD')}`;

    exportCsv(filename, HISTORY_CSV_COLUMNS, rows);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <div className={styles.tab}>
      <HistoryFilter trailing={<p className={styles.toolbar__count}>인버터 {formatNumber(inverters.length)}대</p>} />

      {!selected ? (
        <Card padding="none">
          <EmptyState
            title="인버터를 골라 주세요"
            description={`${label}에는 펼 인버터가 없습니다. 좌측 조회 대상에서 발전소나 인버터를 골라 주세요.`}
          />
        </Card>
      ) : (
        <Reveal delay={0.1}>
          <Card
            title={`${plantLabel} · ${selected.name} · 운전이력`}
            description="수집주기마다 올라온 계측값을 그대로 폅니다. 값이 빠졌거나 이상한 줄은 배경색을 다르게 표시했습니다."
            action={(
              <div className={styles.actions}>
                <SegmentedControl label="보기 방식" size="sm" options={VIEW_OPTIONS} value={view} onChange={setView} />
                <Button variant="secondary" size="sm" iconLeft={<ExcelIcon />} onClick={download}>
                  엑셀 내려받기
                </Button>
              </div>
            )}
            padding="none"
          >
            <HistoryCriteria date={date} plantLabel={plantLabel} inverter={selected} />

            {/* 표는 한 줄씩 확인하는 자리, 그래프는 하루의 모양을 보는 자리다 (SFR-010-03/04) */}
            {view === 'table' ? (
              <>
                <OperationTable rows={pageRows} threePhase={selected.phase === 'three'} />
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
                  totalCount={rows.length}
                  onChange={(next) => setPageState({ key: pageKey, page: next })}
                  label="운전이력"
                />
              </>
            ) : (
              <div className={styles.chartWrap}>
                {/* 그래프는 하루 전체를 시간 순으로 본다 — 표처럼 최신순으로 자르지 않는다 */}
                <OperationChart rows={[...rows].reverse()} inverterName={selected.name} />
              </div>
            )}
          </Card>
        </Reveal>
      )}
    </div>
  );
}
