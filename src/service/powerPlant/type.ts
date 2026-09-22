import { z } from 'zod';
import { ZodPhaseTypeCode, ZodStatusCode } from '@/configs/codes';
import { fileSchema } from '@/service/common';

/*
  일사량계 상태(`irradStatusCode`)는 발전 운전상태와 같은 축을 쓴다.
  일사량계가 달리지 않은 발전소는 null 이다.
*/

/**
 * 도 전체를 한 번에 준다 (300개 안팎). 거르기·쪽나눔은 화면이 받아 둔 배열 위에서 한다.
 * 필터를 서버로 넘기지 않는 이유는 지도다 — 클러스터가 전체 좌표를 쥐고 있어야 묶음 개수가 맞고,
 * 지역·상태를 토글할 때마다 다시 받으면 클러스터가 매번 새로 그려진다.
 *
 * 계측값은 싣지 않는다 — 마커를 눌렀을 때 markerInfo 로 그 한 곳만 받는다.
 */
export type PowerPlantListItem = z.infer<typeof powerPlantListItemSchema>;
export const powerPlantListItemSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  powerPlantType: z.string(),
  regionCode: z.string(),
  regionName: z.string(),
  address: z.string(),
  powerPlantCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  irradStatusCode: ZodStatusCode.CODE.nullable(),
  irradStatusName: ZodStatusCode.NAME.nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

/** 발전 추이 차트의 한 점 */
export type PowerPlantFlowChartPoint = z.infer<typeof powerPlantFlowChartPointSchema>;
export const powerPlantFlowChartPointSchema = z.object({
  dateTime: z.string(),
  /** 미수집이면 null */
  currentPower: z.number().nullable(),
});

/**
 * 마커를 눌렀을 때 오른쪽에 펼쳐지는 패널 한 벌.
 * 이름·주소도 함께 싣는다 — 그 패널이 그리는 것이라면 목록에 있든 없든 여기서 준다.
 */
export type PowerPlantMarkerInfo = z.infer<typeof powerPlantMarkerInfoSchema>;
export const powerPlantMarkerInfoSchema = z.object({
  powerPlantName: z.string(),
  powerPlantType: z.string(),
  address: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  irradStatusCode: ZodStatusCode.CODE.nullable(),
  irradStatusName: ZodStatusCode.NAME.nullable(),
  powerPlantCapacity: z.number(),
  currentOutput: z.number(),
  dayPower: z.number(),
  monthPower: z.number(),
  yearPower: z.number(),
  capacityFactor: z.number(),
  inverterCount: z.number().int(),
  flowChartData: z.array(powerPlantFlowChartPointSchema),
  photoList: z.array(fileSchema),
});

/**
 * 조회 대상 패널의 설비 트리. 발전소 → 인버터 → 스트링을 상태와 함께 펼친다.
 * 요약 줄(주소·일사량계 상태)은 목록에서 그 발전소 행을 집어 쓴다 — 여기서 또 주면 발전소를
 * 바꿀 때 요약이 이 응답을 기다렸다 바뀐다.
 */
export type PowerPlantHierarchyString = z.infer<typeof powerPlantHierarchyStringSchema>;
export const powerPlantHierarchyStringSchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  stringCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
});

export type PowerPlantHierarchyInverter = z.infer<typeof powerPlantHierarchyInverterSchema>;
export const powerPlantHierarchyInverterSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  equipmentCapacity: z.number(),
  phaseTypeCode: ZodPhaseTypeCode.CODE,
  phaseTypeName: ZodPhaseTypeCode.NAME,
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  stringList: z.array(powerPlantHierarchyStringSchema),
});

export type PowerPlantHierarchy = z.infer<typeof powerPlantHierarchySchema>;
export const powerPlantHierarchySchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  powerPlantCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  inverterList: z.array(powerPlantHierarchyInverterSchema),
});
