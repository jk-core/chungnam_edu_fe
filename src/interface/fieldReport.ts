/**
 * 점검 결과 (SFR-021-02).
 *
 * 표준 체크리스트가 「양호 / 미흡」 둘로만 표시하므로 이름표도 그 말을 쓴다. 다만 요구사항이
 * 3지를 적어 두었고, 현장에는 그 설비가 아예 없어 볼 것이 없는 칸이 실제로 생긴다 —
 * 「해당없음」 을 없애면 그런 칸을 「양호」 로 적게 되어 점검한 것과 구분되지 않는다.
 */
export type CheckResult = 'normal' | 'abnormal' | 'na';

/**
 * 점검대상 구분 (targetType).
 *
 * 발전소를 통째로 본 점검과 인버터 한 대를 본 점검이 뒤에 나란히 남으므로, 무엇을 겨눈
 * 점검인지가 보고서에 남아야 한다. 접속반은 이 프로젝트 설비 계층에 없어 두지 않는다.
 */
export type InspectionTarget = '전체' | 'RTU' | '인버터' | '모듈 어레이' | '일사량계' | '기타';

/**
 * 보고서 상태 (SFR-021-08).
 * `rejected` 는 앞으로 나아가는 단계가 아니라 검토에서 되돌린 자리다 —
 * 반려된 보고서는 고쳐서 다시 제출한다 (SFR-021-09).
 */
export type ReportState = 'draft' | 'submitted' | 'reviewing' | 'confirmed' | 'rejected';

export interface ChecklistItem {
  id: string;
  label: string;
  result: CheckResult | null;
  note: string;
}

/**
 * 점검 양식 — 기관·점검 유형별로 갈리며, 이번 회차를 언제까지 내는지도 함께 갖는다
 * (SFR-021-14/15/19).
 *
 * 일정을 따로 두지 않고 양식이 겸한다. 다음 회차를 열 때는 문항을 그대로 두고 기간만 고친다 —
 * **그때는 판 번호가 오르지 않는다.** 판은 문항이 바뀔 때만 오르므로 개정 이력이 「무엇을
 * 고쳤는가」만 가리킨다.
 */
export interface ReportTemplate {
  id: string;
  /** 정기 / 특별 */
  inspectType: '정기' | '특별';
  /** 이 양식이 겨눈 대상. 보고서를 새로 쓸 때 기본값이 된다 */
  targetType: InspectionTarget;
  label: string;
  /** 개정 번호. 보고서는 작성 시점 번호를 박제한다 (SFR-021-14) */
  version: number;
  /** 이 판이 쓰이기 시작한 날 */
  revisedAt: string;
  /** 이번 회차를 낼 수 있게 열리는 날 (SFR-021-19) */
  startDate: string;
  /** 이번 회차 마감기한 (SFR-021-19) */
  dueDate: string;
  /** 점검 문항. 차례가 곧 순번이다 */
  items: string[];
}

/** 이번 회차를 냈는가 — 시작일~마감기한 사이에 낸 보고서가 있으면 완료다 (SFR-021-19) */
export type ScheduleProgress = 'done' | 'scheduled' | 'overdue';

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
  /** 이번 점검이 무엇을 겨눴는지 — 작성자가 고른다 */
  targetType: InspectionTarget;
  inspector: string;
  /** 점검자 연락처 */
  inspectorPhone: string;
  date: string;
  state: ReportState;
  checklist: ChecklistItem[];
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
