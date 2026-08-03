import dayjs from 'dayjs';
import type { Inverter } from '@/interface/equipment';
import type { School } from '@/interface/energy';
import { getFaultCode } from './faultCodes';
import { getInvertersOf } from './equipment';
import { getMonthDays } from './weather';
import { getSchoolById } from './schools';
import { INVERTER_TYPE_LABEL } from './equipment';
import { isAbnormal } from './status';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';

/** 목업 설비 모델명 — 등록 정보에 함께 실린다 (SFR-019-01) */
const INVERTER_MODELS = ['HSI-50KTL', 'SG-33CX', 'DAS-50TL', 'OSI-60KP'];
const MODULE_MODELS = ['HN-455JD', 'QP-460MB', 'LS-450NW'];

export interface MonthlyReport {
  schoolId: string;
  schoolName: string;
  year: number;
  month: number;
  /** 발전소 정보 요약 (SFR-019-01) */
  plantSummary: {
    plantName: string;
    address: string;
    capacityKw: number;
    inverterModel: string;
    inverterStructure: string;
    moduleModel: string;
    moduleStructure: string;
    installedAt: string;
  };
  /** 전월 대비 금월 일 단위 발전량 (SFR-019-02) */
  dailyCompare: { day: number; current: number; previous: number }[];
  /** 금월 인버터별 발전시간 (SFR-019-03/04) */
  inverterHours: { id: string; name: string; hours: number; kwh: number }[];
  /** 인버터별 AI 진단 — 정상 범위 대 실측 (SFR-020-01) */
  inverterDiagnosis: { id: string; name: string; normalLow: number; normalHigh: number; actual: number }[];
  /** 스트링 단위 진단 (SFR-020-02) */
  unitDiagnosis: { id: string; name: string; parent: string; normal: number; actual: number }[];
  /** 인버터별 일 단위 고장 분류 (SFR-020-03) */
  faultByDay: { id: string; name: string; codes: string[] }[];
  /** 조치방안 제안 (SFR-020-04) */
  recommendations: string[];
  /** 이상 발생 시 일상 점검 안내 (SFR-019-06) */
  routineGuides: string[];
  totalKwh: number;
  previousKwh: number;
}

function structureOf(inverter: Inverter): string {
  if (inverter.type === 'central') {
    const channels = inverter.junctionBoxes.reduce((sum, box) => sum + box.channels.length, 0);

    return `접속반 ${inverter.junctionBoxes.length}면 · 채널 ${channels}회로`;
  }

  return `스트링 ${inverter.strings.length}회로`;
}

const cache = new Map<string, MonthlyReport>();

/** 설비별 월간보고서 (SFR-019, SFR-020) */
export function getMonthlyReport(schoolId: string, year: number, month: number): MonthlyReport | null {
  const key = `${schoolId}-${year}-${month}`;
  const cached = cache.get(key);

  if (cached) return cached;

  const school: School | null = getSchoolById(schoolId);

  if (!school) return null;

  const next = createRandom(hashSeed(key));
  const inverters = getInvertersOf(school.id);
  const days = getMonthDays(school.id, year, month);
  const prevCursor = dayjs(new Date(year, month, 1)).subtract(1, 'month');
  const prevDays = getMonthDays(school.id, prevCursor.year(), prevCursor.month());

  const dailyCompare = days.map((day, index) => ({
    day: index + 1,
    current: day.generationKwh,
    previous: prevDays[index]?.generationKwh ?? 0,
  }));

  const monthKwh = days.reduce((sum, day) => sum + day.generationKwh, 0);
  const share = inverters.length > 0 ? 1 / inverters.length : 0;

  const inverterHours = inverters.map((inverter) => {
    const kwh = Math.round(monthKwh * share * pickNumber(next, 0.9, 1.1, 3));

    return {
      id: inverter.id,
      name: inverter.name,
      kwh,
      hours: inverter.capacityKw > 0 ? Math.round((kwh / inverter.capacityKw) * 10) / 10 : 0,
    };
  });

  // 정상 범위는 기대 발전량의 ±8% 로 잡고, 실측은 상태만큼 깎는다.
  const inverterDiagnosis = inverters.map((inverter, index) => {
    const expected = inverterHours[index]?.kwh ?? 0;
    const factor = inverter.status === 'fault' ? 0.62 : inverter.status === 'degraded' ? 0.84 : 1;

    return {
      id: inverter.id,
      name: inverter.name,
      normalLow: Math.round(expected * 0.92),
      normalHigh: Math.round(expected * 1.08),
      actual: Math.round(expected * factor),
    };
  });

  const unitDiagnosis = inverters.flatMap((inverter) => {
    const units = inverter.type === 'central' ? inverter.junctionBoxes : inverter.strings;

    return units.map((unit) => {
      const factor = unit.status === 'fault' ? 0.58 : unit.status === 'degraded' ? 0.82 : 1;

      return {
        id: unit.id,
        name: unit.name,
        parent: inverter.name,
        normal: 96,
        actual: Math.round(96 * factor * pickNumber(next, 0.97, 1.02, 3)),
      };
    });
  });

  const faultByDay = inverters.map((inverter) => ({
    id: inverter.id,
    name: inverter.name,
    codes: days.map(() => {
      if (!isAbnormal(inverter.status)) return 'F-000';

      return next() > 0.62 ? inverter.faultCode ?? 'F-000' : 'F-000';
    }),
  }));

  const abnormal = inverters.filter((inverter) => isAbnormal(inverter.status));
  const recommendations = abnormal.length === 0
    ? ['이번 달 조치가 필요한 항목은 없습니다. 다음 정기점검 주기를 지키면 됩니다.']
    : abnormal.map((inverter) => {
      const fault = getFaultCode(inverter.faultCode);

      return `${inverter.name} — ${fault ? `${fault.label}: ${fault.actions[0]}` : '진단 효율 저하 원인을 현장에서 확인하세요.'}`;
    });

  const report: MonthlyReport = {
    schoolId: school.id,
    schoolName: school.name,
    year,
    month,
    plantSummary: {
      plantName: school.name,
      address: school.address,
      capacityKw: school.capacityKw,
      inverterModel: pickOne(next, INVERTER_MODELS),
      inverterStructure: inverters.length > 0
        ? `${INVERTER_TYPE_LABEL[inverters[0].type]} ${inverters.length}대 · ${structureOf(inverters[0])}`
        : '인버터 정보 없음',
      moduleModel: pickOne(next, MODULE_MODELS),
      moduleStructure: `${Math.round(school.capacityKw / 0.455)}장 · ${Math.max(1, Math.round(school.capacityKw / 24))}직렬`,
      installedAt: school.installedAt,
    },
    dailyCompare,
    inverterHours,
    inverterDiagnosis,
    unitDiagnosis,
    faultByDay,
    recommendations,
    routineGuides: abnormal.length === 0
      ? ['모듈 표면 오염 상태를 눈으로 확인하세요.', '인버터 표시부 경고 코드를 확인하세요.']
      : [
        '이상이 검출된 인버터의 표시부 경고 코드를 먼저 확인하세요.',
        '접속함 퓨즈 도통과 커넥터 접촉 상태를 점검하세요.',
        '점검 결과는 현장보고서로 남겨 다음 달 보고서에 이어 주세요.',
      ],
    totalKwh: monthKwh,
    previousKwh: prevDays.reduce((sum, day) => sum + day.generationKwh, 0),
  };

  cache.set(key, report);

  return report;
}
