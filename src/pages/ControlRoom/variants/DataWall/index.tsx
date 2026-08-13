import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { CUMULATIVE, PEAK_OUTPUT } from '@/mocks/generation';
import { TODAY } from '@/mocks/today';
import { formatNumber, scaleSi } from '@/utils/format';
import type { OperationStatus } from '@/interface/status';
import { AggregationPanel } from '../../components/AggregationPanel';
import { CollectionHealth } from '../../components/CollectionHealth';
import { FaultList } from '../../components/FaultList';
import { FaultMap } from '../../components/FaultMap';
import { LiveTrendChart } from '../../components/LiveTrendChart';
import { MissingInverters } from '../../components/MissingInverters';
import { OutputGauge } from '../../components/OutputGauge';
import { RankingStrip } from '../../components/RankingStrip';
import { RegionHeatmap } from '../../components/RegionHeatmap';
import { SCOPE_LABEL, useControlRoomData } from '../../useControlRoomData';
import styles from './DataWall.module.scss';
import type { ReactNode } from 'react';

/** 상태 막대에 세울 결 — 정상부터 끊긴 것까지 다섯 */
const STATES: OperationStatus[] = ['running', 'ready', 'degraded', 'fault', 'commLost'];

/**
 * 통합관제 상황판 · 시안 D — 데이터 월 (SFR-004).
 *
 * 앞의 시안들은 무엇을 크게 볼지 골랐다 — A 는 지도, B 도 지도, C 는 장애. 고른다는 것은
 * 나머지를 작게 두거나 접는다는 뜻이고, 지켜보는 사람이 그 판단에 동의하지 않으면 화면이 답답해진다.
 *
 * 이 시안은 고르지 않는다. 아홉 개 판을 **같은 크기로** 깔아 전부를 한 화면에 세운다.
 * 눈이 어디로 가든 막히지 않고, 무엇이 중요한지는 화면이 아니라 보는 사람이 정한다.
 * 대신 판 하나하나는 작다 — 각 판이 답하는 물음을 하나로 좁혀야 이 구성이 성립한다.
 */
function DataWallPage() {
  const data = useControlRoomData();
  const [searchOpen, setSearchOpen] = useState(false);

  const today = scaleSi(data.totals.todayKwh, 'Wh');
  const total = scaleSi(CUMULATIVE.totalKwh, 'Wh');
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const counts = STATES.map((status) => ({
    status,
    count: data.rows.filter((plant) => plant.status === status).length,
  })).filter((item) => item.count > 0);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel="시안 D · 데이터 월"
      alertTone={data.alertTone}
      onSearch={() => setSearchOpen(true)}
      searchSummary={data.searchSummary}
    >
      <div className={styles.wall}>
        <Cell title="현재 총출력" note={`피크 ${formatNumber(peak, 0)}kW 대비 ${Math.round((data.totals.outputKw / peak) * 100)}%`}>
          <OutputGauge outputKw={data.totals.outputKw} capacityKw={data.totals.capacityKw} />
        </Cell>

        <Cell title="발전량" note={`등가 발전시간 ${formatNumber(data.stat.hours, 1)}h`}>
          <div className={styles.figures}>
            <Figure label="금일" amount={today.amount} unit={today.unit} digits={today.fractionDigits} big />
            <Figure label="금월" amount={data.totals.monthKwh / 1000} unit="MWh" digits={1} />
            <Figure label="금년" amount={data.totals.yearKwh / 1_000_000} unit="GWh" digits={2} />
            <Figure label="누적" amount={total.amount} unit={total.unit} digits={total.fractionDigits} />
          </div>
        </Cell>

        {/*
          상태 분포.
          숫자만 적으면 정상 아흔둘과 이상 스물아홉의 비율이 안 잡힌다 — 한 줄짜리 막대가
          그 비율을 자리로 보여 주고, 아래 표가 그 자리에 이름을 붙인다.
        */}
        <Cell title="운영 상태" note={`${formatNumber(data.rows.length)}개소`}>
          <div className={styles.states}>
            <div className={styles.states__bar} role="img" aria-label={`${formatNumber(data.rows.length)}개소 중 이상 ${formatNumber(data.abnormalCount)}개소`}>
              {counts.map(({ status, count }) => (
                <span
                  key={status}
                  data-tone={OPERATION_TONE[status]}
                  style={{ flexGrow: count }}
                />
              ))}
            </div>

            <dl className={styles.states__list}>
              {counts.map(({ status, count }) => (
                <div key={status} data-tone={OPERATION_TONE[status]}>
                  <dt>
                    <span aria-hidden="true" />
                    {OPERATION_LABEL[status]}
                  </dt>
                  <dd>{formatNumber(count)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Cell>

        <Cell title="수집 연동" note={`미수신 ${formatNumber(data.collection.stale.length)}개소`}>
          <CollectionHealth
            rows={data.collection.rows}
            belowThreshold={data.belowThreshold}
            collectedAt={data.collection.latest}
            isStale={data.collection.stale.length > 0}
          />
        </Cell>

        {/* 지도는 두 칸을 쓴다 — 한 칸에 넣으면 도 모양이 뭉개져 위치를 못 읽는다 */}
        <Cell
          title="관내 발전소 위치"
          note={`이상 ${formatNumber(data.abnormalCount)}개소`}
          wide
        >
          <FaultMap plants={data.rows} scope="all" height="100%" selectable />
        </Cell>

        <Cell title="권역별 상태" note="칸 하나가 발전소 하나">
          <RegionHeatmap plants={data.rows} />
        </Cell>

        <Cell title="시간대별 발전량" note="권역 집계">
          <LiveTrendChart schools={data.rows} date={TODAY.toDate()} />
        </Cell>

        <Cell title="금일 실적 순위" note="상위 5개소">
          <RankingStrip schools={data.rows} />
        </Cell>

        <Cell title="장애 발생 현황" note={`미처리 경보 ${formatNumber(data.openAlerts.length)}건`}>
          <FaultList plants={data.rows} collection={data.collection.byId} />
        </Cell>

        <Cell title="발전 현황 집계" note="발전소·학교급·권역">
          <AggregationPanel schools={data.rows} />
        </Cell>

        {/* 수집 판이 "몇 대가 안 들어오나" 를 답했으면, 여기서는 "어느 인버터인가" 를 답한다 */}
        <Cell title="미수신 인버터" note="최근 수신 시각 기준">
          <MissingInverters plantIds={data.plantIds} collection={data.collection.byId} />
        </Cell>
      </div>

      <PlantSearchModal
        isOpen={searchOpen}
        filters={data.filters}
        onClose={() => setSearchOpen(false)}
        onApply={data.setFilters}
      />
    </ControlRoomLayout>
  );
}

/** 벽을 이루는 판 하나. 크기가 같아야 벽이므로 바깥에서 크기를 정하지 않는다 */
function Cell({
  title,
  note,
  wide,
  children,
}: {
  title: string;
  note?: string;
  /** 지도처럼 한 칸으로는 읽히지 않는 것만 두 칸을 쓴다 */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={wide ? `${styles.cell} ${styles['cell--wide']}` : styles.cell} aria-label={title}>
      <header className={styles.cell__head}>
        <h2 className={styles.cell__title}>{title}</h2>
        {note ? <span className={styles.cell__note}>{note}</span> : null}
      </header>

      <div className={styles.cell__body}>{children}</div>
    </section>
  );
}

/** 발전량 판의 숫자 한 칸 */
function Figure({
  label,
  amount,
  unit,
  digits,
  big,
}: {
  label: string;
  amount: number;
  unit: string;
  digits: number;
  big?: boolean;
}) {
  return (
    <div className={big ? `${styles.figure} ${styles['figure--big']}` : styles.figure}>
      <span className={styles.figure__label}>{label}</span>
      <p className={styles.figure__value}>
        {formatNumber(amount, digits)}
        <span>{unit}</span>
      </p>
    </div>
  );
}

export default DataWallPage;
