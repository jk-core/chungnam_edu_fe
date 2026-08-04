import type { DiagnosisFaultCode } from './equipment';
import type { Severity } from './energy';

export type AlertType = '통신' | '발전' | '설비' | '환경';

/** 알림 한 건 */
export interface AlertRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  regionName: string;
  deviceName: string;
  type: AlertType;
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
  type: AlertType;
  severity: Severity;
  /** 임계값 표기 (예: '15분') */
  threshold: string;
  enabled: boolean;
  channels: ('시스템' | '문자' | '메일')[];
}
