import { FaultMap } from '@/pages/ControlRoom/components/FaultMap';
import { formatNumber, scaleSi } from '@/utils/format';
import { LiveTrendChart } from '@/pages/ControlRoom/components/LiveTrendChart';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { RegionHeatmap } from '@/pages/ControlRoom/components/RegionHeatmap';
import { TODAY } from '@/mocks/today';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../Triage.module.scss';
import { Figure } from './Figure';

/** 오른쪽 지도 높이(px) — 위치 분포만 읽으면 되므로 크게 두지 않는다 */
const MAP_HEIGHT = 230;

/** 오른쪽 — 그 밖의 전부. 한 줄에 쌓아 왼쪽에 자리를 내준다. */
export function SideColumn({ data }: { data: ControlRoomData }) {
  const output = scaleSi(data.totals.outputKw, 'W');
  const today = scaleSi(data.totals.todayKwh, 'Wh');
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const running = data.rows.filter((plant) => plant.status === 'running').length;

  return (
    <div className={styles.side}>
      <section className={styles.panel} aria-label="관내 요약">
        <div className={styles.summary}>
          <Figure label="현재 총출력" amount={output.amount} unit={output.unit} digits={output.fractionDigits}>
            피크 대비 {Math.round((data.totals.outputKw / peak) * 100)}%
          </Figure>
          <Figure label="금일 발전량" amount={today.amount} unit={today.unit} digits={today.fractionDigits}>
            등가 {formatNumber(data.stat.hours, 1)}h
          </Figure>
          <Figure label="정상 가동" amount={running} unit="개소" digits={0} tone="ok">
            전체 {formatNumber(data.rows.length)}개소
          </Figure>
        </div>
      </section>

      <section className={styles.panel} aria-label="관내 발전소 위치">
        <h2 className={styles.panel__title}>관내 위치</h2>
        <FaultMap plants={data.rows} scope="all" height={MAP_HEIGHT} selectable />
      </section>

      <section className={`${styles.panel} ${styles.panel__grow}`} aria-label="권역별 상태">
        <h2 className={styles.panel__title}>
          권역별 상태
          <span className={styles.panel__note}>칸 하나가 발전소 하나</span>
        </h2>
        <RegionHeatmap plants={data.rows} />
      </section>

      {/*
        순위는 두지 않는다.
        "오늘 어디가 잘했나" 는 이 화면의 물음이 아니다 — 다섯 판을 욱여넣으면 권역 히트맵이
        눌려 정작 답해야 할 "어디가 아픈가" 가 흐려진다. 순위는 다른 시안이 답한다.
      */}
      <section className={styles.panel} aria-label="시간대별 발전량">
        <h2 className={styles.panel__title}>시간대별 발전량</h2>
        <LiveTrendChart date={TODAY.toDate()} />
      </section>
    </div>
  );
}
