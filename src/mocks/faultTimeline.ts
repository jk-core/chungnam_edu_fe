import dayjs from 'dayjs';
import type { FaultTimeline, TimelineStep } from '@/interface/faultTimeline';
import { withParticle } from '@/utils/korean';
import { getChildNodes, getNode } from './tree';
import { getFaultCode, getInverterById } from './equipment';
import { TODAY } from './today';
import { createRandom, hashSeed, pickNumber } from './random';
import { isAbnormal } from './status';
import type { ScopeNode } from './tree';

export const PHASE_LABEL = {
  detected: '이상 검출',
  notified: '알림 발송',
  inProgress: '조치 진행',
  resolved: '조치 완료',
} as const;

/** 이상이 있는 설비만 타임라인을 갖는다. 정상 가동 기간은 만들지 않는다 (SFR-015-01). */
function abnormalNodesOf(node: ScopeNode): ScopeNode[] {
  if (node.kind === 'root') {
    return getChildNodes(node.id)
      .flatMap((plant) => getChildNodes(plant.id))
      .filter((item) => isAbnormal(item.status))
      .slice(0, 12);
  }

  if (node.kind === 'plant') {
    return getChildNodes(node.id).filter((item) => isAbnormal(item.status));
  }

  if (node.kind === 'inverter') {
    const own = isAbnormal(node.status) ? [node] : [];

    return [...own, ...getChildNodes(node.id).filter((item) => isAbnormal(item.status))];
  }

  return isAbnormal(node.status) ? [node] : [];
}

function buildTimeline(node: ScopeNode): FaultTimeline {
  const next = createRandom(hashSeed(`${node.id}-timeline`));
  const inverter = getInverterById(node.inverterId);
  const faultCode = node.kind === 'inverter' ? inverter?.faultCode ?? null : null;
  const fault = getFaultCode(faultCode);
  // 통신단절는 AI 판별이 아니라 시스템이 잡아 낸 것이다 (SFR-015-02).
  const source: FaultTimeline['source'] = node.status === 'commLost' ? 'system' : 'ai';

  const daysAgoStart = Math.round(pickNumber(next, 2, 14));
  const startedAt = TODAY.subtract(daysAgoStart, 'day').hour(Math.round(pickNumber(next, 6, 16))).minute(Math.round(pickNumber(next, 0, 59)));
  // 절반쯤은 아직 조치가 끝나지 않은 상태로 둔다.
  const resolved = next() > 0.45;

  const steps: TimelineStep[] = [
    {
      phase: 'detected',
      at: startedAt.format('YYYY-MM-DD HH:mm'),
      note: source === 'system'
        ? 'RTU 미응답이 15분을 넘어 통신단절로 판정했습니다.'
        : `AI 고장분류가 ${withParticle(fault?.label ?? '진단 효율 저하', '로')} 분류했습니다.`,
      manual: false,
    },
    {
      phase: 'notified',
      at: startedAt.add(Math.round(pickNumber(next, 3, 25)), 'minute').format('YYYY-MM-DD HH:mm'),
      note: '담당자에게 알림을 보냈습니다.',
      manual: false,
    },
  ];

  const inProgressAt = startedAt.add(Math.round(pickNumber(next, 2, 30)), 'hour');

  if (resolved || next() > 0.35) {
    steps.push({
      phase: 'inProgress',
      at: inProgressAt.format('YYYY-MM-DD HH:mm'),
      note: fault ? fault.plan[0] : '현장 확인을 시작했습니다.',
      manual: true,
      actor: '시설 담당',
    });
  }

  const endedAt = resolved ? inProgressAt.add(Math.round(pickNumber(next, 1, 20)), 'hour') : null;

  if (endedAt) {
    steps.push({
      phase: 'resolved',
      at: endedAt.format('YYYY-MM-DD HH:mm'),
      note: source === 'system' ? '모뎀 전원을 재투입해 수집이 정상으로 돌아왔습니다.' : '조치를 마치고 출력이 회복됐습니다.',
      manual: true,
      actor: '시설 담당',
    });
  }

  return {
    id: `TL-${node.id}`,
    nodeId: node.id,
    deviceName: node.name,
    plantName: getNode(node.plantId).name,
    plantId: node.plantId ?? '',
    faultCode,
    source,
    startedAt: startedAt.format('YYYY-MM-DD HH:mm'),
    endedAt: endedAt ? endedAt.format('YYYY-MM-DD HH:mm') : null,
    steps,
    resolved,
    lossKwh: Math.round(pickNumber(next, 8, 240, 1)),
  };
}

const cache = new Map<string, FaultTimeline[]>();

/**
 * 고른 계층 아래의 고장 타임라인 (SFR-015).
 * 조회 범위를 선택한 발전소 소속으로 제한한다 (SFR-015-05).
 */
export function getFaultTimelines(node: ScopeNode): FaultTimeline[] {
  const cached = cache.get(node.id);

  if (cached) return cached;

  const rows = abnormalNodesOf(node)
    .map(buildTimeline)
    .sort((a, b) => dayjs(b.startedAt).valueOf() - dayjs(a.startedAt).valueOf());

  cache.set(node.id, rows);

  return rows;
}

/** 경과 시간(분). 조치가 끝나면 그때까지, 아니면 지금까지. */
export function timelineDurationMinutes(item: FaultTimeline): number {
  const end = item.endedAt ? dayjs(item.endedAt) : TODAY.endOf('day');

  return Math.max(0, end.diff(dayjs(item.startedAt), 'minute'));
}
