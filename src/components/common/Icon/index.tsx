import SunSvg from '@/assets/svg/icons/sun.svg';
import MoonSvg from '@/assets/svg/icons/moon.svg';
import MenuSvg from '@/assets/svg/icons/menu.svg';
import CloseSvg from '@/assets/svg/icons/close.svg';
import ChevronRightSvg from '@/assets/svg/icons/chevron-right.svg';
import ChevronDownSvg from '@/assets/svg/icons/chevron-down.svg';
import ChevronLeftSvg from '@/assets/svg/icons/chevron-left.svg';
import AlertSvg from '@/assets/svg/icons/alert.svg';
import BellSvg from '@/assets/svg/icons/bell.svg';
import CheckSvg from '@/assets/svg/icons/check.svg';
import InfoSvg from '@/assets/svg/icons/info.svg';
import CalendarSvg from '@/assets/svg/icons/calendar.svg';
import EyeSvg from '@/assets/svg/icons/eye.svg';
import EyeOffSvg from '@/assets/svg/icons/eye-off.svg';
import UserSvg from '@/assets/svg/icons/user.svg';
import LogoutSvg from '@/assets/svg/icons/logout.svg';
import MonitorSvg from '@/assets/svg/icons/monitor.svg';
import SearchSvg from '@/assets/svg/icons/search.svg';
import ExcelSvg from '@/assets/svg/icons/excel.svg';
import HelpSvg from '@/assets/svg/icons/help.svg';
import WifiOffSvg from '@/assets/svg/icons/wifi-off.svg';
import LightningSvg from '@/assets/svg/icons/lightning.svg';
import type { FunctionComponent, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * `assets/svg/icons` 에 파일로 둔 아이콘을 이 화면들의 결에 맞춰 낸다.
 *
 * 파일은 24px·선 굵기 2 로 그려져 있는데 화면에서 쓰는 결은 20px·1.6 이다. 불러 쓰는 자리마다
 * 크기와 굵기를 적어 주면 한 군데만 빠뜨려도 그 아이콘만 굵게 튄다 — 여기서 한 번에 맞춘다.
 */
function fromFile(Svg: FunctionComponent<SVGProps<SVGSVGElement>>) {
  return function Icon(props: IconProps) {
    return <Svg width="20" height="20" strokeWidth="1.6" aria-hidden="true" focusable="false" {...props} />;
  };
}

export const SunIcon = fromFile(SunSvg);
export const MoonIcon = fromFile(MoonSvg);
export const MenuIcon = fromFile(MenuSvg);
export const CloseIcon = fromFile(CloseSvg);
export const ChevronRightIcon = fromFile(ChevronRightSvg);
export const ChevronDownIcon = fromFile(ChevronDownSvg);
export const ChevronLeftIcon = fromFile(ChevronLeftSvg);
export const AlertIcon = fromFile(AlertSvg);
export const BellIcon = fromFile(BellSvg);
export const CheckIcon = fromFile(CheckSvg);
export const InfoIcon = fromFile(InfoSvg);
export const CalendarIcon = fromFile(CalendarSvg);
export const EyeIcon = fromFile(EyeSvg);
export const EyeOffIcon = fromFile(EyeOffSvg);
export const UserIcon = fromFile(UserSvg);
export const LogoutIcon = fromFile(LogoutSvg);
export const MonitorIcon = fromFile(MonitorSvg);
export const SearchIcon = fromFile(SearchSvg);
export const ExcelIcon = fromFile(ExcelSvg);
export const HelpCircleIcon = fromFile(HelpSvg);
export const OfflineIcon = fromFile(WifiOffSvg);
export const BoltIcon = fromFile(LightningSvg);

/**
 * 24×24 그리드, stroke 1.6 로 통일한 라인 아이콘.
 * 색은 항상 currentColor 를 따른다.
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

export const ArrowUpRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7 17L17 7M8 7h9v9" />
  </Base>
);

export const ChartIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.5 20.5h17" />
    <path d="M7 20.5V11M12 20.5V4.5M17 20.5v-6" />
  </Base>
);

export const PulseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.5 12.5h4L9 6.5l4 11 2.5-5h4" />
  </Base>
);

export const PhotoIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="M3.5 17.5 9 12.5l3.5 3L16 12l4.5 4.5" />
  </Base>
);

export const SchoolIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
    <path d="M6.5 10v5.5c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3V10" />
  </Base>
);

export const LeafIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20c0-8 5-13 16-13 0 9-4.5 13-11 13H4Z" />
    <path d="M4 20c3.5-4.5 7-7 12-9" />
  </Base>
);

export const DownloadIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </Base>
);

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.2 19 6v5.6c0 4.2-2.8 7.6-7 9.2-4.2-1.6-7-5-7-9.2V6l7-2.8Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </Base>
);

/** 실적 순위 1~3위 표식 (SFR-004-09) */
export const CrownIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 17.5h16M4.2 6.4l3.9 3.2L12 5l3.9 4.6 3.9-3.2-1.5 9.1H5.7Z" />
  </Base>
);

export const MapPinIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0C5.5 15 12 21 12 21Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Base>
);

export const PlusIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const MinusIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5.5 12h13" />
  </Base>
);

export const ExpandIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15" />
  </Base>
);

// ── 날씨 (SFR-006-05, SFR-007-01) ───────────────────────────
export const WeatherClearIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 3v2.2M12 18.8V21M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M3 12h2.2M18.8 12H21M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" />
  </Base>
);

export const WeatherPartlyIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="9" cy="8.6" r="3.2" />
    <path d="M9 2.6v1.6M4.2 4.2l1.2 1.2M2.6 8.6h1.6M12.6 5.4l1.2-1.2" />
    <path d="M8.6 19.6h8.2a3.1 3.1 0 0 0 .3-6.2 4.4 4.4 0 0 0-8.4 1 2.6 2.6 0 0 0-.1 5.2Z" />
  </Base>
);

export const WeatherCloudyIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7.4 18.6h9.4a3.4 3.4 0 0 0 .3-6.8 4.9 4.9 0 0 0-9.4 1.1 2.9 2.9 0 0 0-.3 5.7Z" />
  </Base>
);

export const WeatherRainIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7.4 14.6h9.4a3.4 3.4 0 0 0 .3-6.8 4.9 4.9 0 0 0-9.4 1.1 2.9 2.9 0 0 0-.3 5.7Z" />
    <path d="M9 17.6l-.8 2.6M12.4 17.6l-.8 2.6M15.8 17.6l-.8 2.6" />
  </Base>
);

export const WeatherSnowIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7.4 14.6h9.4a3.4 3.4 0 0 0 .3-6.8 4.9 4.9 0 0 0-9.4 1.1 2.9 2.9 0 0 0-.3 5.7Z" />
    <path d="M9 18.4h.01M12.4 20h.01M15.8 18.4h.01" />
  </Base>
);

export const UploadIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 20.5v-11M7.5 13.5 12 9l4.5 4.5M4.5 4.5h15" />
  </Base>
);

export const FileIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M13.5 3.5H7a1.8 1.8 0 0 0-1.8 1.8v13.4A1.8 1.8 0 0 0 7 20.5h10a1.8 1.8 0 0 0 1.8-1.8V8.8Z" />
    <path d="M13.5 3.5v5.3h5.3" />
  </Base>
);

export const PrinterIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7 9V4.5h10V9" />
    <rect x="4.5" y="9" width="15" height="7.5" rx="1.8" />
    <path d="M7 16.5v3h10v-3" />
  </Base>
);

export const ClockIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.6V12l3.2 2" />
  </Base>
);

export const WrenchIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M14.8 6.2a3.8 3.8 0 0 0 4.9 4.9l-8.4 8.4a2.4 2.4 0 0 1-3.4-3.4Z" />
    <path d="M14.8 6.2 17 4" />
  </Base>
);

export const BoardIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M7.5 9.5h9M7.5 13h6" />
  </Base>
);

export const PauseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M9.5 5.5v13M14.5 5.5v13" />
  </Base>
);

export const PlayIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 5.6 18 12 8 18.4z" />
  </Base>
);
