import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ExcelIcon } from '@/components/common/Icon';
import { getInverters } from '@/mocks/equipment';
import { getOperationRaw, RAW_STATE_LABEL, sortRawDesc } from '@/mocks/operationRaw';
import { getRtuOf } from '@/mocks/rtu';
import { OPERATION_LABEL, OPERATION_TONE, RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { Pagination } from '@/components/common/Pagination';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { exportCsv } from '@/utils/export';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { CsvColumn } from '@/utils/export';
import type { OperationRaw } from '@/interface/operation';

import { OperationChart } from './components/OperationChart';
import { HistoryFilter } from './components/HistoryFilter';
import { OperationTable } from './components/OperationTable';
import styles from './History.module.scss';

/** 한 화면에 펼 계측 줄 수 — 하루치는 수백 건이라 나눠 본다. */
type ViewMode = 'table' | 'chart';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'chart', label: '그래프' },
];

const PAGE_SIZE = 30;

/**
 * 인버터별 통신주기 운전이력 (SFR-009, SFR-010).
 * 인버터를 골라 전압·전류·전력 기록을 그래프나 표로 보고 엑셀로 내려받는다.
 */
function HistoryPage() {
  const { plant, inverter, label } = usePlantScope();
  const [date] = useCollectionDate();
  // 페이지는 조회 대상·날짜에 묶어 둔다. 대상이 바뀌면 저절로 첫 쪽으로 돌아간다.
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const [view, setView] = useState<ViewMode>('table');

  const inverters = useMemo(() => getInverters(plant?.id ?? null), [plant?.id]);
  // 좌측 조회 대상에서 인버터까지 좁혔으면 그 인버터, 발전소까지면 첫 인버터를 편다.
  const selected = inverter ?? inverters[0] ?? null;

  const raw = useMemo(() => (selected ? sortRawDesc(getOperationRaw(selected, date)) : []), [selected, date]);

  const pageKey = `${selected?.id ?? ''}-${dayjs(date).format('YYYYMMDD')}`;
  const page = pageState.key === pageKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: pageKey, page: next });

  const pageCount = Math.max(1, Math.ceil(raw.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = raw.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const plantLabel = plant?.name ?? label;
  const rtu = plant ? getRtuOf(plant.id) : null;
  const interval = rtu?.intervalMinutes ?? null;
  const intervalLabel = interval ? `${interval}분 · 하루 ${formatNumber(raw.length)}건` : `하루 ${formatNumber(raw.length)}건`;

  const csvColumns: CsvColumn<OperationRaw>[] = [
    { header: '수집일시', value: (row) => row.at },
    { header: '데이터상태', value: (row) => RAW_STATE_LABEL[row.state] },
    { header: '누적발전량(Wh)', value: (row) => row.accumWh },
    { header: '일사량(W/m2)', value: (row) => row.irradiance ?? '' },
    { header: '모듈온도(C)', value: (row) => row.moduleTemp ?? '' },
    { header: '인버터온도(C)', value: (row) => row.inverterTemp ?? '' },
    { header: '입력전압(V)', value: (row) => row.dcVolt ?? '' },
    { header: '입력전류(A)', value: (row) => row.dcAmp ?? '' },
    { header: '입력전력(W)', value: (row) => row.dcWatt ?? '' },
    { header: '출력전압 R-S(V)', value: (row) => row.acVoltRS ?? row.acVolt ?? '' },
    { header: '출력전압 S-T(V)', value: (row) => row.acVoltST ?? '' },
    { header: '출력전압 T-R(V)', value: (row) => row.acVoltTR ?? '' },
    { header: '출력전류 R(A)', value: (row) => row.acAmpR ?? row.acAmp ?? '' },
    { header: '출력전류 S(A)', value: (row) => row.acAmpS ?? '' },
    { header: '출력전류 T(A)', value: (row) => row.acAmpT ?? '' },
    { header: '출력전력(W)', value: (row) => row.acWatt ?? '' },
    { header: '주파수(Hz)', value: (row) => row.frequency ?? '' },
    { header: '역률(%)', value: (row) => row.powerFactor ?? '' },
  ];

  const download = () => {
    if (!selected || raw.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    const filename = `운전이력_${plant?.name ?? '충남전체'}_${selected.name}_${dayjs(date).format('YYYYMMDD')}`;

    exportCsv(filename, csvColumns, raw);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <div className={styles.tab}>
      <HistoryFilter trailing={<p className={styles.toolbar__count}>인버터 {inverters.length}대</p>} />

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
            eyebrow="History"
            title={`${plantLabel} · ${selected.name} · 운전이력`}
            description="수집주기마다 올라온 계측값을 그대로 폅니다. 결측·이상 줄은 배경으로 갈라 두었습니다."
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
            <div className={styles.criteria} aria-label="조회 기준">
              <span className={styles.criteria__label}>조회 기준</span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>기간</span>
                <span className={styles.criteria__value}>{dayjs(date).format('YYYY-MM-DD')}</span>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>발전소</span>
                <span className={styles.criteria__value}>{plantLabel}</span>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>인버터</span>
                <span className={styles.criteria__value}>{selected.name}</span>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>수집주기</span>
                <span className={styles.criteria__value}>{intervalLabel}</span>
              </span>
              {/*
                통신상태와 인버터 상태를 함께 적는다 (SFR-009-01/03).
                계측이 비어 있을 때 인버터가 선 것인지 RTU가 끊긴 것인지 여기서 갈린다.
              */}
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>통신상태</span>
                <Badge tone={RTU_TONE[rtu?.status ?? 'normal']} withDot>
                  {RTU_LABEL[rtu?.status ?? 'normal']}
                </Badge>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>인버터 상태</span>
                <Badge tone={OPERATION_TONE[selected.ownStatus]} withDot>
                  {OPERATION_LABEL[selected.ownStatus]}
                </Badge>
              </span>
            </div>

            {/* 표는 한 줄씩 확인하는 자리, 그래프는 하루의 모양을 보는 자리다 (SFR-010-03/04). */}
            {view === 'table' ? (
              <OperationTable rows={pageRows} threePhase={selected.phase === 'three'} />
            ) : (
              <div className={styles.chartWrap}>
                {/* 그래프는 하루 전체를 시간 순으로 본다 — 표처럼 최신순으로 자르지 않는다. */}
                <OperationChart rows={[...raw].reverse()} inverterName={selected.name} />
              </div>
            )}

            {view === 'table' ? (
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={raw.length}
                onChange={setPage}
                label="운전이력"
              />
            ) : null}
          </Card>
        </Reveal>
      )}
    </div>
  );
}

export default HistoryPage;
