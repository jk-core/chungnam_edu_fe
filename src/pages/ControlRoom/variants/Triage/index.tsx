import { useMemo, useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { isAbnormal, OPERATION_DESCRIPTION, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { TODAY } from '@/mocks/today';
import { formatNumber, scaleSi } from '@/utils/format';
import type { AlertRecord } from '@/interface/alert';
import type { School } from '@/interface/energy';
import { FaultMap } from '../../components/FaultMap';
import { LiveTrendChart } from '../../components/LiveTrendChart';
import { RegionHeatmap } from '../../components/RegionHeatmap';
import { SCOPE_LABEL, useControlRoomData } from '../../useControlRoomData';
import styles from './Triage.module.scss';

/** 오른쪽 지도 높이(px) — 위치 분포만 읽으면 되므로 크게 두지 않는다 */
const MAP_HEIGHT = 230;

/**
 * 통합관제 상황판 · 시안 C — 트리아지 보드 (SFR-004).
 *
 * 앞의 시안들은 화면을 **데이터 종류** 로 나눈다 — 여기는 지도, 여기는 순위, 여기는 집계.
 * 이 시안은 **급함** 으로 나눈다. 손봐야 할 것이 화면의 절반을 차지하고, 나머지 전부가 오른쪽
 * 한 줄로 밀려난다. 정상인 것은 숫자 한 칸이면 충분하고, 이상한 것은 카드 한 장을 얻는다.
 *
 * 그래서 이 화면은 조용할 때와 바쁠 때의 생김새가 다르다 — 카드가 몇 장인지가 곧 오늘의 부담이고,
 * 한 장도 없으면 왼쪽이 통째로 "이상 없음" 이 된다. 훑어보는 사람이 세지 않아도 되는 것이 요점이다.
 */
function TriagePage() {
  const data = useControlRoomData();
  const [searchOpen, setSearchOpen] = useState(false);

  const faults = useMemo(() => data.rows.filter((plant) => isAbnormal(plant.status)), [data.rows]);

  // 카드에 붙일 경보 한 건 — 같은 발전소의 가장 최근 것을 고른다.
  const alertOf = useMemo(() => {
    const map = new Map<string, AlertRecord>();

    data.openAlerts.forEach((alert) => {
      if (!map.has(alert.schoolId)) map.set(alert.schoolId, alert);
    });

    return map;
  }, [data.openAlerts]);

  const output = scaleSi(data.totals.outputKw, 'W');
  const today = scaleSi(data.totals.todayKwh, 'Wh');
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const running = data.rows.filter((plant) => plant.status === 'running').length;

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel="시안 C · 트리아지 보드"
      alertTone={data.alertTone}
      onSearch={() => setSearchOpen(true)}
      searchSummary={data.searchSummary}
    >
      <div className={styles.board}>
        {/*
          왼쪽 — 손봐야 할 것. 이 화면의 주어다.
          제목 옆의 큰 숫자가 곧 오늘의 부담이라, 아래 카드를 세지 않아도 규모가 먼저 읽힌다.
        */}
        <section className={styles.triage} aria-label="지금 손봐야 할 설비">
          <header className={styles.triage__head}>
            <h2 className={styles.triage__title}>
              지금 손봐야 할 설비
              <em data-empty={faults.length === 0 ? '' : undefined}>{formatNumber(faults.length)}</em>
            </h2>
            <span className={styles.triage__note}>
              미처리 경보 {formatNumber(data.openAlerts.length)}건 · 미수신 {formatNumber(data.collection.stale.length)}개소
            </span>
          </header>

          {faults.length === 0 ? (
            <p className={styles.calm}>
              <strong>관내 이상 설비가 없습니다</strong>
              {formatNumber(data.rows.length)}개소 전부 정상 범위에서 발전 중입니다.
            </p>
          ) : (
            <ul className={styles.cards}>
              {faults.map((plant) => (
                <FaultCard
                  key={plant.id}
                  plant={plant}
                  alert={alertOf.get(plant.id)}
                  lastCollectedAt={data.collection.byId.get(plant.id)?.lastCollectedAt}
                />
              ))}
            </ul>
          )}
        </section>

        {/* 오른쪽 — 그 밖의 전부. 한 줄에 쌓아 왼쪽에 자리를 내준다 */}
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

/**
 * 이상 설비 한 장.
 *
 * 이름과 상태만 적으면 목록이지 카드가 아니다. 조치하러 가는 사람이 묻는 것 — 어디인가,
 * 얼마나 못 내고 있나, 마지막으로 값이 언제 들어왔나, 무슨 경보가 떠 있나 — 를 한 장에 담는다.
 */
function FaultCard({
  plant,
  alert,
  lastCollectedAt,
}: {
  plant: School;
  alert?: AlertRecord;
  lastCollectedAt?: string;
}) {
  const output = currentOutputOf(plant);
  // 설비용량 대비 지금 얼마나 내고 있는지. 떨어진 폭이 곧 급함의 크기다.
  const ratio = plant.capacityKw > 0 ? Math.max(0, Math.min(1, output / plant.capacityKw)) : 0;

  return (
    <li className={styles.card} data-tone={OPERATION_TONE[plant.status]}>
      <header className={styles.card__head}>
        <h3 className={styles.card__name}>{plant.name}</h3>
        <span className={styles.card__state}>{OPERATION_LABEL[plant.status]}</span>
      </header>

      <p className={styles.card__where}>{plant.regionName} · 인버터 {formatNumber(plant.inverterCount)}대</p>

      <p className={styles.card__output}>
        <strong>{formatNumber(output, 1)}</strong>
        <span>kW / {formatNumber(plant.capacityKw, 1)}kW</span>
      </p>

      <div className={styles.card__bar} role="img" aria-label={`설비용량 대비 ${Math.round(ratio * 100)}퍼센트`}>
        <span style={{ inlineSize: `${(ratio * 100).toFixed(1)}%` }} />
      </div>

      <p className={styles.card__why}>{alert?.title ?? OPERATION_DESCRIPTION[plant.status]}</p>

      <footer className={styles.card__foot}>
        {alert ? <span>{alert.occurredAt.slice(5, 16)} 발생</span> : null}
        {lastCollectedAt ? <span>최근 수집 {lastCollectedAt.slice(11, 16)}</span> : null}
      </footer>
    </li>
  );
}

/** 오른쪽 요약의 숫자 한 칸 */
function Figure({
  label,
  amount,
  unit,
  digits,
  tone,
  children,
}: {
  label: string;
  amount: number;
  unit: string;
  digits: number;
  tone?: 'ok';
  children: React.ReactNode;
}) {
  return (
    <div className={styles.figure} data-tone={tone}>
      <span className={styles.figure__label}>{label}</span>
      <p className={styles.figure__value}>
        {formatNumber(amount, digits)}
        <span>{unit}</span>
      </p>
      <span className={styles.figure__note}>{children}</span>
    </div>
  );
}

export default TriagePage;
