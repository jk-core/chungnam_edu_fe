import { PATH } from './routes';

/**
 * 시연용 공개 모드 (2026-09-16 지시).
 *
 * `VITE_ONLY_PREVIEW` 를 켜면 시연에서 보여 줄 화면만 열리고, 나머지 주소로 들어온 사람은
 * 모두 화면 고르개(`/preview-choice`)로 모인다. **로그인도 묻지 않는다** — 시연 자리에서
 * 계정을 입력하게 하면 그 자체가 볼거리를 가로막는다.
 *
 * 브랜치를 따로 파지 않고 플래그로 가르는 까닭이 있다. 시연용 가지를 따로 두면 본 가지에서
 * 고친 것을 옮겨 심어야 하고, 시연이 끝난 뒤 그 가지를 어떻게 되돌릴지가 남는다. 플래그는
 * 같은 코드가 두 모습으로 서게 하므로 그 일이 없다 — 끌 때는 값 하나만 지운다.
 *
 * 켜고 끄는 것은 빌드 시점이다. Vite 는 `VITE_` 로 시작하는 것만 브라우저로 넘기므로 이름에
 * 그 접두사가 붙는다. 값이 문자열로 오기 때문에 `'true'` 와 맞대어 본다 — `Boolean('false')`
 * 는 참이라, 끄려고 적은 `false` 가 켜는 값이 된다.
 */
export const ONLY_PREVIEW = import.meta.env.VITE_ONLY_PREVIEW === 'true';

/**
 * 공개 모드에서 열어 두는 자리.
 *
 * 여기 적힌 것으로 **시작하는** 주소가 열린다 — `/control` 하나로 `/control/b` 까지 함께
 * 열리고, `/admin` 하나로 관리자 콘솔 열 몇 화면이 전부 열린다. 자식 경로를 일일이 적으면
 * 화면이 하나 늘 때마다 이 목록도 함께 고쳐야 하고, 빠뜨린 자리는 시연 중에야 드러난다.
 */
const OPEN_PREFIXES = [
  PATH.PREVIEW_CHOICE,
  /** 통합관제 상황판 — 최종안과 견줌용 시안 */
  PATH.CONTROL,
  /** 교육용 대시보드 — 시안 셋과 기관별 주소 */
  PATH.SOLAR_EDU,
  PATH.KIOSK,
  /** 관리자 콘솔 */
  PATH.ADMIN,
] as const;

/** 공개 모드에서 그 주소를 열어 줄지 */
export function isOpenInPreview(pathname: string): boolean {
  return OPEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
