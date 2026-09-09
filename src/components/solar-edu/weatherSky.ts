import type { WeatherKind } from '@/interface/weather';

/**
 * 날씨가 하늘을 어떻게 바꾸는지 (2026-09-04 회의).
 *
 * 상황판의 값어치는 실시간성이다 — 비 오는 날 화면에 해가 떠 있으면 나머지 수치까지 믿지 않게 된다.
 * 그래서 세 갈래로 가른다: 쨍쨍한 날, 구름에 가린 날, 비·눈이 오는 날.
 *
 * `sun` 은 해를 얼마나 또렷하게 둘지, `clouds` 는 몇 덩이를 띄울지, `drops` 는 무엇이 내리는지다.
 * 하늘색은 원래의 시각별 색 위에 `haze` 를 `gray` 만큼 얹어 낸다.
 *
 * 흐린 셋의 색을 갈라 두었다 (2026-09-07 지시).
 *
 * 전에는 셋 다 같은 회색을 세기만 달리해 덮었다. 하늘이 넓게 드러나는 판(초등 b·c)에서는
 * 구름 수와 빗줄기가 날씨를 말해 주니 그것으로 되었지만, 판이 촘촘해 하늘이 틈으로만 보이는
 * 판(중등 b)에서는 그 틈에 색밖에 남지 않는다 — 같은 회색이면 흐린지 비가 오는지 알 수 없다.
 *
 * 비는 푸른 기가 도는 짙은 회색, 눈은 차고 흰 회색, 흐림은 그 사이의 중성 회색이다. 실제
 * 하늘이 그렇게 보이기도 하거니와, 셋을 나란히 놓았을 때 무엇이 다른지 말로 옮길 수 있어야 한다.
 *
 * 배경 컴포넌트 밖으로 뺐다 (2026-09-09 지시 — 시안 a 의 배경도 날씨를 따르게).
 * 배경이 둘(`SkyBackdrop`·`PaperBackdrop`)이 되었으므로 규칙은 한 벌이어야 한다 — 표를 두 벌
 * 두면 같은 비 오는 날에 두 시안이 다른 하늘을 그린다. 얼마나 짙게 그릴지는 판마다 다르지만,
 * **무엇이 달라지는가**는 여기 한 곳이 정한다.
 */
export interface WeatherSky {
  /** 해를 얼마나 또렷하게 둘지 */
  sun: 'bright' | 'veiled' | 'none';
  /** 하늘이 넓게 드러나는 판에서 띄우는 구름 덩이 수 */
  clouds: number;
  drops: 'rain' | 'snow' | null;
  /** 하늘 위에 얹는 잿빛의 짙기 (0~1) */
  gray: number;
  /** 하늘 위에 얹는 색 — 위가 짙고 아래가 옅다 */
  haze: [string, string];
}

export const WEATHER_SKY: Record<WeatherKind, WeatherSky> = {
  clear: { sun: 'bright', clouds: 1, drops: null, gray: 0, haze: ['#8b98ab', '#b9c2cf'] },
  partlyCloudy: { sun: 'bright', clouds: 3, drops: null, gray: 0.1, haze: ['#8b98ab', '#c3ccd8'] },
  cloudy: { sun: 'veiled', clouds: 5, drops: null, gray: 0.34, haze: ['#77828f', '#aab3bf'] },
  rain: { sun: 'none', clouds: 5, drops: 'rain', gray: 0.52, haze: ['#46566d', '#7b8a9d'] },
  snow: { sun: 'none', clouds: 5, drops: 'snow', gray: 0.44, haze: ['#96a2af', '#d7dce2'] },
};

export interface FallingDrop {
  id: number;
  left: string;
  delay: string;
  duration: string;
}

/**
 * 내리는 것의 자리와 속도를 흩는다.
 *
 * 같은 줄이 같은 속도로 떨어지면 벽지처럼 보여, 비가 아니라 무늬가 된다. 서로 나눠떨어지지 않는
 * 수로 돌려 자리·시작·속도를 어긋나게 둔다. 방울 수는 판이 정한다 — 하늘이 넓게 드러나는 판은
 * 촘촘해야 비가 오는 것으로 보이고, 배경이 뒤로 물러나야 하는 판은 성글어야 글을 가리지 않는다.
 */
export function scatterDrops(count: number): FallingDrop[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${(index * 37) % 100}%`,
    delay: `${-(index * 0.37) % 4}s`,
    duration: `${1.6 + ((index * 13) % 9) / 10}s`,
  }));
}
