import type { DiagnosisFaultCode } from './equipment';
import type { Severity } from './energy';
import type { OperationStatus } from './status';

/** 알림 한 건 */
export interface AlertRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  regionName: string;
  deviceName: string;
  /** 이 알림이 가리키는 운전 상태. 통신단절은 값 자체가 끊긴 것이라 발전 이상과 갈린다. */
  status: OperationStatus;
  severity: Severity;
  /** 연결된 고장코드. 없을 수도 있다. */
  faultCode: DiagnosisFaultCode | null;
  title: string;
  description: string;
  /** 'YYYY-MM-DD HH:mm' */
  occurredAt: string;
  /** 아직 진행 중이면 null */
  resolvedAt: string | null;
  handled: boolean;
  /** 자동 복구가 아니라 사람이 조치한 건 */
  manual: boolean;
  handler: string | null;
  actionNote: string | null;
}

/** 알림 발생 조건 설정 */
export interface AlertRule {
  id: string;
  label: string;
  description: string;
  severity: Severity;
  /** 임계값 표기 (예: '15분') */
  threshold: string;
  enabled: boolean;
  channels: ('시스템' | '문자' | '메일')[];
}
