import { BoltIcon, ClockIcon, LeafIcon, SchoolIcon, SunIcon, WeatherCloudyIcon } from '@/components/common/Icon';
import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * 교육용 화면 전용 라인 아이콘.
 * 공용 Icon 과 같은 24×24 그리드·stroke 1.6 을 쓰되, 태양광 원리처럼 이 화면에서만 필요한
 * 그림은 여기에 둔다 — 공용 아이콘 목록에 섞으면 다른 화면에서 쓸 일 없는 것들이 쌓인다.
 *
 * 설비 아이콘은 실물 비례를 따랐다. 인버터가 세로로 긴 이유는 실제 벽걸이형이 그렇기 때문이다.
 */
function Base({ children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** 기울어진 태양광 모듈 — 셀 격자가 보이는 판과 받침대 */
export const SolarPanelIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.6 15.2 5.3 6.4h13.4l2.7 8.8H2.6Z" />
    <path d="M3.8 10.8h16.4" />
    <path d="M9.6 6.4 8.7 15.2M14.4 6.4l.9 8.8" />
    <path d="M12 15.2V19" />
    <path d="M8.6 21.2 12 19l3.4 2.2" />
  </Base>
);

/** 인버터 — 세로형 벽걸이 본체에 표시창·버튼·방열핀 */
export const InverterIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="5.4" y="2.6" width="11.2" height="18.8" rx="1.8" />
    <path d="M5.4 6.2h11.2M5.4 17.4h11.2" />
    <rect x="7.8" y="8.4" width="6.4" height="4.4" rx="0.9" />
    <path d="M8.4 15.2h.01M11 15.2h.01M13.6 15.2h.01" />
    <path d="M18.6 8.2h2.6M18.6 11h2.6M18.6 13.8h2.6" />
  </Base>
);

/** 광전효과 — 빛알이 부딪치면 전자가 튀어나온다 */
export const PhotonIcon = (props: IconProps) => (
  <Base {...props}>
    {/* 들어오는 빛 — 반도체에 닿기 직전까지만 그어 화살촉이 원에 묻히지 않게 한다 */}
    <path d="M2.2 3.2 7 8" />
    <path d="M3.8 7.8 7 8 7.2 4.8" strokeWidth="1.3" />
    {/* 반도체 */}
    <circle cx="10.6" cy="14" r="4.6" />
    {/* 튀어나가는 전자 */}
    <path d="M14.2 10.4 16.4 8.2" />
    <circle cx="19" cy="5" r="2.4" />
    <path d="M17.8 5h2.4" strokeWidth="1.3" />
  </Base>
);

/** PN 접합 — 경계를 두고 갈라선 두 반도체 */
export const JunctionIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2" />
    <path d="M12 5.6v12.8" strokeDasharray="2.2 2" />
    <path d="M5.8 12h3.4M7.5 10.3v3.4" />
    <path d="M14.8 12h3.4" />
  </Base>
);

/** 최대전력점 추종 — 곡선의 꼭짓점을 계속 겨눈다 */
export const PeakTrackIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.4 19C6.6 19 7.8 7.6 12 7.6S17.4 19 21.6 19" />
    <circle cx="12" cy="7.6" r="2.3" />
    <path d="M12 2.4v2.2M12 10.6v2.2M6.8 7.6H9M15 7.6h2.2" />
  </Base>
);

/** 변환효율 — 많이 들어와 일부만 걸러져 나간다 */
export const ConversionIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 4.4h18l-6.8 8v7.2l-4.4-2.6v-4.6L3 4.4Z" />
    <path d="M6.6 4.4 9 8.6M17.4 4.4 15 8.6" strokeWidth="1.1" />
  </Base>
);

/** 계기 — 기준을 가리키는 바늘 */
export const GaugeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.4 18.4a8.6 8.6 0 1 1 17.2 0" />
    <path d="M12 18.4 16.6 13" />
    <circle cx="12" cy="18.4" r="1.5" />
    <path d="M4.8 13.2 6.2 14M12 9.9v1.7M19.2 13.2 17.8 14" strokeWidth="1.2" />
  </Base>
);

/** 이용률 — 24시간 중 실제로 돈 몫 */
export const RatioIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 3.4A8.6 8.6 0 0 1 19 16.9" />
    <path d="M12 12V3.4M12 12l7 4.9" />
  </Base>
);

/** 일사량 — 해에서 내리꽂히는 빛 */
export const IrradianceIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="6.2" r="3.6" />
    <path d="M12 0.8v1.8M5.6 2 6.9 3.3M18.4 2l-1.3 1.3M1.6 6.2h1.8M20.6 6.2h1.8" />
    <path d="M7.4 13.2v6M12 13.2v7.4M16.6 13.2v6" />
    <path d="M5.9 17.7 7.4 19.2 8.9 17.7M10.5 19.1 12 20.6l1.5-1.5M15.1 17.7l1.5 1.5 1.5-1.5" strokeWidth="1.3" />
  </Base>
);

/** 발전시간 — 시간대별 발전을 쌓아 본 모양 */
export const PowerTimeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.6 19.4h18.8" />
    <path d="M3.4 19.4C7 19.4 8.2 7.4 12 7.4s5 12 8.6 12" />
    <path d="M7 19.4v-3.8M12 19.4v-9.6M17 19.4v-3.8" strokeWidth="1.3" />
  </Base>
);

/** 설치 면적 — 치수선이 붙은 넓이 */
export const AreaIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="2.8" y="6.8" width="16" height="11" rx="1.4" />
    <path d="M2.8 3.8h16M2.8 3h1.6M18 3h1.6" strokeWidth="1.2" />
    <path d="M21.6 6.8v11M20.8 6.8h1.6M20.8 17.8h1.6" strokeWidth="1.2" />
    <path d="M5.6 14.6 9.4 10.8M10 14.6l3.8-3.8" strokeWidth="1.1" />
  </Base>
);

/** 남중고도 — 해가 뜬 높이가 만드는 각 */
export const AngleIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 19.6h18" />
    <path d="M3 19.6 17.2 5.4" />
    <path d="M11.4 19.6a8.4 8.4 0 0 0-2.4-5.9" strokeWidth="1.2" />
    <circle cx="18.6" cy="4" r="2.2" />
  </Base>
);

/** 대기 통과 — 층을 비스듬히 뚫고 내려오는 빛 */
export const AirMassIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.6 7.2h18.8M2.6 12h18.8M2.6 16.8h18.8" strokeDasharray="3 2.6" strokeWidth="1.2" />
    <path d="M6.4 2.6 15.6 20.4" strokeWidth="1.9" />
    <path d="M12.6 19.6 15.6 20.4 15 17.4" strokeWidth="1.4" />
  </Base>
);

/** 전구 — 조명 사용시간 환산 */
export const BulbIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M9.4 17.2a6.2 6.2 0 1 1 5.2 0v2.2H9.4v-2.2Z" />
    <path d="M9.8 21.4h4.4" />
    <path d="M10.4 13.4 12 10.6l1.6 2.8" strokeWidth="1.2" />
  </Base>
);

/** 전기차 — 주행거리 환산 */
export const EvIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.4 17v-3.4l1.9-4.4a2.1 2.1 0 0 1 1.9-1.3h9.6a2.1 2.1 0 0 1 1.9 1.3l1.9 4.4V17" />
    <path d="M3.4 17h17.2" />
    <path d="M5.6 13.6h12.8" strokeWidth="1.2" />
    <circle cx="7.4" cy="18.6" r="1.6" />
    <circle cx="16.6" cy="18.6" r="1.6" />
    <path d="M12.8 2.4 10.6 5.8h2.6L11 9" strokeWidth="1.3" />
  </Base>
);

/** 나무 — 식재 효과 환산 */
export const TreeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 21v-6.4" />
    <path d="M12 17.4 8.6 15M12 15l3.4-2.4" strokeWidth="1.2" />
    <path d="M12 2.6 5.8 11h3.2L5.2 15.6h13.6L15 11h3.2L12 2.6Z" />
  </Base>
);

/** 가정 — 가구 사용일 환산 */
export const HouseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.2 10.8 12 3.8l8.8 7" />
    <path d="M5.4 12.4v7.4h13.2v-7.4" />
    <path d="M9.8 19.8v-4.6h4.4v4.6" />
    <path d="M16.4 6.6V4.6h2.2v3.8" strokeWidth="1.2" />
  </Base>
);

/** 전체 흐름 — 네 단계가 한 줄로 이어진다 */
export const FlowIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="4.6" cy="12" r="2.4" />
    <circle cx="12" cy="12" r="2.4" />
    <circle cx="19.4" cy="12" r="2.4" />
    <path d="M7.4 12h1.8M14.8 12h1.8" />
    <path d="M9.2 12 8 10.6M9.2 12 8 13.4M16.6 12l-1.2-1.4M16.6 12l-1.2 1.4" strokeWidth="1.2" />
  </Base>
);

/** 전기가 되기까지의 단계 */
export const JOURNEY_ICONS: Record<string, ReactNode> = {
  sun: <SunIcon />,
  panel: <SolarPanelIcon />,
  inverter: <InverterIcon />,
  load: <SchoolIcon />,
};

/** 원리 카드 */
export const PRINCIPLE_ICONS: Record<string, ReactNode> = {
  photovoltaic: <PhotonIcon />,
  pn: <JunctionIcon />,
  inverter: <InverterIcon />,
  mppt: <PeakTrackIcon />,
};

/** 효율 지표 */
export const EFFICIENCY_ICONS: Record<string, ReactNode> = {
  conversion: <ConversionIcon />,
  cf: <RatioIcon />,
  hours: <ClockIcon />,
};

/** 환산 카드 */
export const IMPACT_ICONS: Record<string, ReactNode> = {
  co2: <LeafIcon />,
  tree: <TreeIcon />,
  household: <HouseIcon />,
  led: <BulbIcon />,
};

/** 지금 이 순간의 수치들 */
export const STAT_ICONS: Record<string, ReactNode> = {
  today: <BoltIcon />,
  powerTime: <PowerTimeIcon />,
  co2: <LeafIcon />,
  irradiance: <IrradianceIcon />,
  capacity: <AreaIcon />,
};

/** 곡선 읽는 법 */
export const READING_ICONS: Record<string, ReactNode> = {
  angle: <AngleIcon />,
  airmass: <AirMassIcon />,
  cloud: <WeatherCloudyIcon />,
};
