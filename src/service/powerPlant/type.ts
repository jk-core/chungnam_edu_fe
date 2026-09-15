import { z } from 'zod';
import { ZodStatusCode } from '@/configs/codes';
import { fileSchema } from '@/service/common';

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
  irradStatusCode: z.number().int().nullable(),
  irradStatusName: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

/**
 * 조회 대상 패널의 설비 트리. 발전소 → 인버터 → 스트링을 상태와 함께 펼친다.
 * 요약 줄(주소·일사량계 상태)은 목록에서 그 발전소 행을 집어 쓴다 — 여기서 또 주면 발전소를
 * 바꿀 때 요약이 이 응답을 기다렸다 바뀐다.
 */
export type PowerPlantHierarchyParams = z.infer<typeof powerPlantHierarchyParamsSchema>;
export const powerPlantHierarchyParamsSchema = z.object({
  powerPlantId: z.number().int(),
});

export type PowerPlantHierarchy = z.infer<typeof powerPlantHierarchySchema>;
export const powerPlantHierarchySchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  powerPlantCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  inverterList: z.array(z.object({
    cid: z.number().int(),
    equipmentName: z.string(),
    equipmentCapacity: z.number(),
    phaseTypeCode: z.number().int(),
    phaseTypeName: z.string(),
    statusCode: ZodStatusCode.CODE,
    statusName: ZodStatusCode.NAME,
    stringList: z.array(z.object({
      stringId: z.number().int(),
      stringName: z.string(),
      stringCapacity: z.number(),
      statusCode: ZodStatusCode.CODE,
      statusName: ZodStatusCode.NAME,
    })),
  })),
});

/**
 * 마커를 눌렀을 때 오른쪽에 펼쳐지는 패널 한 벌.
 * 이름·주소도 함께 싣는다 — 그 패널이 그리는 것이라면 목록에 있든 없든 여기서 준다.
 */
export type PowerPlantMarkerInfoParams = z.infer<typeof powerPlantMarkerInfoParamsSchema>;
export const powerPlantMarkerInfoParamsSchema = z.object({
  powerPlantId: z.number().int(),
});

export type PowerPlantMarkerInfo = z.infer<typeof powerPlantMarkerInfoSchema>;
export const powerPlantMarkerInfoSchema = z.object({
  powerPlantName: z.string(),
  powerPlantType: z.string(),
  address: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  irradStatusCode: z.number().int().nullable(),
  irradStatusName: z.string().nullable(),
  powerPlantCapacity: z.number(),
  currentOutput: z.number(),
  dayPower: z.number(),
  monthPower: z.number(),
  yearPower: z.number(),
  capacityFactor: z.number(),
  inverterCount: z.number().int(),
  flowChartData: z.array(z.object({
    dateTime: z.string(),
    /** 미수집이면 null */
    currentPower: z.number().nullable(),
  })),
  photoList: z.array(fileSchema),
});

/**
 * 등록 제원 조회 전용.
 * 관리자 콘솔의 `/manage/powerPlant/detail` 과 달리 코드값 대신 이름으로 준다.
 */
export type PowerPlantInfoParams = z.infer<typeof powerPlantInfoParamsSchema>;
export const powerPlantInfoParamsSchema = z.object({
  powerPlantId: z.number().int(),
});

export type PowerPlantInfo = z.infer<typeof powerPlantInfoSchema>;
export const powerPlantInfoSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  powerPlantType: z.string(),
  regionName: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  powerPlantCapacity: z.number(),
  rtuEnterpriseName: z.string(),
  installerName: z.string(),
  installerPhone: z.string(),
  managerEnterpriseName: z.string(),
  managerEnterprisePhone: z.string(),
  managerName: z.string(),
  managerPhone: z.string(),
  etc: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  latitude: z.number(),
  longitude: z.number(),
  rtu: z.object({
    model: z.string(),
    serial: z.string(),
    firmware: z.string(),
    intervalMinute: z.number().int(),
    /* RTU 통신상태는 발전 운전상태와 다른 축이고 코드값이 미정이다 (configs/codes.ts) */
    statusCode: z.number().int(),
    statusName: z.string(),
    lastGathDtm: z.string().nullable(),
  }).nullable(),
  irrad: z.object({
    irradId: z.number().int(),
    irradName: z.string(),
    rtuPort: z.number().int(),
    calibrationFactor: z.number(),
    isModTemp: z.boolean(),
    /* 일사량계 상태는 발전 운전상태와 다른 축이고 코드값이 미정이다 (configs/codes.ts) */
    statusCode: z.number().int(),
    statusName: z.string(),
  }).nullable(),
  inverterList: z.array(z.object({
    cid: z.number().int(),
    equipmentName: z.string(),
    equipmentCapacity: z.number(),
    inverterEnterpriseName: z.string(),
    inverterName: z.string(),
    moduleName: z.string(),
    /** 모듈장수 (직렬×병렬 합) */
    moduleCount: z.number().int(),
    moduleSerialCount: z.number().int(),
    moduleParallelCount: z.number().int(),
    moduleSerialCountSecond: z.number().int(),
    moduleParallelCountSecond: z.number().int(),
    installDate: z.string(),
    rtuCommunicationId: z.string(),
    rtuPort: z.number().int(),
    /** 한 번도 수집되지 않은 설비는 없다 */
    lastGathDtm: z.string().nullable(),
    statusCode: ZodStatusCode.CODE,
    statusName: ZodStatusCode.NAME,
  })),
  photoList: z.array(fileSchema),
});
