/** 점검 결과 3지 (SFR-021-02) */
export type CheckResult = 'normal' | 'abnormal' | 'na';

/**
 * 보고서 상태 (SFR-021-08).
 * `rejected` 는 앞으로 나아가는 단계가 아니라 검토에서 되돌린 자리다 —
 * 반려된 보고서는 고쳐서 다시 제출한다 (SFR-021-09).
 */
export type ReportState = 'draft' | 'submitted' | 'reviewing' | 'confirmed' | 'rejected';

export interface ChecklistItem {
  id: string;
  /** 속한 대분류 — 표준 점검표가 항목을 묶어 놓는다 (SFR-021-03) */
  section: string;
  label: string;
  result: CheckResult | null;
  note: string;
}

/** 점검 양식의 대분류 한 묶음 (SFR-021-03) */
export interface TemplateSection {
  title: string;
  items: string[];
}

/** 점검 양식 — 기관·점검 유형별로 갈린다 (SFR-021-14/15) */
export interface ReportTemplate {
  id: string;
  /** 정기 / 특별 */
  inspectType: '정기' | '특별';
  targetKind: 'inverter' | 'rtu' | 'plant';
  label: string;
  /** 개정 번호. 보고서는 작성 시점 번호를 박제한다 (SFR-021-14) */
  version: number;
  /** 이 판이 쓰이기 시작한 날 */
  revisedAt: string;
  sections: TemplateSection[];
}

/** 양식 개정 이력 한 줄 (SFR-021-14) */
export interface TemplateRevision {
  id: string;
  templateId: string;
  templateLabel: string;
  version: number;
  at: string;
  actor: string;
  note: string;
}

/**
 * 이 보고서에서 실제로 점검한 설비 (SFR-021-06).
 * 어느 설비를 보고 무엇이 특이했는지가 사진·항목과 따로 남는다.
 */
export interface InspectedDevice {
  id: string;
  /** 인버터 · RTU · 접속반처럼 설비 갈래 */
  kind: string;
  name: string;
  /** 이 설비에서 본 특이사항 */
  note: string;
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
  /** 작성 당시 양식 판 번호 — 양식이 개정돼도 이 보고서는 그때 문항 그대로다 (SFR-021-14) */
  templateVersion: number;
  inspectType: '정기' | '특별';
  targetKind: 'inverter' | 'rtu' | 'plant';
  targetName: string;
  inspector: string;
  date: string;
  state: ReportState;
  checklist: ChecklistItem[];
  /** 점검한 설비와 설비별 특이사항 (SFR-021-06) */
  devices: InspectedDevice[];
  photos: ReportPhoto[];
  summary: string;
  /** 조치 내용 — 월간보고서에 그대로 실린다 (SFR-021-20) */
  actionNote: string;
  /** 반려 사유. 반려된 적이 없으면 빈 문자열 (SFR-021-08) */
  rejectReason: string;
  /** 재제출 횟수 — 반려 후 고쳐 낸 만큼 오른다 (SFR-021-09) */
  resubmitCount: number;
  history: { at: string; actor: string; change: string }[];
}
