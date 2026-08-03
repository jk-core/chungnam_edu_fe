/** 점검 결과 3지 (SFR-021-02) */
export type CheckResult = 'normal' | 'abnormal' | 'na';

/** 보고서 상태 (SFR-021-08) */
export type ReportState = 'draft' | 'submitted' | 'reviewing' | 'confirmed';

export interface ChecklistItem {
  id: string;
  label: string;
  result: CheckResult | null;
  note: string;
}

/** 점검 양식 — 기관·점검 유형별로 갈린다 (SFR-021-14/15) */
export interface ReportTemplate {
  id: string;
  /** 정기 / 특별 */
  inspectType: '정기' | '특별';
  targetKind: 'inverter' | 'rtu' | 'plant';
  label: string;
  items: string[];
}

export interface ReportPhoto {
  id: string;
  name: string;
  /** 연결된 점검 항목 id (SFR-021-06) */
  itemId: string | null;
}

export interface FieldReport {
  id: string;
  schoolId: string;
  schoolName: string;
  templateId: string;
  inspectType: '정기' | '특별';
  targetKind: 'inverter' | 'rtu' | 'plant';
  targetName: string;
  inspector: string;
  date: string;
  state: ReportState;
  checklist: ChecklistItem[];
  photos: ReportPhoto[];
  summary: string;
  /** 조치 내용 — 월간보고서에 그대로 실린다 (SFR-021-20) */
  actionNote: string;
  history: { at: string; actor: string; change: string }[];
}
