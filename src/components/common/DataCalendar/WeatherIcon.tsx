import {
  WeatherClearIcon,
  WeatherCloudyIcon,
  WeatherPartlyIcon,
  WeatherRainIcon,
  WeatherSnowIcon,
} from '@/components/common/Icon';
import { WEATHER_META } from '@/mocks/weather';
import type { WeatherKind } from '@/interface/weather';

const ICONS: Record<WeatherKind, typeof WeatherClearIcon> = {
  clear: WeatherClearIcon,
  partlyCloudy: WeatherPartlyIcon,
  cloudy: WeatherCloudyIcon,
  rain: WeatherRainIcon,
  snow: WeatherSnowIcon,
};

interface WeatherIconProps {
  kind: WeatherKind;
  /** 서버가 준 날씨 이름. 「비/눈」·「소나기」는 아이콘이 접혀 여기에만 남는다 */
  label?: string;
  size?: number;
  className?: string;
}

/** 날씨 아이콘. 아이콘만으로 뜻이 전해지지 않으므로 title 로 이름을 함께 남긴다. */
export function WeatherIcon({ kind, label, size = 16, className }: WeatherIconProps) {
  const Icon = ICONS[kind];

  return (
    <span className={className} title={label ?? WEATHER_META[kind].label}>
      <Icon width={size} height={size} />
    </span>
  );
}
