import { useSearchParams } from 'react-router-dom';
import { Select } from '@/components/common/Select';
import { WEATHER_META } from '@/mocks/weather';
import type { WeatherKind } from '@/interface/weather';

/** 오늘의 실제 날씨를 그대로 쓰는 값 — 고르면 `?weather=` 가 붙는다 */
const AUTO = 'auto';

/** 고를 수 있는 날씨 — 배경이 갈리는 다섯 가지 전부다 */
export const WEATHER_KINDS: WeatherKind[] = ['clear', 'partlyCloudy', 'cloudy', 'rain', 'snow'];

const OPTIONS = [
  { value: AUTO, label: '오늘 날씨' },
  ...WEATHER_KINDS.map((kind) => ({ value: kind, label: WEATHER_META[kind].label })),
];

/** `?weather=` 에 실린 값이 쓸 만한 날씨인지 — 아니면 오늘 날씨를 그대로 쓴다 */
export function resolveForcedWeather(raw: string | null): WeatherKind | undefined {
  return WEATHER_KINDS.find((kind) => kind === raw);
}

/**
 * 날씨 고르기 — **시연용 임시 도구** (2026-09-07 지시).
 *
 * 배경은 날씨 다섯 가지로 갈리는데, 목업이 날짜를 씨앗으로 하루 하나를 뽑으므로 오늘 걸린
 * 하나밖에 볼 수 없다. 비 오는 날의 화면을 보려고 날짜를 기다릴 수는 없어 문을 하나 낸다.
 *
 * 고른 값은 배경만 갈아 끼우지 않는다 — 일사량과 발전시간, 기온·습도까지 그 날씨 기준으로
 * 다시 셈한 하루가 나온다. 눈으로 견주려는 것이 배경 하나가 아니라 「그런 날의 화면」 이다.
 *
 * 실제 기상 연동이 붙으면 이 고르개와 `getDayWeather` 의 `forceKind` 를 함께 걷는다.
 */
export function WeatherPicker() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Select
      label="날씨 (시연용)"
      hideLabel
      value={resolveForcedWeather(searchParams.get('weather')) ?? AUTO}
      onChange={(value) => {
        // 고른 값만 갈아 끼우고 나머지 조건(눈높이 등)은 그대로 둔다
        const next = new URLSearchParams(searchParams);

        if (value === AUTO) next.delete('weather');
        else next.set('weather', value);

        setSearchParams(next, { replace: true });
      }}
      options={OPTIONS}
    />
  );
}
