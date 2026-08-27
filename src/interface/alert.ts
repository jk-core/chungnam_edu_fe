import type { DiagnosisFaultCode } from './equipment';
import type { OperationStatus } from './status';

/** 알림이 실어 오는 구분 — 운전 상태 중 알릴 값만 추린다 */
export type AlarmStatus = Extract<OperationStatus, 'degraded' | 'fault' | 'commLost'>;

/** 알림 한 건 */
export interface AlertRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  regionName: string;
  deviceName: string;
  /** 알림 구분. 설비 운전 상태와 같은 축을 쓰되 주의·경고·통신단절 셋만 온다. */
  status: AlarmStatus;
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
  /** 이 규칙이 발생시키는 알림 구분 */
  status: AlarmStatus;
  /** 임계값 표기 (예: '15분') */
  threshold: string;
  enabled: boolean;
  channels: ('시스템' | '문자' | '메일')[];
}
