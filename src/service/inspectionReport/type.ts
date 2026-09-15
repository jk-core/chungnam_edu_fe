import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { INSPECTION_TARGET_OPTIONS } from '@/mocks/fieldReport';
import { fileSchema, fileToRemoveSchema, pagingParamsSchema } from '@/service/common';

export const LABEL_MAX = 60;
export const CHECK_NAME_MAX = 200;
export const REVISION_NOTE_MAX = 200;

/**
 * 점검결과는 문항마다 한 글자로 주고받고, BE 가 문항 순번대로 이어 붙여 한 문자열로 저장한다
 * (`01000-0110--`). 임시저장에서 안 고른 문항은 BE 가 `-` 로 치환해 직렬화하므로,
 * 다시 열었을 때 응답은 언제나 빈 자리 없이 채워져 있다.
 */
export type CheckResultMark = z.infer<typeof checkResultMarkSchema>;
export const checkResultMarkSchema = z.enum(['1', '0', '-']);

/**
 * 예정·지연은 endDate 와 오늘을 견주어 화면이 가린다 — 서버가 셋으로 미리 매기지 않는다.
 * isComplete 는 「이 발전소가 이 양식으로 보고서를 냈는가」만 말한다.
 */
export type InspectionReportScheduleParams = z.infer<typeof inspectionReportScheduleParamsSchema>;
export const inspectionReportScheduleParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
});

export type InspectionReportSchedule = z.infer<typeof inspectionReportScheduleSchema>;
export const inspectionReportScheduleSchema = z.object({
  templateId: z.number().int(),
  templateName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reportTypeCode: z.number().int(),
  reportTypeName: z.string(),
  targetTypeCode: z.number().int(),
  targetTypeName: z.string(),
  isComplete: z.boolean(),
});

/** 작성 폼이 문항을 받는 자리. 여기서 받은 checkId 로 결과를 실어 보낸다 */
export type InspectionReportTemplateDetailParams = z.infer<typeof inspectionReportTemplateDetailParamsSchema>;
export const inspectionReportTemplateDetailParamsSchema = z.object({
  templateId: z.number().int(),
});

export type InspectionReportTemplateDetail = z.infer<typeof inspectionReportTemplateDetailSchema>;
export const inspectionReportTemplateDetailSchema = z.object({
  templateId: z.number().int(),
  templateName: z.string(),
  /** 판번호 — 보고서가 작성 시점 판을 박제한다 */
  version: z.number().int(),
  reportTypeCode: z.number().int(),
  reportTypeName: z.string(),
  targetTypeCode: z.number().int(),
  targetTypeName: z.string(),
  checkList: z.array(z.object({
    checkId: z.number().int(),
    checkName: z.string(),
    /** 문항순번 — 양식 전역 연번 */
    checkSeqOrder: z.number().int(),
  })),
});

/** 목록은 요약만 싣는다 — 문항·사진·이력은 상세에서 받는다 */
export type InspectionReportListParams = z.infer<typeof inspectionReportListParamsSchema>;
export const inspectionReportListParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
});

export type InspectionReportListItem = z.infer<typeof inspectionReportListItemSchema>;
export const inspectionReportListItemSchema = z.object({
  inspectionReportId: z.number().int(),
  inspectionReportName: z.string(),
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  inspectionDate: z.string(),
  inspectorName: z.string(),
  abnormalCount: z.number().int(),
  reportTypeCode: z.number().int(),
  reportTypeName: z.string(),
  targetTypeCode: z.number().int(),
  targetTypeName: z.string(),
  stateCode: z.number().int(),
  stateName: z.string(),
});

export type InspectionReportDetailParams = z.infer<typeof inspectionReportDetailParamsSchema>;
export const inspectionReportDetailParamsSchema = z.object({
  inspectionReportId: z.number().int(),
});

/** 상세·인쇄가 쓰는 한 벌. 문항·사진·이력이 여기 실린다 */
export type InspectionReportDetail = z.infer<typeof inspectionReportDetailSchema>;
export const inspectionReportDetailSchema = inspectionReportListItemSchema.extend({
  templateId: z.number().int(),
  templateName: z.string(),
  /** 작성 시점 판번호 */
  templateVersion: z.number().int(),
  inspectorPhone: z.string(),
  /** 반려된 적 없으면 빈 문자열 */
  rejectReason: z.string(),
  checkList: z.array(z.object({
    checkId: z.number().int(),
    checkName: z.string(),
    checkSeqOrder: z.number().int(),
    result: checkResultMarkSchema,
    note: z.string(),
  })),
  photoList: z.array(fileSchema),
  historyList: z.array(z.object({
    actionDtm: z.string(),
    userName: z.string(),
    changeContent: z.string(),
  })),
});

/**
 * 임시저장과 제출을 stateCode 로 가른다 — 임시저장이면 아직 안 고른 문항의 result 를 null 로
 * 보내고 BE 가 `-` 로 치환해 직렬화한다.
 *
 * 발전소 용량·주소는 싣지 않는다: 발전소 등록 정보가 갖고 있어 두 곳에 적히면 어느 쪽이 맞는지
 * 판단할 근거가 없다. 사진은 fileList part 로 개수만큼 반복하고 나머지 본문은 json part 하나다.
 */
export type InspectionReportAddParams = z.infer<typeof inspectionReportAddSchema>;
export const inspectionReportAddSchema = z.object({
  powerPlantId: z.number().int(),
  templateId: z.number().int(),
  inspectionReportName: z.string(),
  inspectionDate: z.string(),
  inspectorName: z.string(),
  inspectorPhone: z.string(),
  targetTypeCode: z.number().int(),
  /** 작성중 · 제출완료 */
  stateCode: z.number().int(),
  fileList: z.array(z.instanceof(File)).optional(),
  checkList: z.array(z.object({
    checkId: z.number().int(),
    /** 임시저장은 null 을 허용한다 */
    result: checkResultMarkSchema.nullable(),
    note: z.string(),
  })),
});

/**
 * 수정과 상태 전이를 겸한다 — 작성중·제출완료·반려 건을 열어 고쳐 내면 실린 stateCode 로
 * 상태가 바뀐다. 검토중·확인완료 건은 서버가 거부한다.
 *
 * removeFileList 는 상세 응답 photoList 의 fileId·fileSeq 를 그대로 돌려보낸다 —
 * fileId 는 보고서 한 건의 첨부 묶음을 가리켜 혼자서는 사진 한 장을 특정하지 못한다.
 */
export type InspectionReportModifyParams = z.infer<typeof inspectionReportModifySchema>;
export const inspectionReportModifySchema = inspectionReportAddSchema.extend({
  inspectionReportId: z.number().int(),
  removeFileList: z.array(fileToRemoveSchema).optional(),
});

/**
 * 같은 발전소·같은 문항이 기간 안에 2회 이상 미흡으로 잡힌 것만 센다. 작성중 건은 뺀다.
 * 서버가 세야 정확하다 — 화면이 걸러진 목록만 보고 세면 발전소를 바꿀 때 수가 달라진다.
 */
export type InspectionReportRepeatIssueParams = z.infer<typeof inspectionReportRepeatIssueParamsSchema>;
export const inspectionReportRepeatIssueParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
  /** 집계기간(일) */
  windowDay: z.number().int(),
});

export type InspectionReportRepeatIssue = z.infer<typeof inspectionReportRepeatIssueSchema>;
export const inspectionReportRepeatIssueSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  checkName: z.string(),
  issueCount: z.number().int(),
  lastInspectionDate: z.string(),
});

// ── 관리자 콘솔 ────────────────────────────────────────────

export type ManageInspectionReportPageParams = z.infer<typeof manageInspectionReportPageParamsSchema>;
export const manageInspectionReportPageParamsSchema = pagingParamsSchema.extend({
  stateCode: z.number().int().optional(),
  /** 발전소명·점검자·보고서번호 검색어 */
  keyword: z.string().optional(),
});

export type ManageInspectionReportPage = z.infer<typeof manageInspectionReportPageSchema>;
export const manageInspectionReportPageSchema = inspectionReportListItemSchema.omit({
  targetTypeCode: true,
  targetTypeName: true,
});

/**
 * 검토자가 매기는 전이다 — 검토중·확인완료·반려. 단계를 밟지 않고 셋 중 하나를 곧바로 고른다.
 * 본문을 건드리지 않아 상태만 바꾼다. 작성자가 내는 제출은 `PUT /inspectionReport` 가 겸한다.
 */
export type ManageInspectionReportModifyParams = z.infer<typeof manageInspectionReportModifySchema>;
export const manageInspectionReportModifySchema = z.object({
  inspectionReportId: z.number().int(),
  stateCode: z.number().int(),
  /** 반려일 때만 */
  rejectReason: z.string().optional(),
});

export type ManageInspectionReportTemplatePageParams = z.infer<typeof manageInspectionReportTemplatePageParamsSchema>;
export const manageInspectionReportTemplatePageParamsSchema = pagingParamsSchema;

export type ManageInspectionReportTemplatePage = z.infer<typeof manageInspectionReportTemplatePageSchema>;
export const manageInspectionReportTemplatePageSchema = z.object({
  templateId: z.number().int(),
  templateName: z.string(),
  targetTypeCode: z.number().int(),
  targetTypeName: z.string(),
  reportTypeCode: z.number().int(),
  reportTypeName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  version: z.number().int(),
});

export type ManageInspectionReportTemplateAddParams = z.infer<typeof manageInspectionReportTemplateAddSchema>;
export const manageInspectionReportTemplateAddSchema = z.object({
  templateName: z.string().trim().min(1, MSG.requiredField('양식명')).max(LABEL_MAX, MSG.tooLong('양식명', LABEL_MAX)),
  reportTypeCode: z.number().int(),
  targetTypeCode: z.number().int(),
  startDate: z.string().min(1, MSG.selectRequired('시작일')),
  endDate: z.string().min(1, MSG.selectRequired('마감기한')),
  /** 문항 (순번은 배열 차례) */
  checkNameList: z.array(z.string()),
});

export type ManageInspectionReportTemplateModifyParams = z.infer<typeof manageInspectionReportTemplateModifySchema>;
export const manageInspectionReportTemplateModifySchema = manageInspectionReportTemplateAddSchema.extend({
  templateId: z.number().int(),
  /** 변경사유 — 문항이 바뀐 때만 판이 오른다 */
  fixRemark: z.string(),
});

export type ManageInspectionReportTemplateRemoveParams = z.infer<typeof manageInspectionReportTemplateRemoveParamsSchema>;
export const manageInspectionReportTemplateRemoveParamsSchema = z.object({
  templateId: z.number().int(),
});

/** 어느 판에서 무엇을 왜 고쳤는지. 최근 판이 위로 온다 */
export type ManageInspectionReportTemplateRevisionParams = z.infer<typeof manageInspectionReportTemplateRevisionParamsSchema>;
export const manageInspectionReportTemplateRevisionParamsSchema = z.object({
  templateId: z.number().int(),
});

export type ManageInspectionReportTemplateRevision = z.infer<typeof manageInspectionReportTemplateRevisionSchema>;
export const manageInspectionReportTemplateRevisionSchema = z.object({
  version: z.number().int(),
  fixRemark: z.string(),
  updatedDtm: z.string(),
  userName: z.string(),
});

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 점검 양식 등록·수정 폼 (SFR-021-14/19).
 *
 * 요청 스키마를 그대로 넓히지 못하는 자리가 둘이다.
 * - 점검유형·점검대상은 **코드값이 미정**이라 이름을 들고 있는다 (`reportTypeName`·`targetTypeName`).
 * - 문항은 계약이 문자열 배열이지만 편집판은 행마다 오류를 붙여야 해 객체 배열로 든다.
 *   빈 행은 문항으로 세지 않는다 — 비워 둔 채 저장한 행이 문항이 되면 점검자가 헛클릭한다.
 *
 * 판 번호는 폼이 정하지 않는다: 새 양식은 1 판, **문항을 고칠 때만** 한 판 오른다.
 * 기간은 이번 회차를 언제까지 내는지다 — 다음 회차는 이 두 날짜만 고쳐 연다.
 * `needsNote` 는 문항이 실제로 바뀌었는지다. 기간만 고쳤으면 남길 개정이 없어 받지 않는다.
 */
export type TemplateFormValues = z.infer<ReturnType<typeof templateFormSchema>>;
export function templateFormSchema(isNew: boolean, needsNote: boolean) {
  return manageInspectionReportTemplateAddSchema
    .omit({ reportTypeCode: true, targetTypeCode: true, checkNameList: true })
    .extend({
      reportTypeName: z.enum(['정기점검', '특별점검']),
      targetTypeName: z.enum(INSPECTION_TARGET_OPTIONS),
      checkList: z
        .array(z.object({
          checkName: z
            .string()
            .trim()
            .min(1, MSG.requiredField('문항'))
            .max(CHECK_NAME_MAX, MSG.tooLong('문항', CHECK_NAME_MAX)),
        }))
        .min(1, '문항을 한 개 이상 적어 주세요.'),
      /** 무엇을 왜 고쳤는지. 새로 세우거나 기간만 고쳤을 때는 남길 앞 판이 없어 받지 않는다 */
      fixRemark: isNew || !needsNote
        ? z.string()
        : z
          .string()
          .trim()
          .min(1, MSG.requiredField('개정 사유'))
          .max(REVISION_NOTE_MAX, MSG.tooLong('개정 사유', REVISION_NOTE_MAX)),
    })
    .superRefine((values, ctx) => {
      if (values.endDate < values.startDate) {
        ctx.addIssue({ code: 'custom', path: ['endDate'], message: '마감기한은 시작일보다 앞설 수 없습니다.' });
      }
    });
}
