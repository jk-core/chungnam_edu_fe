import dayjs from 'dayjs';
import type { AnalysisStage, DiagnosisFinding, DiagnosisReport } from '@/interface/diagnosis';
import type { OperationStatus } from '@/interface/status';
import { withParticle } from '@/utils/korean';
import { DIAG_EFFICIENCY_CRITICAL, DIAG_EFFICIENCY_WARN } from '@/configs/diagnosis';
import { getChildNodes, getNode } from './tree';
import {
  getDiagEfficiencySeries,
  getFaultCode,
  getInverterById,
  getInvertersOf,
} from './equipment';
import { isAbnormal, OPERATION_RANK } from './status';
import { createRandom, hashSeed, pickNumber } from './random';
import type { ScopeNode } from './tree';

/**
 * 판정을 내린 모델 이름 — 진단 기록에 함께 남긴다.
 *
 * 교육용 대시보드에도 띄우고 있었으나 걷어냈다. 태양광을 배우러 온 화면에서 판정 엔진의
 * 이름과 버전은 배울 것도 확인할 것도 없는 수다.
 */
export const DIAGNOSIS_MODEL = 'cne-diagnosis-1.2 (규칙엔진 + 생성형 소견)';

/**
 * 분석 진행 단계.
 * 생성형 추론이 가장 오래 걸려 진행률의 대부분을 차지한다.
 */
/**
 * 분석 단계. 단계마다 색이 달라 게이지와 글자가 함께 물든다 —
 * 지금 어디를 지나는지 숫자를 읽지 않아도 알게 하려는 것이다.
 */
export const ANALYSIS_STEPS: {
  stage: AnalysisStage;
  label: string;
  note: string;
  threshold: number;
  color: string;
}[] = [
  { stage: 'scan', label: '데이터 정밀 스캔', note: '수집값 결측·이상치를 훑습니다', threshold: 12, color: 'var(--ai-scan)' },
  { stage: 'classify', label: '고장 분류', note: '고장 분류 모델이 코드를 판정합니다', threshold: 26, color: 'var(--ai-classify)' },
  // 100% 에 닿기 전까지는 추론 단계로 둔다. 완료 표시는 진행률이 다 찬 뒤에만 켠다.
  { stage: 'reason', label: '생성형 AI 심층 추론', note: '원인과 조치를 문장으로 정리합니다', threshold: 100, color: 'var(--ai-reason)' },
  { stage: 'done', label: 'AI 진단 완료', note: '결과를 정리했습니다', threshold: 100, color: 'var(--ai-done)' },
];

export function stageOf(percent: number): AnalysisStage {
  return ANALYSIS_STEPS.find((step) => percent < step.threshold)?.stage ?? 'done';
}

/** 적설은 겨울에만 의심한다. 여름 저하는 오염·음영으로 본다. */
function isSnowSeason(start: Date, end: Date): boolean {
  const months = new Set<number>();
  let cursor = dayjs(start);

  while (!cursor.isAfter(dayjs(end), 'month')) {
    months.add(cursor.month());
    cursor = cursor.add(1, 'month');
  }

  return [11, 0, 1].some((month) => months.has(month));
}

const CAUSE_BY_STATUS: Record<OperationStatus, string> = {
  running: '측정값이 모델 예측 범위 안에서 움직였습니다. 특이 구간은 발견되지 않았습니다.',
  ready: '아직 정상 수집 이력이 없어 판정할 계측값이 없습니다.',
  degraded: '맑은 시간대에도 예측 대비 출력이 낮은 구간이 반복됩니다. 표면 오염 또는 부분 음영이 의심됩니다.',
  fault: '예측 대비 출력이 절반 아래로 떨어진 구간이 이어집니다. 회로 일부가 끊긴 것으로 보입니다.',
  commLost: '조회 기간 내 계측값이 들어오지 않았습니다. 발전 여부를 확인할 수 없습니다.',
};

const ACTION_BY_STATUS: Record<OperationStatus, string> = {
  running: '추가 조치 없이 다음 정기점검 주기를 지키면 됩니다.',
  ready: '시운전 결과를 확인하고 RTU 등록 상태를 점검하세요.',
  degraded: '모듈 표면 세척과 남측 음영물 정리를 검토하세요.',
  fault: '접속함 퓨즈 도통과 커넥터 접촉을 우선 확인하세요.',
  commLost: '현장 통신 모뎀 전원과 신호 세기를 먼저 확인하세요.',
};

/** 진단 판정 대상이 되는 노드들. */
function diagnosisTargetsOf(node: ScopeNode): ScopeNode[] {
  if (node.kind === 'root') {
    // 도 전체는 판정 단위가 너무 많아, 이상 설비를 앞세운 인버터 표본만 본다.
    return getChildNodes(node.id)
      .flatMap((plant) => getChildNodes(plant.id))
      .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw)
      .slice(0, 8);
  }

  if (node.kind === 'plant') return getChildNodes(node.id);
  // 인버터는 그 아래 스트링을 본다.
  if (node.kind === 'inverter') return getChildNodes(node.id);

  return [node];
}

function buildFinding(target: ScopeNode, snowSeason: boolean): DiagnosisFinding {
  const inverter = getInverterById(target.inverterId);
  const faultCode = target.kind === 'inverter' ? inverter?.faultCode ?? null : null;
  const fault = getFaultCode(faultCode);
  const series = getDiagEfficiencySeries(target.id, target.status);
  const diagEfficiency = series[series.length - 1];
  const isLow = diagEfficiency < DIAG_EFFICIENCY_WARN;

  return {
    id: target.id,
    equipmentName: target.name,
    parentName: getNode(target.parentId).name,
    status: target.status,
    faultCode,
    faultLabel: fault ? `${fault.label} · ${fault.summary}` : (target.status === 'running' ? '정상' : '진단 효율 저하'),
    diagEfficiency,
    cause: fault ? `${fault.summary} — ${fault.description[0]}` : CAUSE_BY_STATUS[target.status],
    recommendation: fault ? fault.plan[0] : ACTION_BY_STATUS[target.status],
    // 겨울에 효율이 크게 떨어졌다면 고장보다 적설을 먼저 의심한다.
    snowSuspected: snowSeason && isLow && diagEfficiency >= DIAG_EFFICIENCY_CRITICAL,
  };
}

function buildInsight(node: ScopeNode, findings: DiagnosisFinding[]): string[] {
  const abnormal = findings.filter((item) => isAbnormal(item.status));
  const snow = findings.filter((item) => item.snowSuspected);
  const worst = findings.reduce(
    (low, item) => (item.diagEfficiency < low.diagEfficiency ? item : low),
    findings[0],
  );
  const lines: string[] = [];

  lines.push(
    abnormal.length === 0
      ? `${node.fullName}의 진단 대상 ${findings.length}개는 모두 모델 예측 범위 안에서 동작했습니다.`
      : `${node.fullName}의 진단 대상 ${findings.length}개 중 ${abnormal.length}개에서 이상 징후를 찾았습니다.`,
  );

  if (worst && worst.diagEfficiency < DIAG_EFFICIENCY_WARN) {
    lines.push(
      `가장 낮은 곳은 ${withParticle(worst.equipmentName, '로')} 진단 효율 ${worst.diagEfficiency}%입니다. 같은 일사량에서 기대보다 ${
        Math.round(100 - worst.diagEfficiency)
      }% 덜 만들었습니다.`,
    );
  }

  if (snow.length > 0) {
    lines.push(
      `${snow.length}개는 겨울철 적설로 모듈 표면이 가려져 생긴 일시적 저하로 보입니다. 융설 후 회복되는지 먼저 확인하세요.`,
    );
  }

  lines.push(
    abnormal.length === 0
      ? '다음 정기점검까지 별도 현장 조치는 필요하지 않습니다.'
      : '고장코드가 붙은 설비부터 먼저 현장을 확인하면 발전량을 더 많이 되찾을 수 있습니다.',
  );

  return lines;
}

const reportCache = new Map<string, DiagnosisReport>();

/**
 * AI 고장분석 결과.
 * 고장 판정 자체는 규칙엔진(상태·고장코드)이 확정하고, 생성형 모델은 서술만 맡는 구조를 흉내 낸다.
 */
export function getDiagnosisReport(node: ScopeNode, start: Date, end: Date): DiagnosisReport {
  const key = `${node.id}-${dayjs(start).format('YYYYMMDD')}-${dayjs(end).format('YYYYMMDD')}`;
  const cached = reportCache.get(key);

  if (cached) return cached;

  const snowSeason = isSnowSeason(start, end);
  const targets = diagnosisTargetsOf(node);
  const findings = targets.map((target) => buildFinding(target, snowSeason));
  const next = createRandom(hashSeed(key));
  const plantInverters = node.plantId ? getInvertersOf(node.plantId) : [];

  const report: DiagnosisReport = {
    targetId: node.id,
    targetName: node.fullName,
    startDate: dayjs(start).format('YYYY-MM-DD'),
    endDate: dayjs(end).format('YYYY-MM-DD'),
    hasFault: findings.some((item) => item.faultCode !== null),
    // 인버터는 정상인데 발전량만 낮으면 일사량계 쪽을 의심한다.
    irradSensorSuspected:
      plantInverters.length > 0 && plantInverters.every((item) => item.status === 'running') && next() > 0.6,
    insight: buildInsight(node, findings),
    model: DIAGNOSIS_MODEL,
    generatedAt: `${dayjs(end).format('YYYY-MM-DD')} ${String(Math.floor(pickNumber(next, 6, 20))).padStart(2, '0')}:${String(Math.floor(pickNumber(next, 0, 59))).padStart(2, '0')}`,
    findings,
  };

  reportCache.set(key, report);

  return report;
}
