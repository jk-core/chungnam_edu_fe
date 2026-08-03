import type { Severity } from './status';

/** 접속 로그 한 건 (SER-001-19) */
export interface AccessLog {
  id: string;
  at: string;
  userId: string;
  userName: string;
  ip: string;
  menu: string;
  action: '조회' | '등록' | '수정' | '내려받기' | '로그인' | '로그아웃';
}

/** 보안 관제 이벤트 */
export interface SecurityEvent {
  id: string;
  at: string;
  severity: Severity;
  title: string;
  detail: string;
  /** 조치 여부 */
  handled: boolean;
}

/** 메뉴별 활용 통계 (SFR-028) */
export interface MenuUsage {
  menu: string;
  section: string;
  views: number;
  users: number;
}

/** 일별 로그인 추이 */
export interface LoginTrendPoint {
  date: string;
  success: number;
  fail: number;
}
