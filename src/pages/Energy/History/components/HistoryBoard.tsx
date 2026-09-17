import dayjs from 'dayjs';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ExcelIcon } from '@/components/common/Icon';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { formatNumber } from '@/utils/format';
import { useOperationChart } from '../hooks/useOperationChart';
import { useOperationExcel } from '../hooks/useOperationExcel';
import { useOperationHistory } from '../hooks/useOperationHistory';
import styles from '../History.module.scss';
import { HistoryCriteria } from './HistoryCriteria';
import { HistoryFilter } from './HistoryFilter';
import { OperationChart } from './OperationChart';
import { OperationTable } from './OperationTable';

type ViewMode = 'table' | 'chart';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'chart', label: '그래프' },
];

/**
 * 인버터별 수집주기 운전이력 (SFR-009, SFR-010).
 *
 * 좌측 조회 대상과 조회일이 함께 무엇을 볼지 정한다 — 인버터까지 좁혔으면 그 인버터, 발전소까지면
 * 첫 인버터를 편다. 두 값 모두 화면 밖에서 오므로 조회 훅이 읽어 온다.
 */
export function HistoryBoard() {
  const {
    rows, totalCount, pageCount, page, setPage,
    selected, inverterCount, plantLabel, scopeLabel, date, targetDate, cid,
  } = useOperationHistory();
  const [view, setView] = useState<ViewMode>('table');
  const chart = useOperationChart(view === 'chart' ? cid : null, targetDate);
  const { downloadExcel, isPending } = useOperationExcel();

  return (
    <div className={styles.tab}>
      <HistoryFilter trailing={<p className={styles.toolbar__count}>인버터 {formatNumber(inverterCount)}대</p>} />

      {!selected || cid === null ? (
        <Card padding="none">
          <EmptyState
            title="인버터를 골라 주세요"
            description={`${scopeLabel}에는 펼 인버터가 없습니다. 좌측 조회 대상에서 발전소나 인버터를 골라 주세요.`}
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
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<ExcelIcon />}
                  disabled={isPending || totalCount === 0}
                  onClick={() => downloadExcel({
                    cid,
                    targetDate,
                    filename: `운전이력_${plantLabel}_${selected.name}_${dayjs(date).format('YYYYMMDD')}`,
                  })}
                >
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
                <OperationTable rows={rows} threePhase={selected.phase === 'three'} />
                {/* 서버는 쪽을 0 부터 세고 이 컴포넌트는 1 부터 센다 — 그 경계가 여기다. */}
                <Pagination
                  page={page + 1}
                  pageCount={pageCount}
                  totalCount={totalCount}
                  onChange={(next) => setPage(next - 1)}
                  label="운전이력"
                />
              </>
            ) : (
              <div className={styles.chartWrap}>
                {chart.isLoading || chart.rows.length > 0 ? (
                  <OperationChart rows={chart.rows} inverterName={selected.name} />
                ) : (
                  <EmptyState title="그날 수집된 값이 없습니다" description="다른 날짜를 골라 보세요." />
                )}
              </div>
            )}
          </Card>
        </Reveal>
      )}
    </div>
  );
}
