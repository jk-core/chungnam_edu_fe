import type { Region } from '@/interface/energy';

/**
 * 충청남도 15개 시·군. 학교 수·용량은 목업 값이다.
 * center 는 실제 행정구역 중심에 가까운 좌표로, 지도에 발전소 마커를 흩뿌리는 기준이 된다.
 */
export const REGIONS: Region[] = [
  { code: 'cheonan', name: '천안시', schoolCount: 68, capacityKw: 6420, todayKwh: 27840, monthKwh: 742500, center: { lng: 127.114, lat: 36.815 } },
  { code: 'asan', name: '아산시', schoolCount: 47, capacityKw: 4380, todayKwh: 19260, monthKwh: 508300, center: { lng: 127.002, lat: 36.79 } },
  { code: 'seosan', name: '서산시', schoolCount: 33, capacityKw: 3140, todayKwh: 14180, monthKwh: 372900, center: { lng: 126.45, lat: 36.785 } },
  { code: 'dangjin', name: '당진시', schoolCount: 29, capacityKw: 2760, todayKwh: 12490, monthKwh: 327400, center: { lng: 126.646, lat: 36.89 } },
  { code: 'nonsan', name: '논산시', schoolCount: 26, capacityKw: 2280, todayKwh: 10120, monthKwh: 268100, center: { lng: 127.099, lat: 36.187 } },
  { code: 'gongju', name: '공주시', schoolCount: 24, capacityKw: 2010, todayKwh: 8860, monthKwh: 234700, center: { lng: 127.119, lat: 36.447 } },
  { code: 'boryeong', name: '보령시', schoolCount: 22, capacityKw: 1890, todayKwh: 8570, monthKwh: 226300, center: { lng: 126.613, lat: 36.333 } },
  { code: 'hongseong', name: '홍성군', schoolCount: 19, capacityKw: 1620, todayKwh: 7240, monthKwh: 191800, center: { lng: 126.661, lat: 36.601 } },
  { code: 'yesan', name: '예산군', schoolCount: 17, capacityKw: 1430, todayKwh: 6310, monthKwh: 167500, center: { lng: 126.845, lat: 36.683 } },
  { code: 'buyeo', name: '부여군', schoolCount: 16, capacityKw: 1340, todayKwh: 5920, monthKwh: 156900, center: { lng: 126.91, lat: 36.276 } },
  { code: 'geumsan', name: '금산군', schoolCount: 14, capacityKw: 1150, todayKwh: 4980, monthKwh: 132400, center: { lng: 127.452, lat: 36.132 } },
  { code: 'seocheon', name: '서천군', schoolCount: 13, capacityKw: 1080, todayKwh: 4830, monthKwh: 128200, center: { lng: 126.692, lat: 36.08 } },
  { code: 'taean', name: '태안군', schoolCount: 12, capacityKw: 980, todayKwh: 4560, monthKwh: 120600, center: { lng: 126.298, lat: 36.746 } },
  { code: 'cheongyang', name: '청양군', schoolCount: 9, capacityKw: 720, todayKwh: 3210, monthKwh: 85200, center: { lng: 126.802, lat: 36.459 } },
  { code: 'gyeryong', name: '계룡시', schoolCount: 7, capacityKw: 580, todayKwh: 2540, monthKwh: 67300, center: { lng: 127.249, lat: 36.274 } },
];

export const REGION_TOTAL = REGIONS.reduce(
  (acc, region) => ({
    schoolCount: acc.schoolCount + region.schoolCount,
    capacityKw: acc.capacityKw + region.capacityKw,
    todayKwh: acc.todayKwh + region.todayKwh,
    monthKwh: acc.monthKwh + region.monthKwh,
  }),
  { schoolCount: 0, capacityKw: 0, todayKwh: 0, monthKwh: 0 },
);
