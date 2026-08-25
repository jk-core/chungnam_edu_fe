import { SCHOOLS } from './schools';

/*
  발전소 현장 대표이미지 (SFR-016-01).

  파일은 아직 들어오지 않았다. 그래도 경로와 장수를 먼저 못 박아 두는 것은, 화면이 사진을
  몇 장 어떤 비율로 받을 수 있는지가 배치를 정하기 때문이다 — 자리를 나중에 만들면 그때 가서
  카드 높이를 다시 잡게 된다.

  실제 API 가 붙으면 이 목록은 응답이 내려주는 URL 배열로 갈아끼운다. 화면이 보는 것은
  `PlantPhoto` 형태 하나뿐이라 갈아끼우는 자리가 여기 한 곳이다.
*/

/** 한 발전소가 가질 수 있는 사진 수 — 카드 한 줄에 나란히 서는 한계다 */
const MAX_PHOTOS = 3;

/** 찍는 자리. 순서가 곧 대표 순서다 — 첫 장이 목록·요약에 쓰이는 대표이미지가 된다 */
const ANGLES = ['전경', '모듈 배열', '인버터실'];

export interface PlantPhoto {
  /** `public/` 아래 경로. 파일이 아직 없으면 화면이 자리표시자로 떨어진다 */
  src: string;
  /** 무엇을 찍은 것인지 — 대체 텍스트와 캡션에 함께 쓴다 */
  caption: string;
}

const PHOTOS_BY_PLANT = new Map<string, PlantPhoto[]>(
  SCHOOLS.map((school, index) => [
    school.id,
    // 장수는 발전소마다 다르다 — 한 장뿐인 곳과 세 장인 곳에서 줄이 어떻게 서는지 함께 봐야 한다.
    ANGLES.slice(0, (index % MAX_PHOTOS) + 1).map((angle, order) => ({
      src: `/image/plant/${school.id}-${order + 1}.jpg`,
      caption: `${school.name} ${angle}`,
    })),
  ]),
);

export function getPlantPhotos(plantId: string): PlantPhoto[] {
  return PHOTOS_BY_PLANT.get(plantId) ?? [];
}

/** 목록·요약에 한 장만 세울 때 쓰는 대표이미지 */
export function getPlantCover(plantId: string): PlantPhoto | null {
  return getPlantPhotos(plantId)[0] ?? null;
}
