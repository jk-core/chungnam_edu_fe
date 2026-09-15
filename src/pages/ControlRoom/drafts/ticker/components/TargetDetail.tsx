import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CountUp } from '@/components/common/CountUp';
import { EChart } from '@/components/common/EChart';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { CO2_PER_KWH } from '@/mocks/generation';
import { formatNumber, scaleCarbon, scaleSi } from '@/utils/format';
import { withParticle } from '@/utils/korean';
import { cn } from '@/utils/cn';
import type { SiScale } from '@/utils/format';
import { AXIS_NOUN } from '../useTickerBoard';
import { useTickerChartPalette } from '../utils/chartPalette';
import { buildTargetSeries, PERIOD_OPTIONS } from '../utils/series';
import styles from './TargetDetail.module.scss';
import type { TickerChartPalette } from '../utils/chartPalette';
import type { TargetSeries } from '../utils/series';
import type { TickerBoard, TickerRow } from '../useTickerBoard';
import type { RefObject } from 'react';
import type { Variants } from 'motion/react';
import type { EChartsOption } from 'echarts';

/**
 * 차트 글자 크기.
 *
 * ECharts 는 옵션을 픽셀로만 받아 `rem` 을 모른다. 이 화면은 뿌리 글자 기준을 18px 로 올려
 * 두었으므로(`html.control-draft`), 기본값 12px 은 물론이고 15px 로 키운 것조차 옆의 판
 * 글자(라벨 15.75px)보다 작아져 차트만 흐릿하게 남는다. 판의 라벨과 같은 크기로 맞춘다 —
 * 뿌리 기준을 다시 손보는 날에는 이 값도 함께 고쳐야 한다.
 */
const CHART_LABEL_PX = 16;
const CHART_MARK_PX = 15;

/**
 * y축 눈금 하나가 차지하는 최소 높이(px).
 *
 * 16px 글자가 위아래로 붙지 않으려면 글자 높이에 여유를 얹은 만큼은 떼어야 한다. 그리기 높이를
 * 이 값으로 나눈 것이 곧 「눈금을 몇 칸까지 놓을 수 있나」다.
 */
const Y_TICK_MIN_GAP = Math.round(CHART_LABEL_PX * 1.4);

/**
 * 그리기 판의 안쪽 여백.
 *
 * 왼쪽은 눈금 글자와 축 이름이 함께 서는 자리라 16px 글자에 맞춰 넉넉히 두고, 위는 축 이름
 * 한 줄이 그리드 밖에 서는 자리(`Y_NAME_GAP` + 글자 한 줄)만큼만 둔다 — 위아래를 더 벌리면
 * 그만큼 그리기 높이가 깎여 놓을 수 있는 눈금 칸이 줄어든다.
 */
const GRID = { top: 34, right: 28, bottom: 36, left: 76 };

/** 축 이름과 그리드 윗변 사이. 기본값(15)은 16px 글자에서 첫 눈금 글자와 맞붙는다. */
const Y_NAME_GAP = 14;

/** 눈금 간격 후보 — 1·2·2.5·5 계열만 쓴다. 다른 수를 끼우면 「0.3·0.6·0.9」 처럼 읽기 나쁜 눈금이 선다. */
const NICE_STEPS = [1, 2, 2.5, 5];

/** 간격을 있는 그대로 적는 데 필요한 소수 자릿수 — 2.5 는 한 자리, 25 는 없음. */
function fractionDigitsOf(interval: number): number {
  const text = interval.toFixed(6).replace(/0+$/u, '').replace(/\.$/u, '');
  const dot = text.indexOf('.');

  return dot < 0 ? 0 : text.length - dot - 1;
}

/**
 * 겹치지 않는 y축 — 눈금 수를 그리기 높이가 정한다.
 *
 * ECharts 는 축 글자를 키워도 눈금 간격을 스스로 벌리지 않는다. 기본값(splitNumber 5 → 눈금
 * 여섯)을 그대로 두면, 그리기 높이가 좁은 판에서 16px 글자가 세로로 포개져 읽을 수 없는 덩이가
 * 된다 — 실제로 요약 판이 세로를 차지하던 때는 그리기 높이가 70px 남짓뿐이었다. 축 글자를
 * 줄이는 것은 답이 아니므로(벽에서 읽는 화면이라 16px 이 바닥이다) 눈금 수를 높이에 맞춘다.
 * 판을 넉넉히 잡은 지금은 같은 셈이 눈금을 예닐곱으로 늘려 준다 — 겹치지 않는 선에서 촘촘한
 * 편이 읽기 좋으므로, 상한(6칸)까지는 높이가 허락하는 만큼 채운다.
 *
 * splitNumber 를 낮추는 것만으로는 모자란다. ECharts 는 그 값을 「이쯤이면 좋겠다」로만 받아
 * 보기 좋은 수로 반올림하며 칸을 도로 늘리므로 눈금 수가 보장되지 않는다. 그래서 칸 수를 먼저
 * 셈하고 1·2·2.5·5 계열 간격을 직접 골라 min·max·interval 을 못 박는다.
 */
function buildYScale(values: number[], plotHeight: number): { max: number; interval: number; decimals: number } {
  const slots = Math.min(6, Math.max(2, Math.floor(plotHeight / Y_TICK_MIN_GAP)));
  const peak = Math.max(...values, 0);

  // 값이 모두 0 인 대상은 0~1 한 칸으로 세운다 — 간격이 0 이면 축이 무너진다.
  if (peak <= 0) return { max: 1, interval: 1, decimals: 0 };

  // 1·2·2.5·5 를 네 자리에 걸쳐 늘어놓고, 눈금이 slots 칸 안에 드는 첫(=가장 촘촘한) 간격을 집는다.
  const base = 10 ** Math.floor(Math.log10(peak / slots));
  const candidates = [0, 1, 2, 3].flatMap((round) => NICE_STEPS.map((step) => step * base * 10 ** round));
  const raw = candidates.find((candidate) => Math.ceil(peak / candidate) <= slots) ?? peak / slots;

  // 0.1 계열 곱셈에서 새는 오차(0.30000000000000004)를 여기서 끊는다 — 축 글자에 그대로 드러난다.
  const interval = Number(raw.toPrecision(12));
  const max = Number((interval * Math.ceil(peak / interval)).toPrecision(12));

  return { max, interval, decimals: fractionDigitsOf(interval) };
}

/**
 * 차트 상자의 높이(px)를 지켜본다.
 *
 * y축에 눈금을 몇 개까지 둘 수 있는지는 상자 높이가 정하는데(`buildYScale`), 그 높이는 위 요약
 * 판이 얼마나 차지하느냐에 따라 달라져 코드에 못 박을 수 없다. 창을 줄이거나 판을 다시 잡아도
 * 따라가야 하므로 ResizeObserver 로 지켜본다.
 */
function useBoxHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return height;
}

/** 부드럽게 감속하는 이징 — 시작은 빠르고 끝에서 멈춰 선다(cubic-bezier). */
const EASE_OUT: [number, number, number, number] = [0.22, 0.68, 0.32, 1];

/** 대상이 바뀔 때 수치 타일이 짧은 시차를 두고 들어온다 — 「새 정보가 채워지는」 것으로 읽힌다. */
const CONTAINER_VARIANTS: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  // 전환은 짧게(0.3초) 끝내고 멈춰 선다 — 연령이 높은 사용자는 글자가 움직이는 동안 읽을 수 없다.
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

/**
 * 축 글자·눈금선을 판의 글자 크기에 맞춘 공통 축 설정 — 벽에 걸어 두고 멀리서 읽는다.
 *
 * 차트 상자 높이(`chartHeight`)를 받는 것은 y축 눈금 수를 그 높이가 정하기 때문이다(`buildYScale`).
 */
function buildOption(series: TargetSeries, palette: TickerChartPalette, chartHeight: number): EChartsOption {
  const axisLabel = { color: palette.axis, fontSize: CHART_LABEL_PX, fontFamily: 'Space Grotesk, sans-serif' };
  const scale = buildYScale(series.values, chartHeight - GRID.top - GRID.bottom);

  const base: EChartsOption = {
    grid: { ...GRID },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: CHART_LABEL_PX, fontFamily: 'Pretendard Variable, sans-serif' },
      valueFormatter: (value) => `${formatNumber(Number(value), 2)} ${series.unit}`,
    },
    xAxis: {
      type: 'category',
      data: series.labels,
      boundaryGap: series.shape === 'bar',
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      // 일별은 항목이 31개라 16px 글자로는 다 설 자리가 없다. 건너뛰며 찍는 것(interval: 'auto')에
      // 더해, 자동 계산이 빠듯하게 잡아 스치는 경우까지 hideOverlap 으로 막는다.
      axisLabel: { ...axisLabel, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      name: series.unit,
      nameGap: Y_NAME_GAP,
      nameTextStyle: { color: palette.axis, fontSize: CHART_LABEL_PX, align: 'right' },
      // 눈금을 ECharts 에 맡기지 않고 못 박는다 — 까닭은 `buildYScale` 주석에.
      min: 0,
      max: scale.max,
      interval: scale.interval,
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { ...axisLabel, formatter: (value: number) => formatNumber(value, scale.decimals) },
    },
  };

  if (series.shape === 'line') {
    return {
      ...base,
      series: [{
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: series.values,
        lineStyle: { color: palette.generation, width: 3 },
        areaStyle: { color: palette.generationSoft },
        // '지금' 눈금 — 종목의 현재가처럼 오늘 곡선에서 지금 어디에 서 있는지를 짚는다.
        markLine: series.nowIndex === undefined ? undefined : {
          silent: true,
          symbol: 'none',
          label: { formatter: '지금', color: palette.generation, fontSize: CHART_MARK_PX, position: 'insideEndTop' },
          lineStyle: { color: palette.generation, type: 'dashed', width: 1.5 },
          data: [{ xAxis: series.labels[series.nowIndex] }],
        },
        // 기간을 바꿀 때 축과 선이 부드럽게 옮겨 가면 그 자체가 볼거리다 — ECharts 자체 전환을 살린다.
        animationDuration: 700,
        animationDurationUpdate: 700,
        animationEasingUpdate: 'cubicInOut',
      }],
    };
  }

  return {
    ...base,
    series: [{
      type: 'bar',
      barMaxWidth: 30,
      data: series.values,
      itemStyle: { color: palette.generation, borderRadius: [6, 6, 0, 0] },
      animationDuration: 600,
      animationDelay: (index: number) => index * 20,
      animationDurationUpdate: 600,
      animationEasingUpdate: 'cubicInOut',
    }],
  };
}

/** 도 평균 발전시간 대비 오름/내림 표기 */
function deltaOf(delta: number): { tone: 'rise' | 'fall' | 'flat'; text: string } {
  if (Math.abs(delta) < 0.05) return { tone: 'flat', text: '± 0.0h' };

  return {
    tone: delta > 0 ? 'rise' : 'fall',
    text: `${delta > 0 ? '▲' : '▼'} ${formatNumber(Math.abs(delta), 1)}h`,
  };
}

/**
 * 고른 대상의 오늘을 한 문장으로 (토스의 「왜 떨어졌을까?」 자리).
 *
 * 수치만 칸에 늘어놓으면 「그래서 어떻다는 것인가」 는 읽는 사람이 이어 붙여야 한다. AI 진단 판이
 * 지역을 글로 풀듯, 여기서도 가진 값(발전시간·도 평균·이용률)만으로 대상 하나를 한 마디로 맺는다 —
 * 구어체·비유 없이 전문 용어로. 이름이 데이터에서 오므로 받침을 보고 조사를 고른다.
 *
 * 두 마디를 한 문장으로 잇는다. 「…높습니다. 지역 보령시의 이용률 16.8%입니다.」 처럼 끊으면
 * 한 문장 안에서 이름을 두 번 말하게 되고, 앞에 축 이름(지역·학교·기관)까지 붙어 문장이 아니라
 * 이름표가 된다. 무엇을 보고 있는지는 판 머리의 「지역 · 순위 2 / 15」 가 이미 말한다.
 */
function sentenceOf(selected: TickerRow, averageHours: number): string {
  const subject = withParticle(selected.name, '은');
  const gap = selected.hours - averageHours;
  const utilization = formatNumber(selected.utilization * 100, 1);

  const compare = Math.abs(gap) < 0.05
    ? '도 평균과 같은 수준이고'
    : `도 평균보다 ${formatNumber(Math.abs(gap), 1)}시간 ${gap > 0 ? '높고' : '낮고'}`;

  return `${subject} 금일 발전시간 ${formatNumber(selected.hours, 1)}시간으로 ${compare}, 이용률은 ${utilization}%입니다.`;
}

/** 자릿수에 맞춰 접힌 수치를 굴려 올린다 — 대상이 바뀔 때마다 0 에서 다시 오른다(감소 모션이면 즉시 최종값). */
function ScaledCount({ scale }: { scale: SiScale }) {
  return (
    <>
      <CountUp value={scale.amount} fractionDigits={scale.fractionDigits} duration={700} startOnView={false} />
      {scale.countSuffix ? <span className={styles.tile__suffix}>{scale.countSuffix}</span> : null}
    </>
  );
}

/**
 * 고른 대상의 상세 (오른쪽).
 *
 * 큰 차트 하나가 주인공이고, 그 위 요약 판에 금일 발전량(hero)과 보조 수치 여섯 칸을 큰 글자로
 * 세운다(2026-09-14 피드백 — 데이터 영역을 여섯 칸으로). 한 칸은 라벨 하나 + 값 하나로 끝내
 * 「너무 많은 정보를 복잡하게」 두지 않는다. 기간 탭으로 시간대·일별·월별을 오가되, 판이 답하는
 * 물음은 「고른 하나가 어떤가」로 좁혀 둔다. 기간·선택은 모두 상위(board)가 쥔다 — 자동 전환이
 * 기간을 스스로 넘기므로, 이 판이 따로 기간 상태를 쥐면 자동 전환과 어긋난다.
 */
export function TargetDetail({ board }: { board: TickerBoard }) {
  const { axis, rows, selected, selectedIndex, averageHours, period, setPeriod } = board;
  const reduceMotion = useReducedMotion();

  // 차트 색은 스킨이 판 안에서 다시 매므로 판 요소에서 읽는다 — 루트에서 읽으면 서비스 기본색이 잡힌다.
  const panelRef = useRef<HTMLElement>(null);
  const palette = useTickerChartPalette(panelRef);

  // 차트가 받은 높이에 맞춰 y축 눈금 수를 정한다 — 상자를 재지 않으면 눈금이 글자보다 촘촘해진다.
  const chartRef = useRef<HTMLDivElement>(null);
  const chartHeight = useBoxHeight(chartRef);

  // selected 가 없어도 훅 순서를 지키려고 0 으로 계산해 두고, 그릴 때만 갈라친다.
  const todayKwh = selected?.todayKwh ?? 0;
  const series = useMemo(() => buildTargetSeries(todayKwh, period), [todayKwh, period]);
  const option = useMemo(() => buildOption(series, palette, chartHeight), [series, palette, chartHeight]);

  if (!selected) {
    return (
      <section className={styles.summary} aria-label="발전 상세">
        <p className={styles.empty}>조회된 대상이 없습니다.</p>
      </section>
    );
  }

  // 자릿수에 맞춰 접은 뒤 CountUp 에 넘긴다 — formatEnergy 와 같은 소수 규칙(1천~100만 사이만 한 자리).
  const todayScale = scaleSi(selected.todayKwh, 'Wh', selected.todayKwh >= 1_000 && selected.todayKwh < 1_000_000 ? 1 : undefined);
  const yearScale = scaleSi(selected.yearKwh, 'Wh', selected.yearKwh >= 1_000 && selected.yearKwh < 1_000_000 ? 1 : undefined);
  const outputScale = scaleSi(selected.outputKw, 'W');
  const capacityScale = scaleSi(selected.capacityKw, 'W');
  const carbonScale = scaleCarbon(selected.yearKwh * CO2_PER_KWH);
  const delta = deltaOf(selected.deltaHours);

  // 넷째 칸의 보조 문구는 축마다 답이 다르다 — 학교 하나면 위치, 묶음이면 개소·이상 수.
  const capacitySub = axis === 'plant'
    ? [selected.school?.regionName, selected.school?.level].filter(Boolean).join(' · ')
    : `${formatNumber(selected.count)}개소${selected.abnormal > 0 ? ` · 이상 ${formatNumber(selected.abnormal)}` : ''}`;

  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? '';

  return (
    <>
      {/* 위 — 글자로 읽는 자리 (2026-09-14 피드백: 위는 글자정보, 아래는 차트) */}
      <section className={styles.summary} aria-label="발전 요약">
        <div className={styles.summary__head}>
          <h2>{selected.name}</h2>
          <span className={styles.summary__note}>
            {`${AXIS_NOUN[axis]} · 순위 ${selectedIndex + 1} / ${formatNumber(rows.length)}`}
          </span>
        </div>

        {/* 대상 키가 바뀌면 통째로 다시 들어온다 — CountUp 이 0 에서 다시 오르고 타일이 차례로 채워진다. */}
        <motion.div
          className={styles.metrics}
          key={selected.key}
          variants={CONTAINER_VARIANTS}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? false : 'show'}
        >
          <motion.div className={styles.hero} variants={ITEM_VARIANTS}>
            <span className={styles.hero__label}>금일 발전량</span>
            <span className={styles.hero__value}>
              <ScaledCount scale={todayScale} />
              <span className={styles.hero__unit}>{todayScale.unit}</span>
            </span>
          </motion.div>

          <motion.div className={styles.tiles} variants={CONTAINER_VARIANTS}>
            <motion.div className={styles.tile} variants={ITEM_VARIANTS}>
              <span className={styles.tile__label}>발전시간</span>
              <span className={styles.tile__value}>
                <CountUp value={selected.hours} fractionDigits={1} duration={700} startOnView={false} />
                <span className={styles.tile__unit}>h</span>
              </span>
              <span className={styles.tile__meta}>
                <span className={cn(styles.tile__pill, styles[`tile__pill--${delta.tone}`])}>{delta.text}</span>
                <span className={styles.tile__sub}>도 평균 대비</span>
              </span>
            </motion.div>

            <motion.div className={styles.tile} variants={ITEM_VARIANTS}>
              <span className={styles.tile__label}>현재 출력</span>
              <span className={styles.tile__value}>
                <ScaledCount scale={outputScale} />
                <span className={styles.tile__unit}>{outputScale.unit}</span>
              </span>
            </motion.div>

            <motion.div className={styles.tile} variants={ITEM_VARIANTS}>
              <span className={styles.tile__label}>설비용량</span>
              <span className={styles.tile__value}>
                <ScaledCount scale={capacityScale} />
                <span className={styles.tile__unit}>{capacityScale.unit}</span>
              </span>
              <span className={styles.tile__sub}>{capacitySub}</span>
            </motion.div>

            <motion.div className={styles.tile} variants={ITEM_VARIANTS}>
              <span className={styles.tile__label}>이용률</span>
              <span className={styles.tile__value}>
                <CountUp value={selected.utilization * 100} fractionDigits={1} duration={700} startOnView={false} />
                <span className={styles.tile__unit}>%</span>
              </span>
            </motion.div>

            <motion.div className={styles.tile} variants={ITEM_VARIANTS}>
              <span className={styles.tile__label}>올해 누적</span>
              <span className={styles.tile__value}>
                <ScaledCount scale={yearScale} />
                <span className={styles.tile__unit}>{yearScale.unit}</span>
              </span>
            </motion.div>

            <motion.div className={styles.tile} variants={ITEM_VARIANTS}>
              <span className={styles.tile__label}>탄소저감</span>
              <span className={styles.tile__value}>
                <ScaledCount scale={carbonScale} />
                <span className={styles.tile__unit}>{carbonScale.unit}</span>
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* 말 한 마디 — 수치 여섯 칸 아래에 대상의 오늘을 한 문장으로 맺는다(정보가 더 많아 보이는 자리). */}
        <p className={styles.sentence}>{sentenceOf(selected, averageHours)}</p>
      </section>

      {/* 아래 — 차트 자리. 발전량·발전시간을 ECharts 로 그린다. 차트 색은 스킨을 따르므로 판에서 읽는다 */}
      <section ref={panelRef} className={styles.chartPanel} aria-label="발전 추이">
        <div className={styles.chartPanel__head}>
          <h2>발전 추이</h2>
          <SegmentedControl
            label="차트 기간"
            size="md"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
          />
        </div>

        {/* 상자를 하나 덧대는 것은 차트가 실제로 받은 높이를 재기 위해서다 — EChart 는 figure 라 ref 를 받지 않는다 */}
        <div ref={chartRef} className={styles.chart}>
          <EChart
            option={option}
            height="100%"
            summary={`${selected.name}의 ${periodLabel} ${series.measure} 추이.`}
          />
        </div>
      </section>
    </>
  );
}
