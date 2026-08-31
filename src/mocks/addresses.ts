import type { AddressResult } from '@/interface/address';
import type { GeoPoint } from '@/interface/energy';
import { CHUNGNAM_REGIONS, regionCodeOf } from '@/configs/regions';
import { createRandom, hashSeed, pickNumber } from './random';
import { SCHOOLS } from './schools';

/*
  주소 검색 더미.

  카카오(다음) 우편번호 서비스가 붙기 전까지 이 목록이 검색 결과를 대신한다. 학교 주소를 그대로
  쓰는 것은 시·군과 도로명이 어긋나지 않는 주소가 이미 거기 있어서다 — 검색 결과로 고른 주소의
  `sigunguCode` 가 그 발전소의 시·군과 맞아떨어져야 지역별 집계가 말이 된다.
*/

/** 학교가 아닌 곳도 발전소가 된다 — 기관 주소와 경계값(건물명 없음·아주 긴 이름)을 섞어 둔다 */
const EXTRA: { roadAddress: string; buildingName: string; regionKey: string }[] = [
  { roadAddress: '충청남도 홍성군 홍북읍 선화로 22', buildingName: '충청남도교육청', regionKey: 'hongseong' },
  { roadAddress: '충청남도 홍성군 홍북읍 상하천로 58', buildingName: '충청남도교육청연구정보원', regionKey: 'hongseong' },
  { roadAddress: '충청남도 천안시 서북구 번영로 156', buildingName: '천안교육지원청', regionKey: 'cheonan' },
  { roadAddress: '충청남도 아산시 시민로 456', buildingName: '', regionKey: 'asan' },
  { roadAddress: '충청남도 공주시 봉황로 1', buildingName: '공주시청', regionKey: 'gongju' },
  { roadAddress: '충청남도 서산시 관아문길 1', buildingName: '서산시청', regionKey: 'seosan' },
  {
    roadAddress: '충청남도 당진시 송악읍 상록수길 105-3',
    buildingName: '당진시립상록도서관 별관 평생학습지원센터',
    regionKey: 'dangjin',
  },
  { roadAddress: '충청남도 보령시 대해로 123', buildingName: '보령시 농업기술센터', regionKey: 'boryeong' },
];

function buildAddresses(): AddressResult[] {
  const fromSchools = SCHOOLS.map((school, index) => {
    const tokens = school.address.split(' ');

    return {
      // 충남 우편번호 대역 안에서 돌려 매긴다.
      zonecode: String(31000 + (index * 7) % 2800),
      roadAddress: school.address,
      jibunAddress: `${tokens[0]} ${tokens[1]} ${tokens[2]} ${100 + index}-${1 + (index % 9)}`,
      sigunguCode: regionCodeOf(school.regionCode),
      buildingName: school.name,
    };
  });

  const fromExtra = EXTRA.map((item, index) => {
    const tokens = item.roadAddress.split(' ');

    return {
      zonecode: String(31900 + index * 13),
      roadAddress: item.roadAddress,
      jibunAddress: `${tokens[0]} ${tokens[1]} ${tokens[2]} ${200 + index}`,
      sigunguCode: regionCodeOf(item.regionKey),
      buildingName: item.buildingName,
    };
  });

  return [...fromExtra, ...fromSchools];
}

export const SEED_ADDRESSES: AddressResult[] = buildAddresses();

/**
 * 주소 한 건의 좌표.
 *
 * 우편번호 서비스는 좌표를 주지 않는다 — 실제로도 주소를 고른 뒤 지오코더를 한 번 더 부른다.
 * 붙일 때 이 함수 본문만 카카오 `Geocoder.addressSearch` 로 갈아 끼운다.
 */
export function geocode(roadAddress: string): GeoPoint | null {
  const school = SCHOOLS.find((item) => item.address === roadAddress);

  if (school) return school.location;

  const found = SEED_ADDRESSES.find((item) => item.roadAddress === roadAddress);
  const region = found && CHUNGNAM_REGIONS.find((item) => item.regionCode === found.sigunguCode);

  if (!region) return null;

  // 시·군 중심에서 조금 흩어 놓는다 — 같은 시·군 주소가 한 점에 겹쳐 서지 않게.
  const next = createRandom(hashSeed(roadAddress));

  return {
    lat: Math.round((region.center.lat + pickNumber(next, -0.04, 0.04, 5)) * 100000) / 100000,
    lng: Math.round((region.center.lng + pickNumber(next, -0.05, 0.05, 5)) * 100000) / 100000,
  };
}

/** 도로명·지번·건물명·우편번호를 함께 훑는다 — 실제 서비스도 어느 것으로 찾든 걸린다. */
export function findAddresses(keyword: string): AddressResult[] {
  const word = keyword.trim();

  if (!word) return [];

  return SEED_ADDRESSES.filter((item) => item.roadAddress.includes(word)
    || item.jibunAddress.includes(word)
    || item.buildingName.includes(word)
    || item.zonecode.includes(word));
}
