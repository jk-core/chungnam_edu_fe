import { z } from 'zod';

/**
 * 조회 기간은 세 블록이 같은 dayCount 를 받아 함께 움직인다.
 * 화면 문구가 「30일 화면 조회」처럼 일수를 그대로 적으므로 기간을 서버가 고정하지 않는다 —
 * 프론트가 보낸 값이 곧 화면에 적히는 값이다.
 */
export type ManageUsageParams = z.infer<typeof manageUsageParamsSchema>;
export const manageUsageParamsSchema = z.object({
  dayCount: z.number().int(),
});

export type ManageUsageOverview = z.infer<typeof manageUsageOverviewSchema>;
export const manageUsageOverviewSchema = z.object({
  viewCount: z.number().int(),
  loginSuccessCount: z.number().int(),
  topMenuName: z.string(),
  topMenuViewCount: z.number().int(),
});

/**
 * 화면별 조회수·이용자수. 가로 막대와 아래 표가 같은 응답을 본다.
 *
 * 조회수 내림차순으로 정렬해 준다 — 막대는 상위 10개만 그리고 표는 전부 그린다.
 * 비중(%)은 내려주지 않는다: 표의 숫자는 전체 조회수 대비, 막대 길이는 1위 대비라 분모가
 * 서로 다르다. menuCode 로 행을 가른다 — 화면명이 같은 메뉴가 생겨도 섞이지 않아야 한다.
 */
export type ManageUsageMenu = z.infer<typeof manageUsageMenuSchema>;
export const manageUsageMenuSchema = z.object({
  menuCode: z.string(),
  menuName: z.string(),
  sectionName: z.string(),
  viewCount: z.number().int(),
  userCount: z.number().int(),
});

/** 요약 카드의 로그인 수는 성공만 센다 — 이 배열의 successCount 합과 같아야 한다 */
export type ManageUsageLoginChart = z.infer<typeof manageUsageLoginChartSchema>;
export const manageUsageLoginChartSchema = z.object({
  dateTime: z.string(),
  successCount: z.number().int(),
  failCount: z.number().int(),
});
