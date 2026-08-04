import type { DiagnosisFaultCode } from './equipment';

/** 고장 처리 단계 (SFR-015-01) */
export type TimelinePhase = 'detected' | 'notified' | 'inProgress' | 'resolved';

export interface TimelineStep {
  phase: TimelinePhase;
  at: string;
  note: string;
  /** 관리자가 직접 넣은 이력. 전용 표시로 갈라 보여 준다 (SFR-015-03) */
  manual: boolean;
  /** 누가 넣었는지 */
  actor?: string;
}

export interface FaultTimeline {
  id: string;
  nodeId: string;
  /** 설비 이름 (인버터·스트링) */
  deviceName: string;
  /** 소속 발전소 */
  plantName: string;
  plantId: string;
  faultCode: DiagnosisFaultCode | null;
  /** AI 판별 고장인지, 시스템이 잡은 통신 장애인지 (SFR-015-02) */
  source: 'ai' | 'system';
  /** 이상 발생 구간 시작 */
  startedAt: string;
  /** 조치 완료 시각. 아직이면 null */
  endedAt: string | null;
  steps: TimelineStep[];
  resolved: boolean;
  /** 추정 발전 손실(kWh) */
  lossKwh: number;
}
