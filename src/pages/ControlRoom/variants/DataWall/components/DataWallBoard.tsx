import { useState } from 'react';
import { AggregationPanel } from '@/pages/ControlRoom/components/AggregationPanel';
import { CollectionHealth } from '@/pages/ControlRoom/components/CollectionHealth';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { FaultList } from '@/pages/ControlRoom/components/FaultList';
import { FaultMap } from '@/pages/ControlRoom/components/FaultMap';
import { formatNumber } from '@/utils/format';
import { LiveTrendChart } from '@/pages/ControlRoom/components/LiveTrendChart';
import { MissingInverters } from '@/pages/ControlRoom/components/MissingInverters';
import { OutputGauge } from '@/pages/ControlRoom/components/OutputGauge';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { RankingStrip } from '@/pages/ControlRoom/components/RankingStrip';
import { RegionHeatmap } from '@/pages/ControlRoom/components/RegionHeatmap';
import { SCOPE_LABEL, useControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import { TODAY } from '@/mocks/today';
import styles from '../DataWall.module.scss';
import { Cell } from './Cell';
import { EnergyFigures } from './EnergyFigures';
import { StateBreakdown } from './StateBreakdown';

/**
 * 벽 하나를 세운다.
 * 열한 판이 같은 한 벌을 봐야 하므로 조회는 여기서 한 번만 하고 각 판에 나눠 준다.
 */
export function DataWallBoard() {
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel="시안 D · 데이터 월"
      alertTone={data.alertTone}
      onSearch={() => setIsSearchOpen(true)}
      searchSummary={data.searchSummary}
    >
      <div className={styles.wall}>
        <Cell
          title="현재 총출력"
          note={`피크 ${formatNumber(peak, 0)}kW 대비 ${Math.round((data.totals.outputKw / peak) * 100)}%`}
        >
          <OutputGauge outputKw={data.totals.outputKw} capacityKw={data.totals.capacityKw} />
        </Cell>

        <Cell title="발전량" note={`발전시간 ${formatNumber(data.stat.hours, 1)}h`}>
          <EnergyFigures totals={data.totals} />
        </Cell>

        <Cell title="운영 상태" note={`${formatNumber(data.rows.length)}개소`}>
          <StateBreakdown plants={data.rows} abnormalCount={data.abnormalCount} />
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
        <Cell title="관내 발전소 위치" note={`이상 ${formatNumber(data.abnormalCount)}개소`} wide>
          <FaultMap plants={data.rows} scope="all" height="100%" selectable />
        </Cell>

        <Cell title="권역별 상태" note="칸 하나가 발전소 하나">
          <RegionHeatmap plants={data.rows} />
        </Cell>

        <Cell title="시간대별 발전량" note="권역 집계">
          <LiveTrendChart date={TODAY.toDate()} />
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
        isOpen={isSearchOpen}
        filters={data.filters}
        onClose={() => setIsSearchOpen(false)}
        onApply={data.setFilters}
      />
    </ControlRoomLayout>
  );
}
