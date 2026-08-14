import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AiOrbit } from '@/components/common/AiOrbit';
import { CloseIcon, ExpandIcon, SearchIcon } from '@/components/common/Icon';
import { RoomClock } from '@/layouts/ControlRoomLayout/RoomClock';
import { PATH } from '@/routes/routes';
import { useFullscreen } from '@/hooks/useFullscreen';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { CUMULATIVE, PEAK_OUTPUT } from '@/mocks/generation';
import { formatNumber, scaleSi } from '@/utils/format';
import type { School } from '@/interface/energy';
import { FaultMap } from '../../components/FaultMap';
import { SCOPE_LABEL, useControlRoomData } from '../../useControlRoomData';
import styles from './WarRoom.module.scss';

/** 아래 띠를 흐르는 순위 개수 */
const TICKER_TOP = 8;

/**
 * 통합관제 상황판 · 시안 B — 다크 워룸 (SFR-004).
 *
 * 상황판에서 가장 먼저 답해야 할 물음이 "지금 어디가 어떤가" 라면, 지도를 한 칸에 가두는 것부터가
 * 손해다. 그래서 지도를 화면 전체로 깔고 숫자는 그 위에 뜨는 유리판으로 얹었다. 지도가 늘 배경에
 * 살아 있으니 어느 지표를 보다가도 눈이 위치로 돌아온다.
 *
 * 바탕을 어둡게 두는 것은 멋이 아니라 신호 대 잡음의 문제다. 관제실은 어둡고 화면은 크다 —
 * 흰 바탕이 화면의 9할을 차지하면 정작 켜져야 할 경고색이 묻힌다. 어두운 바탕에서는 색이 곧 신호다.
 */
function WarRoomPage() {
  const data = useControlRoomData();
  const [searchOpen, setSearchOpen] = useState(false);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const faults = data.rows.filter((plant) => isAbnormal(plant.status));
  const ranking = [...data.rows].sort((a, b) => b.todayKwh - a.todayKwh).slice(0, TICKER_TOP);
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const ratio = Math.max(0, Math.min(1, data.totals.outputKw / peak));
  // 도 전체를 더하면 kW 로는 자릿수가 길어 판을 넘는다 — 단위를 한 칸 올린다.
  const output = scaleSi(data.totals.outputKw, 'W');

  return (
    <div className={styles.room}>
      {/* 지도는 배경이다. 유리판 뒤에서 계속 살아 있다 */}
      <div className={styles.canvas}>
        <FaultMap plants={data.rows} scope="all" height="100%" selectable />
      </div>

      {data.alertTone ? <span className={styles.edge} data-tone={data.alertTone} aria-hidden="true" /> : null}

      <div className={styles.hud}>
        <header className={styles.top}>
          <span className={styles.brand}>
            <AiOrbit size={38} active />
            <span>
              <span className={styles.brand__title}>통합관제 상황판</span>
              <span className={styles.brand__scope}>
                {SCOPE_LABEL}
                <em className={styles.brand__variant}>시안 B · 다크 워룸</em>
              </span>
            </span>
          </span>

          <div className={styles.top__right}>
            <button type="button" className={styles.search} onClick={() => setSearchOpen(true)}>
              <SearchIcon width={16} height={16} aria-hidden />
              <span>{data.searchSummary ?? '학교·설비 검색'}</span>
            </button>

            <RoomClock />

            <button type="button" className={styles.action} onClick={toggleFullscreen}>
              <ExpandIcon width={16} height={16} />
              {isFullscreen ? '창 모드' : '전체화면'}
            </button>

            <Link to={PATH.HOME} className={styles.action}>
              <CloseIcon width={16} height={16} />
              나가기
            </Link>
          </div>
        </header>

        <div className={styles.rails}>
          {/* 왼쪽 — 지금 얼마나 내고 있는가 */}
          <aside className={styles.rail} aria-label="현재 총출력과 누적 발전량">
            <section className={styles.glass}>
              <h2 className={styles.glass__title}>현재 총출력</h2>

              <p className={styles.output}>
                <strong>{formatNumber(output.amount, output.fractionDigits)}</strong>
                <span>{output.unit}</span>
              </p>

              {/* 피크 대비 몇 할인지 — 막대 하나면 충분하다 */}
              <div className={styles.bar} role="img" aria-label={`피크 대비 ${Math.round(ratio * 100)}퍼센트`}>
                <span className={styles.bar__fill} style={{ inlineSize: `${(ratio * 100).toFixed(1)}%` }} />
              </div>
              <p className={styles.glass__note}>
                피크 {formatNumber(peak, 0)}kW 대비 {Math.round(ratio * 100)}%
              </p>
            </section>

            <section className={styles.glass}>
              <h2 className={styles.glass__title}>누적 발전량</h2>
              <dl className={styles.stack}>
                <Stat label="금일" kwh={data.totals.todayKwh} />
                <Stat label="금월" kwh={data.totals.monthKwh} />
                <Stat label="금년" kwh={data.totals.yearKwh} />
                <Stat label="전체" kwh={CUMULATIVE.totalKwh} />
              </dl>
            </section>

            <section className={styles.glass}>
              <h2 className={styles.glass__title}>수집</h2>
              <dl className={styles.stack}>
                <Line label="조회 개소" value={`${formatNumber(data.rows.length)}개소`} />
                <Line label="미수신" value={`${formatNumber(data.collection.stale.length)}개소`} tone={data.collection.stale.length > 0 ? 'caution' : undefined} />
                <Line label="품질 미달" value={`${formatNumber(data.belowThreshold)}개소`} tone={data.belowThreshold > 0 ? 'caution' : undefined} />
                <Line label="최근 수집" value={data.collection.latest.slice(11, 16)} />
              </dl>
            </section>
          </aside>

          {/* 오른쪽 — 지금 손봐야 할 것. 지도의 붉은 점이 무엇인지 여기서 이름을 얻는다 */}
          <aside className={styles.rail} aria-label="장애 발생 현황">
            <section className={`${styles.glass} ${styles.glass__grow}`}>
              <h2 className={styles.glass__title}>
                장애 발생
                <em className={styles.count} data-empty={faults.length === 0 ? '' : undefined}>
                  {formatNumber(faults.length)}
                </em>
              </h2>

              {faults.length === 0 ? (
                <p className={styles.calm}>이상 설비가 없습니다.</p>
              ) : (
                <ul className={styles.faults}>
                  {faults.map((plant) => (
                    <FaultRow key={plant.id} plant={plant} last={data.collection.byId.get(plant.id)?.lastCollectedAt} />
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>

        {/* 아래 — 오늘 잘한 곳. 급하지 않으니 흐르게 둔다 */}
        <footer className={styles.ticker} aria-label="금일 실적 순위">
          <span className={styles.ticker__label}>금일 실적</span>
          <div className={styles.ticker__track}>
            <ul className={styles.ticker__list}>
              {ranking.map((plant, index) => (
                <li key={plant.id}>
                  <em>{index + 1}</em>
                  {plant.name}
                  <b>{formatNumber(plant.todayKwh, 1)}kWh</b>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>

      <PlantSearchModal
        isOpen={searchOpen}
        filters={data.filters}
        onClose={() => setSearchOpen(false)}
        onApply={data.setFilters}
      />
    </div>
  );
}

/** 누적 한 줄 — 단위를 자동으로 줄여 자릿수가 판을 넘지 않게 한다 */
function Stat({ label, kwh }: { label: string; kwh: number }) {
  const scaled = scaleSi(kwh, 'Wh');

  return (
    <div className={styles.stack__row}>
      <dt>{label}</dt>
      <dd>
        {formatNumber(scaled.amount, scaled.fractionDigits)}
        <span>{scaled.unit}</span>
      </dd>
    </div>
  );
}

/** 값을 그대로 적는 한 줄 */
function Line({ label, value, tone }: { label: string; value: string; tone?: 'caution' }) {
  return (
    <div className={styles.stack__row}>
      <dt>{label}</dt>
      <dd data-tone={tone}>{value}</dd>
    </div>
  );
}

/** 이상 설비 한 줄 — 상태 색 띠가 왼쪽에 서서 목록을 색으로 훑게 한다 */
function FaultRow({ plant, last }: { plant: School; last?: string }) {
  const tone = OPERATION_TONE[plant.status];

  return (
    <li className={styles.fault} data-tone={tone}>
      <span className={styles.fault__name}>{plant.name}</span>
      <span className={styles.fault__state}>{OPERATION_LABEL[plant.status]}</span>
      <span className={styles.fault__meta}>
        {formatNumber(currentOutputOf(plant), 1)}kW
        {last ? ` · ${last.slice(11, 16)}` : ''}
      </span>
    </li>
  );
}

export default WarRoomPage;
