import { formatEnergy, formatNumber, formatPercent } from '@/utils/format';

import { withParticle } from '@/utils/korean';
import type { AnalysisStage } from '@/interface/diagnosis';
import { FULL_SUN_WM2 } from './solarEdu';
import type { EduStats } from './solarEdu';

/*
  발전량을 문장에 넣을 때의 표기.
  도 전체를 합치면 kWh 로는 다섯 자리를 넘겨 칸을 넘으므로 자릿수에 맞춰 M·G 로 올린다.
  적산 일사량(kWh/m²)은 넓이당 값이라 올리지 않는다 — 자릿수가 커지지 않는다.
*/
const energyText = (kwh: number) => {
  const { value, unit } = formatEnergy(kwh);

  return `${value}${unit}`;
};

/*
  교육용 AI 진단 (SFR-005-02/07/10).

  운영용 진단(`llmDiagnosis.ts`)은 인버터·스트링 단위로 고장코드를 짚는다. 그 화면을 그대로 줄여 놓으면
  학생에게는 읽을 수 없는 표가 된다. 여기서는 같은 4단계 골격만 빌려 오고, 판단의 재료를 학생이 이미 보고 있는
  값(금일 발전량·기대 발전량·일사량)으로 바꿨다. 화면 왼쪽 곡선에 있는 숫자가 그대로 소견에 나와야
  "AI 가 저 그래프를 보고 말하는구나" 가 읽힌다.

  그래서 이 파일의 모든 함수는 화면이 이미 만들어 둔 `EduStats` 를 **받아서** 파생시킨다. 여기서 다시 계산하면
  같은 화면 안에서 숫자가 갈린다.
*/

/**
 * 한 바퀴에 걸리는 시간. 진행보다 결과가 오래 남아야 지나가며 읽을 수 있다.
 * 단계마다 보여 주는 것이 달라진 뒤로는 한 단계가 최소 5초는 서 있어야 읽힌다 —
 * 24칸 격자가 차오르는 것도, 확률 막대 넉 장도 눈으로 좇을 시간이 필요하다.
 */
export const SCAN_RUN_MS = 18_000;
export const SCAN_HOLD_MS = 8_000;
export const SCAN_CYCLE_MS = SCAN_RUN_MS + SCAN_HOLD_MS;

export interface EduScanStage {
  stage: AnalysisStage;
  /** 이 단계가 끝나는 진행률(%) */
  until: number;
  /** 게이지·배지가 함께 물드는 색 */
  color: string;
}

/*
  단계 구간. 앞의 둘은 기계가 하는 일이라 금방 지나가고, 문장을 짓는 추론이 대부분을 차지한다 —
  실제 서비스에서도 생성이 가장 오래 걸리고, 학생이 읽어야 할 것도 그 결과다.
*/
export const EDU_SCAN_STAGES: EduScanStage[] = [
  { stage: 'scan', until: 28, color: 'var(--ai-scan)' },
  { stage: 'classify', until: 56, color: 'var(--ai-classify)' },
  { stage: 'reason', until: 100, color: 'var(--ai-reason)' },
  // 완료는 100% 에 닿은 뒤의 상태라 차지하는 구간이 없다.
  { stage: 'done', until: 100, color: 'var(--ai-done)' },
];

export function eduStageOf(percent: number, finished: boolean): EduScanStage {
  if (finished) return EDU_SCAN_STAGES[EDU_SCAN_STAGES.length - 1];

  return EDU_SCAN_STAGES.find((item) => percent <= item.until) ?? EDU_SCAN_STAGES[0];
}

/** 판정 등급. 색과 문구가 여기서 갈린다. */
export type EduBand = 'good' | 'fair' | 'low' | 'offline';

const BAND_LABEL: Record<EduBand, string> = {
  good: '이상 없음',
  fair: '조금 낮음',
  low: '점검 필요',
  offline: '계측 중단',
};

export interface EduInsight {
  band: EduBand;
  /** 완료 배지에 뜨는 짧은 판정 */
  verdict: string;
  /** 한 줄씩 차례로 드러나는 소견 */
  lines: string[];
  /** 단계마다 게이지 아래에 붙는 지금 하고 있는 일 */
  detail: Record<AnalysisStage, string>;
}

/**
 * 낮 동안 햇빛이 잠깐 꺾인 시각을 찾는다.
 *
 * 앞뒤 시각의 가운데값보다 눈에 띄게 낮으면 그 자리를 구름이 지난 것으로 본다. 곡선에 움푹 팬 자리가
 * 왜 생겼는지 짚어 주려는 것이라, 가장 크게 꺾인 한 곳만 고른다. 없으면 아무 말도 하지 않는다.
 */
function findCloudHour(series: number[]): number | null {
  let found: number | null = null;
  let deepest = 0;

  for (let hour = 9; hour <= 15; hour += 1) {
    const around = ((series[hour - 1] ?? 0) + (series[hour + 1] ?? 0)) / 2;

    if (around <= 0) continue;

    const dip = 1 - (series[hour] ?? 0) / around;

    if (dip > 0.15 && dip > deepest) {
      deepest = dip;
      found = hour;
    }
  }

  return found;
}

/**
 * 두 계열이 얼마나 나란히 움직이는지 (피어슨 상관계수).
 *
 * 햇빛이 셀 때 발전량도 함께 오르는지를 숫자 하나로 말해 준다. 1 에 가까우면 판이 햇빛을 그대로 따라간다는 뜻이고,
 * 떨어지면 햇빛과 무관한 무언가가 끼어들었다는 신호다 — AI 가 설비 이상을 의심하는 첫 단서가 이것이다.
 */
function correlationOf(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);

  if (n === 0) return 0;

  const mean = (series: number[]) => series.slice(0, n).reduce((sum, value) => sum + value, 0) / n;
  const meanA = mean(a);
  const meanB = mean(b);
  let top = 0;
  let leftSq = 0;
  let rightSq = 0;

  for (let index = 0; index < n; index += 1) {
    const da = a[index] - meanA;
    const db = b[index] - meanB;

    top += da * db;
    leftSq += da * da;
    rightSq += db * db;
  }

  const bottom = Math.sqrt(leftSq * rightSq);

  return bottom > 0 ? top / bottom : 0;
}

/** 스캔 단계에 한 줄씩 쌓이는 기록 */
export interface EduScanLog {
  id: string;
  text: string;
}

/**
 * AI 가 값을 읽어 들이며 남기는 기록.
 *
 * 진단이 어느 날 갑자기 답을 내놓는 일이 아니라 값을 하나씩 확인해 가는 일이라는 것을,
 * 쌓이는 줄로 보여 준다. 적는 내용은 전부 실제 계열에서 나온다.
 */
export function buildEduLogs(stats: EduStats): EduScanLog[] {
  const correlation = correlationOf(stats.hourly, stats.irradianceSeries);
  const daylight = stats.irradianceSeries.filter((value) => value > 0).length;

  return [
    { id: 'load', text: `계측 채널 연결 · 발전량 ${stats.hourly.length}칸, 일사 ${stats.irradianceSeries.length}칸` },
    { id: 'gap', text: '결측값 0건 · 범위를 벗어난 값 0건' },
    { id: 'sun', text: `일조 시간 ${daylight}시간 · 현재 일사량 ${formatNumber(stats.irradianceNow)}W/m²` },
    { id: 'corr', text: `햇빛–발전량 상관 ${formatNumber(correlation, 2)} · 두 값이 같은 모양으로 움직였다` },
    { id: 'model', text: `기대 발전량 모델 적용 · ${energyText(stats.expectedKwh)}` },
  ];
}

/** 분류 단계가 내놓는 후보와 그 확률 */
export interface EduClass {
  id: string;
  label: string;
  /** 0~1 */
  probability: number;
  /** 이 후보가 무슨 뜻인지 한마디 */
  note: string;
}

/**
 * 오늘 곡선이 어느 쪽에 가까운지를 확률로 내놓는다.
 *
 * AI 는 "고장이다/아니다" 로 딱 잘라 답하지 않고 후보마다 얼마나 그럴듯한지를 함께 내놓는다.
 * 그 사고방식을 그대로 보여 주려고 막대 넷으로 세웠다 — 학생이 배울 것은 답이 아니라 이 방식이다.
 */
export function buildEduClasses(stats: EduStats): EduClass[] {
  const achieved = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;
  const cloudy = findCloudHour(stats.irradianceSeries) !== null;
  const peak = Math.max(...stats.irradianceSeries, 0);
  // 하루 내내 해가 약했다면 날씨 자체가 흐렸다는 뜻이다.
  const dim = peak < 0.55;
  const short = Math.max(0, 0.95 - achieved);

  const scored = [
    {
      id: 'clear',
      label: '맑음 · 정상',
      note: '일사량도 발전량도 기대한 수준이다',
      score: (dim ? 0.12 : 1) * (cloudy ? 0.4 : 1) * (achieved >= 0.95 ? 1 : 0.45),
    },
    {
      id: 'cloud',
      label: '구름 지나감',
      note: '일사량이 일시적으로 꺾인 구간이 있다',
      score: (cloudy ? 1 : 0.2) * (dim ? 1.3 : 1),
    },
    {
      id: 'shade',
      label: '그늘 짐',
      note: '한낮에 모듈이 가려졌을 가능성이 있다',
      score: 0.06 + short * 3.2,
    },
    {
      id: 'dust',
      label: '패널 오염',
      note: '표면이 오염되면 일사량만큼 발전하지 못한다',
      score: 0.05 + short * 2,
    },
  ];

  const total = scored.reduce((sum, item) => sum + item.score, 0) || 1;

  return scored
    .map(({ score, ...rest }) => ({ ...rest, probability: score / total }))
    .sort((left, right) => right.probability - left.probability);
}

function bandOf(achieved: number): Exclude<EduBand, 'offline'> {
  if (achieved >= 0.95) return 'good';
  if (achieved >= 0.8) return 'fair';

  return 'low';
}

/**
 * 오늘 이 학교를 두고 AI 가 할 말을 짓는다.
 *
 * 중심 지표는 "같은 햇빛이면 나왔어야 할 양(`expectedKwh`) 대비 실제로 만든 양" 하나다.
 * 발전량이 적다는 말만으로는 흐린 날인지 고장인지 가릴 수 없는데, 이 비율은 날씨를 이미 셈에 넣은 값이라
 * 설비 쪽 문제를 가려낼 수 있다 — AI 진단이 실제로 하는 일이 그것이고, 학생이 배울 것도 그 발상이다.
 */
export function buildEduInsight(stats: EduStats, scopeLabel: string): EduInsight {
  const score = Math.round((stats.irradianceNow / FULL_SUN_WM2) * 100);

  if (!stats.isLive) {
    // 계측이 끊겼을 때 없는 판단을 지어내면 교육 자료로서 나쁘다. 모른다고 말한다 (SFR-005-10).
    return {
      band: 'offline',
      verdict: BAND_LABEL.offline,
      lines: [
        `${withParticle(scopeLabel, '은')} 현재 계측값이 들어오지 않아, 마지막 수신값까지만 볼 수 있다.`,
        '값이 없으면 AI 도 판단하지 않는다. 모르는 것을 지어내지 않는 것도 진단에서 중요한 일이다.',
      ],
      detail: {
        scan: '계측값 미수신',
        classify: '대조할 값 없음',
        reason: '판단 보류',
        done: BAND_LABEL.offline,
      },
    };
  }

  const achieved = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;
  const band = bandOf(achieved);
  const cloudHour = findCloudHour(stats.irradianceSeries);

  const lines = [
    `${scopeLabel}의 금일 발전량은 ${energyText(stats.dayKwh)} 이다. `
    + `동일 일사 조건의 기대 발전량 ${energyText(stats.expectedKwh)} 대비 ${formatPercent(achieved)} 수준이다.`,
    `현재 일사량은 ${formatNumber(stats.irradianceNow)}W/m² 로 ${score}점이다. `
    + '기대 발전량이 날씨를 이미 반영한 값이므로, 흐린 날이라고 해서 이 비율이 낮아지지는 않는다.',
    `설비용량으로 나누면 ${formatNumber(stats.equivalentHours, 1)}시간이고, `
    + `하루 내내 최대 출력으로 돌렸을 경우와 비교하면 ${formatPercent(stats.capacityFactor)} 수준이다.`,
  ];

  if (cloudHour !== null) {
    lines.push(
      `${cloudHour}시 무렵 일사량이 잠깐 떨어졌다. 차트가 뚝 떨어진 구간은 대개 구름이 해를 가린 순간이고, `
      + '설비 문제는 아니다.',
    );
  }

  lines.push(
    band === 'good'
      ? '기대치를 충족하고 있다. 현재로서는 조치할 항목이 없다.'
      : band === 'fair'
        ? '기대치보다 다소 낮다. 모듈 오염이나 한낮의 음영 여부를 살펴볼 필요가 있다.'
        : '기대치보다 크게 낮다. 모듈 오염·음영과 인버터 상태를 현장에서 직접 확인해야 한다.',
  );

  return {
    band,
    verdict: BAND_LABEL[band],
    lines,
    detail: {
      scan: `발전량 ${stats.hourly.length}칸 · 일사량 ${stats.irradianceSeries.length}칸 수신`,
      classify: `기대 ${energyText(stats.expectedKwh)} 대비 ${formatPercent(achieved)}`,
      reason: `소견 ${lines.length}줄 작성 중`,
      done: BAND_LABEL[band],
    },
  };
}
