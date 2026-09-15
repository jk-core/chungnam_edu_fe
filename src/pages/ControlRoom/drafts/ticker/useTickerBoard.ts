import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { aggregate, AXIS_OPTIONS } from '../../utils/aggregate';
import { PERIOD_OPTIONS } from './utils/series';
import type { TickerPeriod } from './utils/series';
import type { AggregationRow, Axis } from '../../utils/aggregate';
import type { ControlRoomData } from '../../useControlRoomData';

/*
  자동 전환은 겹을 셋 겹친다 — 대상(가장 빠름)·기간·축(가장 느림). 주기를 일부러 서로 어긋나게
  잡는다(6·9·21초): 배수 관계로 맞물리면 셋이 한 박자에 함께 바뀌어 화면이 통째로 깜빡이는 것처럼
  보이기 때문이다. 21 은 6·9 어느 것의 배수도 아니고 9 도 6 의 배수가 아니라, 겹칠 때가 드물다.
  각 전환 자체는 짧게(0.2~0.4초) 끝나고 멈춰 서므로, 걸어 두고 멀리서 읽는 눈이 흔들리지 않는다.
*/
/** 대상 하나에 머무는 시간(ms). FaultMap(7초)과 비슷하게, 값 하나를 읽고 넘어갈 만큼 둔다. */
const TOUR_MS = 6_000;

/** 차트 기간(시간대·일·월)이 한 눈금에 머무는 시간(ms) — 대상보다 느리게 넘긴다. */
const PERIOD_MS = 9_000;

/** 축(학교·기관·지역)이 한 바퀴에 머무는 시간(ms) — 가장 느리게, 목록 전체가 갈리므로 뜸하게. */
const AXIS_MS = 21_000;

/** 손을 뗀 뒤 다시 돌기까지 기다리는 시간(ms). 스크롤하다 잠깐 멈춘 것을 곧바로 빼앗지 않는다. */
const IDLE_MS = 12_000;

/** 자동 전환이 도는 차례. 지금 값에서 다음 값을 집어 낸다. */
const PERIOD_CYCLE = PERIOD_OPTIONS.map((option) => option.value);
const AXIS_CYCLE = AXIS_OPTIONS.map((option) => option.value);

/** 차례에서 다음 칸을 집는다(끝이면 처음으로). */
function nextIn<T>(cycle: T[], current: T): T {
  const at = cycle.indexOf(current);

  return cycle[(at + 1) % cycle.length];
}

/** 발전시간(효율)까지 얹은 집계 한 줄 — 목록과 상세가 같은 값을 본다. */
export interface TickerRow extends AggregationRow {
  /** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
  hours: number;
  /** 도 평균 발전시간 대비 차이(h) — 오름/내림 색의 근거 */
  deltaHours: number;
  /** 올해 누적 발전량(kWh) 합 */
  yearKwh: number;
  /** 이용률(0~1) — 개소별 이용률의 단순 평균 (시안 A 의 YieldPanel 과 같은 셈) */
  utilization: number;
}

export interface TickerBoard {
  axis: Axis;
  setAxis: (axis: Axis) => void;
  /** 차트 기간(시간대·일·월). 상세 판이 그리고, 자동 전환이 스스로 넘긴다. */
  period: TickerPeriod;
  setPeriod: (period: TickerPeriod) => void;
  rows: TickerRow[];
  /** 도 전체(설비용량 가중) 평균 발전시간 */
  averageHours: number;
  selected: TickerRow | undefined;
  /** 고른 대상의 순위(0부터). 없으면 0 */
  selectedIndex: number;
  selectKey: (key: string) => void;
  /** 스크롤 등 사람의 손길 — 선택은 그대로 두고 순회만 잠시 붙잡는다 */
  holdTour: () => void;
  /** 사람이 정한 정지/재생 상태 */
  isPlaying: boolean;
  togglePlay: () => void;
}

export const AXIS_NOUN: Record<Axis, string> = {
  plant: '학교',
  level: '기관',
  region: '지역',
};

/**
 * 시세판 한 벌의 상태와 셈.
 *
 * 목록(왼쪽)과 상세(오른쪽)가 **같은 축·같은 선택·같은 순위**를 봐야 하므로, 상위(`index.tsx`)가
 * 이 훅 하나를 부르고 결과를 두 판에 통째로 내린다.
 *
 * 순회가 멈추는 까닭은 둘이고 서로 다른 것이라 따로 쥔다 (FaultMap 과 같은 이치). `isPlaying`
 * 은 사람이 단추로 정한 것이고, `isHeld` 는 스크롤하거나 줄을 고르는 동안 잠시 붙잡아 두는
 * 것이다 — 붙잡은 것은 손을 뗀 뒤 IDLE_MS 가 지나면 저절로 풀려 다시 돈다(벽에 걸어 두는
 * 화면이라, 지나가다 만진 뒤에는 스스로 제자리로 돌아와야 한다). 하나로 묶으면 잠깐 만진 것이
 * 「정지」로 굳어 다시 돌지 않는다.
 */
export function useTickerBoard(data: ControlRoomData): TickerBoard {
  // 감소 모션이 켜져 있으면 자동 전환도 멈춘다 — 걸어 두고 보는 화면에서 흔들림을 싫어하는
  // 사용자의 설정이라, 애니메이션뿐 아니라 스스로 넘기는 것까지 함께 끈다.
  const reduceMotion = useReducedMotion();

  const [axis, setAxisState] = useState<Axis>('region');
  const [period, setPeriodState] = useState<TickerPeriod>('hour');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHeld, setIsHeld] = useState(false);

  // 순회가 서 있는 자리. 이전 useRegionTour(벽시계 공유)를 쓰지 않는 것은, 이 화면은 판 하나뿐이라
  // 시계를 나눌 상대가 없고, 붙잡음·손넘김을 직접 쥐어야 스크롤과 맞물리기 때문이다.
  const [cursor, setCursor] = useState(0);

  const idleTimer = useRef<number | undefined>(undefined);

  /*
    오름/내림의 기준이 되는 도 평균 발전시간.

    목록 줄과 같은 출처(현재 조회된 발전소)로 셈해야 한다 — 지역 마스터로 잡으면 출처가 갈려,
    학교에서 집계한 줄들이 죄다 그 평균 아래로 쏠린다. 조회된 전체 발전량을 설비용량으로 나눈
    가중 평균이라, 어느 축으로 묶어도 위아래가 이 값 둘레로 갈린다.
  */
  const averageHours = data.totals.capacityKw > 0
    ? data.totals.todayKwh / data.totals.capacityKw
    : 0;

  const rows = useMemo<TickerRow[]>(() => {
    /*
      aggregate 는 yearKwh·이용률을 셈하지 않는다(공유 자산이라 손대지 않는다). 같은 축 기준으로
      한 번 더 묶어 얹는다 — 키는 aggregate 와 같은 규칙(학교=id, 기관=학교급, 지역=지역명)이라
      두 집계가 같은 줄을 가리킨다.
    */
    const extra = new Map<string, { yearKwh: number; utilSum: number; count: number }>();

    data.rows.forEach((school) => {
      const key = axis === 'plant' ? school.id : axis === 'level' ? school.level : school.regionName;
      const bucket = extra.get(key) ?? { yearKwh: 0, utilSum: 0, count: 0 };

      bucket.yearKwh += school.yearKwh;
      bucket.utilSum += school.utilization;
      bucket.count += 1;
      extra.set(key, bucket);
    });

    return aggregate(data.rows, axis)
      .map((row) => {
        const hours = row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
        const bucket = extra.get(row.key);

        return {
          ...row,
          hours,
          deltaHours: hours - averageHours,
          yearKwh: bucket?.yearKwh ?? 0,
          utilization: bucket && bucket.count > 0 ? bucket.utilSum / bucket.count : 0,
        };
      })
      // 발전량이 아니라 발전시간(효율)으로 세운다 — 발전량으로 세우면 큰 지역이 늘 위라 순위가
      // 곧 개소 수가 되고, 「오늘 어디가 잘 냈나」에 답하지 못한다.
      .sort((a, b) => b.hours - a.hours);
  }, [data.rows, axis, averageHours]);

  const count = rows.length;
  const selectedIndex = count > 0 ? cursor % count : 0;
  const selected = rows[selectedIndex];

  // 세 겹의 자동 전환이 함께 서고 함께 돈다 — 사람이 정지했거나(isPlaying) 손대는 중이거나(isHeld)
  // 감소 모션이면 전부 멈춘다. 대상만 후보가 하나뿐일 때(count<=1) 따로 접는다.
  const autoOn = isPlaying && !isHeld && !reduceMotion;
  const isRunning = autoOn && count > 1;

  // 대상 — 자리마다 시계를 새로 건다. 손으로 넘겼든 저절로 넘어갔든 머무는 시간이 같아진다(FaultMap 주석).
  useEffect(() => {
    if (!isRunning) return undefined;

    const timer = window.setTimeout(() => setCursor((prev) => (prev + 1) % count), TOUR_MS);

    return () => window.clearTimeout(timer);
  }, [isRunning, cursor, count]);

  // 기간 — 같은 대상을 시간대·일·월 세 눈금으로 돌려 보여, 한 화면에 담는 양은 늘리지 않고 총량만 늘린다.
  useEffect(() => {
    if (!autoOn) return undefined;

    const timer = window.setInterval(() => setPeriodState((prev) => nextIn(PERIOD_CYCLE, prev)), PERIOD_MS);

    return () => window.clearInterval(timer);
  }, [autoOn]);

  // 축 — 학교→기관→지역을 한 바퀴 돈다. 축이 갈리면 목록이 통째로 바뀌므로 커서를 첫 자리로 돌린다.
  // 저절로 넘긴 것이라 손댐(hold)으로 치지 않는다 — 사람이 세우지 않는 한 계속 돈다.
  useEffect(() => {
    if (!autoOn) return undefined;

    const timer = window.setInterval(() => {
      setAxisState((prev) => nextIn(AXIS_CYCLE, prev));
      setCursor(0);
    }, AXIS_MS);

    return () => window.clearInterval(timer);
  }, [autoOn]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // 손댄 동안 붙잡고, 마지막 손길에서 IDLE_MS 가 지나면 다시 돌린다.
  const holdTour = useCallback(() => {
    setIsHeld(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIsHeld(false), IDLE_MS);
  }, []);

  const clearIdle = () => {
    window.clearTimeout(idleTimer.current);
    setIsHeld(false);
  };

  return {
    axis,
    // 사람이 축을 고르면 첫 자리로 돌아가고, 잠시 붙잡는다 — 방금 고른 축을 자동 전환이 곧바로
    // 다음 축으로 넘겨 버리면 고른 보람이 없다. IDLE_MS 뒤 손을 뗀 것으로 보고 다시 돈다.
    setAxis: (next) => { setAxisState(next); setCursor(0); holdTour(); },
    period,
    // 사람이 기간을 고르면 같은 이유로 잠시 붙잡는다.
    setPeriod: (next) => { setPeriodState(next); holdTour(); },
    rows,
    averageHours,
    selected,
    selectedIndex,
    // 줄을 고르면 커서를 그 자리로 옮겨, 다시 돌 때 거기서 이어 간다.
    selectKey: (key) => {
      const index = rows.findIndex((row) => row.key === key);

      if (index >= 0) setCursor(index);
      holdTour();
    },
    holdTour,
    isPlaying,
    // 사람이 세우면 붙잡음까지 풀어, 재생을 눌렀을 때 곧바로 돌게 한다.
    togglePlay: () => { setIsPlaying((prev) => !prev); clearIdle(); },
  };
}
