import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

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

export const SunIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const MoonIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Base>
);

export const MenuIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </Base>
);

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M9 5l7 7-7 7" />
  </Base>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 9l7 7 7-7" />
  </Base>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7 17L17 7M8 7h9v9" />
  </Base>
);

export const BoltIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
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

export const AlertIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
    <path d="M12 10v4M12 17.2v.1" />
  </Base>
);

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Base>
);

export const InfoIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.1" />
  </Base>
);

export const OfflineIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 3l18 18" />
    <path d="M8.6 15.4a5 5 0 0 1 6.8-.4M5.2 12a10 10 0 0 1 4-2.4M18.8 12a10 10 0 0 0-3-2.1M12 19v.1" />
  </Base>
);

export const CalendarIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
  </Base>
);

export const DownloadIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </Base>
);

export const EyeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12S18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const EyeOffIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 4l16 16" />
    <path d="M9.6 6a8.6 8.6 0 0 1 2.4-.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.5 3.3" />
    <path d="M6.3 8.1A17.4 17.4 0 0 0 2.5 12S6 18.5 12 18.5a8.8 8.8 0 0 0 3.4-.7" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Base>
);

export const UserIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
  </Base>
);

export const LogoutIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M14.5 4.5h3.2a1.8 1.8 0 0 1 1.8 1.8v11.4a1.8 1.8 0 0 1-1.8 1.8h-3.2" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </Base>
);

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.2 19 6v5.6c0 4.2-2.8 7.6-7 9.2-4.2-1.6-7-5-7-9.2V6l7-2.8Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </Base>
);

export const MonitorIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="2.8" y="4" width="18.4" height="12.4" rx="2" />
    <path d="M9 20.2h6M12 16.4v3.8" />
  </Base>
);

export const SearchIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.5 15.5 4 4" />
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

export const ExcelIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="4" y="4.5" width="16" height="15" rx="1.8" />
    <path d="M4 9.5h16M9.5 9.5v10M4 14.5h16" />
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

export const HelpCircleIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M9.8 9.6a2.3 2.3 0 1 1 3.4 2.1c-.7.4-1.2.9-1.2 1.8" />
    <path d="M12 17h.01" />
  </Base>
);
