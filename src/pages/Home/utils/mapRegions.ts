import type { KoreaMapRegion } from '@/components/common/KoreaMap';
import type { HomeRegion } from '@/service/home/type';

/**
 * 홈 전국 지도용 시도 매핑.
 *
 * 지도는 도(道) 단위 9개만 그린다. REMS·통계청 시도코드에서 광역시는
 * 소속 도로 합친다 (서울·인천 → 경기, 대전·세종 → 충남 등).
 */

export type MapRegion = KoreaMapRegion;

/** 시도코드(앞 2자리 또는 전체) → 지도 키 */
const CITY_CODE_TO_MAP: Record<string, string> = {
  '11': 'gyeonggi', // 서울
  '26': 'gyeongnam', // 부산
  '27': 'gyeongbuk', // 대구
  '28': 'gyeonggi', // 인천
  '29': 'jeonnam', // 광주
  '30': 'chungnam', // 대전
  '31': 'gyeongnam', // 울산
  '36': 'chungnam', // 세종
  '41': 'gyeonggi',
  '42': 'gangwon',
  '51': 'gangwon', // 강원 특례
  '43': 'chungbuk',
  '44': 'chungnam',
  '45': 'jeonbuk',
  '52': 'jeonbuk', // 전북 특례
  '46': 'jeonnam',
  '47': 'gyeongbuk',
  '48': 'gyeongnam',
  '50': 'jeju',
};

/** 지도에 표시하는 도 이름 (라벨·순위용) */
const MAP_LABEL: Record<string, string> = {
  gyeonggi: '경기도',
  gangwon: '강원도',
  chungbuk: '충청북도',
  chungnam: '충청남도',
  jeonbuk: '전라북도',
  jeonnam: '전라남도',
  gyeongbuk: '경상북도',
  gyeongnam: '경상남도',
  jeju: '제주도',
};

/** 이름에 포함된 키워드로 보조 매칭 */
const NAME_HINTS: { hint: string; code: string }[] = [
  { hint: '서울', code: 'gyeonggi' },
  { hint: '인천', code: 'gyeonggi' },
  { hint: '경기', code: 'gyeonggi' },
  { hint: '강원', code: 'gangwon' },
  { hint: '충북', code: 'chungbuk' },
  { hint: '충청북', code: 'chungbuk' },
  { hint: '대전', code: 'chungnam' },
  { hint: '세종', code: 'chungnam' },
  { hint: '충남', code: 'chungnam' },
  { hint: '충청남', code: 'chungnam' },
  { hint: '전북', code: 'jeonbuk' },
  { hint: '전라북', code: 'jeonbuk' },
  { hint: '광주', code: 'jeonnam' },
  { hint: '전남', code: 'jeonnam' },
  { hint: '전라남', code: 'jeonnam' },
  { hint: '대구', code: 'gyeongbuk' },
  { hint: '경북', code: 'gyeongbuk' },
  { hint: '경상북', code: 'gyeongbuk' },
  { hint: '부산', code: 'gyeongnam' },
  { hint: '울산', code: 'gyeongnam' },
  { hint: '경남', code: 'gyeongnam' },
  { hint: '경상남', code: 'gyeongnam' },
  { hint: '제주', code: 'jeju' },
];

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapCodeOf(cityCode: string, cityName: string): string | null {
  const normalized = cityCode.replace(/\D/g, '');
  const prefix = normalized.slice(0, 2);
  const byCode = CITY_CODE_TO_MAP[prefix] ?? CITY_CODE_TO_MAP[normalized];

  if (byCode) return byCode;

  return NAME_HINTS.find((item) => cityName.includes(item.hint))?.code ?? null;
}

/**
 * API 시도 목록을 지도용 도 단위로 접는다.
 * 같은 도에 묶인 광역시·도는 단순 평균한다 (설비용량 가중치가 API에 없음).
 */
export function toMapRegions(rows: HomeRegion[]): MapRegion[] {
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    const code = mapCodeOf(row.cityCode, row.cityName);

    if (!code) continue;

    const list = buckets.get(code);

    if (list) list.push(row.powerTime);
    else buckets.set(code, [row.powerTime]);
  }

  return [...buckets.entries()]
    .map(([code, values]) => {
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

      return {
        code,
        name: MAP_LABEL[code] ?? code,
        avgGenerationHours: roundHours(avg),
      };
    })
    .sort((a, b) => b.avgGenerationHours - a.avgGenerationHours);
}

export function nationalAverageOf(regions: MapRegion[]): number {
  if (regions.length === 0) return 0;

  const sum = regions.reduce((total, item) => total + item.avgGenerationHours, 0);

  return roundHours(sum / regions.length);
}

export function nationalRankOf(regions: MapRegion[], code: string): number {
  return regions.findIndex((item) => item.code === code) + 1;
}
