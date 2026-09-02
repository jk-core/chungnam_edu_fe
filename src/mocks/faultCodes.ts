import type { DiagnosisFaultCode, FaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';

/**
 * AI 진단 고장 분류 (SFR-011-05 / SFR-014-04).
 * 0 = 정상, 1~6 = 모듈·발전 이상, 7 = 인버터/스트링 정지·고장 —
 * 진단 모델이 내놓는 라벨 체계를 그대로 따른다.
 * 화면에서 코드를 누르면 원인·조치와 참고 이미지를 함께 펼친다 (SFR-013-06).
 */
export const FAULT_CODES: FaultCode[] = [
  {
    code: 0,
    label: '정상',
    summary: '정상',
    category: 'normal',
    severity: 'info',
    defaultStatus: 'running',
    appliesTo: ['plant', 'inverter', 'string'],
    description: [
      '정상 상태, 발전 상태 양호, 이상 징후 없음',
      '전압·전류 측정값이 정상 범위 안에 있어 추가 조치가 필요 없음',
    ],
    plan: [
      '현재 상태를 유지하며 주기적인 점검과 청소를 이어 갑니다.',
      '연간 노화율을 넘는 성능 저하를 잡아내려면 효율 추이를 꾸준히 봅니다.',
    ],
    images: ['/image/FaultCode/faultcode0.png'],
  },
  {
    code: 1,
    label: '고장코드 1',
    summary: 'PID 열화·부식',
    category: 'module',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string'],
    description: [
      'PID(Potential Induced Degradation) 현상',
      '태양전지 국부 소손 또는 전극 부식',
      '태양전지·모듈 구성부재 열화로 인한 누설전류 발생',
    ],
    plan: [
      'Anti-PID 장비를 설치합니다.',
      '고장 모듈을 교체하고 스트링을 재구성합니다.',
      '정상 모듈로 스트링을 다시 묶고, 남은 용량은 새 모듈로 채웁니다.',
    ],
    images: ['/image/FaultCode/faultcode1-1.png', '/image/FaultCode/faultcode1-2.png'],
  },
  {
    code: 2,
    label: '고장코드 2',
    summary: '다이오드 쇼트·음영',
    category: 'module',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string'],
    description: ['바이패스 다이오드 쇼트 고장', '바이패스 다이오드가 동작하는 음영'],
    plan: ['정션박스 안 바이패스 다이오드 상태를 점검하고 교체합니다.', '모듈 음영 요인을 없앱니다.'],
    images: ['/image/FaultCode/faultcode2-1.png', '/image/FaultCode/faultcode2-2.png'],
  },
  {
    code: 3,
    label: '고장코드 3',
    summary: '음영·오염 저하',
    category: 'module',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string'],
    description: [
      '바이패스 다이오드가 동작하지 않은 음영·오염 (또는 모듈 하단부의 음영·오염)',
      '모듈 설치 각도 차이',
      '전류 저하가 크면 퓨즈가 끊어질 수 있음',
    ],
    plan: [
      '모듈 표면 오염을 씻어 내고 음영 요인을 없앱니다.',
      '모듈 구조물 상태를 살핍니다 (설치각 등).',
      '스트링 퓨즈를 점검합니다.',
    ],
    images: ['/image/FaultCode/faultcode3-1.png', '/image/FaultCode/faultcode3-2.png'],
  },
  {
    code: 4,
    label: '고장코드 4',
    summary: '광범위 음영',
    category: 'module',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string'],
    description: ['수목·구조물 등에 의한 넓은 범위의 음영'],
    plan: [
      '수목을 가지치기하고 구조물을 조정해 음영 요인을 없앱니다.',
      '없애기 어려우면 파워 옵티마이저나 마이크로 인버터 설치를 검토합니다.',
    ],
    images: ['/image/FaultCode/faultcode4-1.png', '/image/FaultCode/faultcode4-2.png'],
  },
  {
    code: 5,
    label: '고장코드 5',
    summary: '일사량계 이상',
    category: 'sensor',
    // 센서 이상도 확인·조치가 필요하므로 주의 등급으로 둔다.
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: [],
    description: ['일사량계 노후화 및 센서 표면 오염'],
    plan: ['일사량계 센서를 교정하거나 교체합니다.', '센서 표면을 닦고 음영 요인을 없앱니다.'],
    images: ['/image/FaultCode/faultcode5.png'],
  },
  {
    code: 6,
    label: '고장코드 6',
    summary: '핫스팟 열화',
    category: 'thermal',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string'],
    description: ['태양전지 열화로 인한 핫스팟(또는 핫셀)', '태양광 모듈 구성부재 열화'],
    plan: [
      '태양전지 열화 원인을 찾아 없앱니다 (국부 오염·음영 등).',
      '주기 점검으로 모듈 상태를 관리합니다 — 오래 두면 고장코드 1로 번질 수 있습니다.',
    ],
    images: ['/image/FaultCode/faultcode6-1.png', '/image/FaultCode/faultcode6-2.png'],
  },
  {
    code: 7,
    label: '고장코드 7',
    summary: '인버터 정지·고장',
    category: 'wiring',
    severity: 'critical',
    defaultStatus: 'fault',
    appliesTo: ['plant', 'inverter', 'string'],
    description: [
      '인버터 정지·고장',
      '스트링 케이블 결선 또는 커넥터 손상',
      '스트링 결선을 방치하면 화재로 번질 수 있음',
    ],
    plan: [
      '인버터 전원을 다시 넣고 표시부 알림 코드를 확인한 뒤 A/S를 부릅니다.',
      '차단기 트립 여부를 확인합니다 (DC·AC 모두).',
      '스트링 케이블·커넥터·접속함·인버터 결선 상태를 점검합니다.',
      '커넥터와 단자 접촉 상태, 탄화·변색 여부를 살핍니다.',
      '절연저항을 측정해 누설전류가 있는지 확인합니다.',
    ],
    images: ['/image/FaultCode/faultcode99-1.png', '/image/FaultCode/faultcode99-2.png'],
  },
];

const FAULT_BY_CODE = new Map(FAULT_CODES.map((fault) => [fault.code, fault]));

export const getFaultCode = (code: DiagnosisFaultCode | null | undefined) => (
  code == null ? null : (FAULT_BY_CODE.get(code) ?? null)
);

/** 배지·표 셀에 쓰는 짧은 표기 — '고장코드 3 · 음영·오염 저하' */
export function faultCodeLabel(code: DiagnosisFaultCode | null | undefined): string {
  const fault = getFaultCode(code);

  return fault ? `${fault.label} · ${fault.summary}` : '—';
}

/** 분류 라벨 목록 — 모델 성능 표(Confusion Matrix)의 축으로 쓴다. */
export const FAULT_LABELS = FAULT_CODES.map((fault) => `${fault.code}. ${fault.summary}`);

/**
 * 인버터 상태에 붙을 수 있는 고장코드 후보.
 * 정상·준비중은 코드를 달지 않는다. 통신단절은 계측이 끊긴 것이라
 * 설비 원인을 단정할 수 없어 코드 7(정지·고장)로 모아 둔다.
 */
export const FAULT_BY_STATUS: Record<OperationStatus, DiagnosisFaultCode[]> = {
  running: [],
  ready: [],
  degraded: [1, 2, 3, 4, 6],
  fault: [7],
  commLost: [7],
};

/** 적설(눈) 의심 참고 이미지 */
export const SNOW_FAULT_IMAGE = '/image/FaultCode/faultcode-snow.png';

/** 적설(눈) 의심 시 '특이사항'에 덧붙일 문구 */
export const SNOW_SUSPICION_NOTE = '적설(눈)로 모듈 표면이 가려지고 일사량이 줄어 일시적으로 발전이 떨어진 것으로 의심됩니다.';

/** 눈이 의심되는 날은 참고 이미지에 적설 예시를 덧붙인다. */
export function withSnowSuspicion(fault: FaultCode, isSnow: boolean): FaultCode {
  return isSnow ? { ...fault, images: [...fault.images, SNOW_FAULT_IMAGE] } : fault;
}
