import type { FaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';

/**
 * 고장 분류 사전 (SFR-011-05 / SFR-014-04).
 * RFP 가 예시한 유형 — 모듈 음영, 센서 오염, 바이패스 다이오드 단락, 스트링 결선 불량 — 을 포함해
 * 정상까지 9종으로 둔다. 카드·표에서 코드를 누르면 이 내용을 펼친다.
 */
export const FAULT_CODES: FaultCode[] = [
  {
    code: 'F-000',
    label: '정상',
    category: 'normal',
    severity: 'info',
    defaultStatus: 'running',
    appliesTo: ['plant', 'inverter', 'junctionBox', 'string', 'channel'],
    technicalDetail: '실측 출력이 모델 예측 범위 안에서 움직입니다. 분류 모델이 이상 징후를 찾지 못한 상태입니다.',
    causes: [],
    actions: ['다음 정기점검 주기를 지키면 됩니다.'],
  },
  {
    code: 'F-101',
    label: '모듈 음영',
    category: 'module',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string', 'channel'],
    technicalDetail:
      '하루 중 특정 시간대에만 출력이 뚝 떨어지고 나머지 시간에는 회복됩니다. 그림자가 어레이를 지나가는 모양입니다.',
    causes: ['인접 수목 성장', '옥탑 구조물·난간 그림자', '신축 건물에 따른 일조 변화'],
    actions: [
      '어레이 남측 수목을 가지치기하세요.',
      '오후 시간대 출력 곡선에서 그림자 구간을 확인하세요.',
      '음영이 고정적이면 모듈 재배치를 검토하세요.',
    ],
  },
  {
    code: 'F-102',
    label: '모듈 오염',
    category: 'module',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['string', 'channel'],
    technicalDetail:
      '시간대에 관계없이 출력이 완만하게 낮습니다. 표면 오염으로 모듈에 닿는 일사가 전반적으로 줄어든 상태입니다.',
    causes: ['모듈 표면 먼지·황사 누적', '조류 배설물', '강우 부족으로 자연 세척 지연'],
    actions: ['모듈 표면을 세척하세요.', '세척 전후 출력을 비교해 회복 폭을 확인하세요.', '세척 주기를 계절에 맞춰 조정하세요.'],
  },
  {
    code: 'F-103',
    label: '바이패스 다이오드 단락',
    category: 'module',
    severity: 'critical',
    defaultStatus: 'fault',
    appliesTo: ['string'],
    technicalDetail:
      '해당 스트링 전압이 계단처럼 한 단 떨어져 있습니다. 모듈 안 바이패스 다이오드가 단락되면 그 구간이 발전에서 빠집니다.',
    causes: ['부분 음영 반복에 따른 다이오드 열손상', '핫스팟 누적', '제조 불량'],
    actions: [
      '스트링 개방전압을 측정해 정상 스트링과 견주세요.',
      '열화상으로 핫스팟 모듈을 특정하세요.',
      '해당 모듈을 교체하고 음영 원인을 함께 없애세요.',
    ],
  },
  {
    code: 'F-104',
    label: '스트링 결선 불량',
    category: 'wiring',
    severity: 'critical',
    defaultStatus: 'fault',
    appliesTo: ['string', 'junctionBox', 'channel'],
    technicalDetail:
      '전압은 살아 있는데 전류가 거의 흐르지 않습니다. 회로 어딘가가 끊겼거나 접촉 저항이 크게 늘어난 상태입니다.',
    causes: ['접속함 퓨즈 단선', '커넥터 접촉 저항 증가', '단자대 조임 풀림'],
    actions: [
      '해당 스트링 퓨즈 도통을 확인하세요.',
      '커넥터를 분리해 접점을 청소하고 다시 체결하세요.',
      '단자대 토크를 규정값으로 다시 조이세요.',
    ],
  },
  {
    code: 'F-201',
    label: '인버터 과열',
    category: 'thermal',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: ['inverter'],
    technicalDetail:
      '내부 온도가 기준을 넘어 인버터가 스스로 출력을 제한하고 있습니다. 정오 무렵에 출력 상한이 눌리는 모양으로 나타납니다.',
    causes: ['냉각 팬 고착', '통풍구 먼지 누적', '설치 공간 환기 부족'],
    actions: ['냉각 팬 회전을 확인하세요.', '통풍구와 방열핀을 청소하세요.', '함체 주변 환기 여유를 확보하세요.'],
  },
  {
    code: 'F-202',
    label: '절연저항 저하',
    category: 'insulation',
    severity: 'critical',
    defaultStatus: 'fault',
    appliesTo: ['inverter', 'junctionBox'],
    technicalDetail:
      '대지 절연저항이 기준치 아래로 떨어졌습니다. 감전·화재 위험이 있어 다른 어떤 항목보다 먼저 확인해야 합니다.',
    causes: ['케이블 피복 손상', '접속함 내부 침수', '모듈 프레임 접지 불량'],
    actions: ['우천 직후 절연저항을 재측정하세요.', '접속함 방수 상태와 배수를 점검하세요.', '접지 저항이 기준치인지 확인하세요.'],
  },
  {
    code: 'F-301',
    label: '일사량계 계측 오차',
    category: 'sensor',
    severity: 'caution',
    defaultStatus: 'degraded',
    appliesTo: [],
    technicalDetail:
      '설비는 정상인데 일사량 대비 발전량만 낮게 계산됩니다. 센서가 실제보다 큰 값을 읽으면 기대 발전량이 부풀려집니다.',
    causes: ['센서 돔 오염', '수평 틀어짐', '보정 주기 경과'],
    actions: ['센서 돔을 부드러운 천으로 닦으세요.', '수평계로 설치각을 다시 맞추세요.', '인근 관측소 값과 견주어 편차를 확인하세요.'],
  },
  {
    code: 'F-401',
    label: '통신 장애',
    category: 'communication',
    severity: 'critical',
    defaultStatus: 'commLost',
    appliesTo: ['inverter'],
    technicalDetail:
      '수집장치가 응답하지 않아 계측값이 들어오지 않습니다. 발전 자체는 정상일 수 있어 설비 고장과 구분해 다뤄야 합니다.',
    causes: ['현장 통신 모뎀 전원 차단', 'LTE 신호 세기 부족', '수집장치와 인버터 사이 RS-485 결선 불량'],
    actions: [
      '모뎀 전원과 상태 LED를 확인하세요.',
      '신호 세기가 -110dBm 이하면 안테나 위치를 옮기세요.',
      '통신 단자대 결선을 다시 조이세요.',
    ],
  },
];

const FAULT_BY_CODE = new Map(FAULT_CODES.map((fault) => [fault.code, fault]));

export const getFaultCode = (code: string | null) => (code ? (FAULT_BY_CODE.get(code) ?? null) : null);

/** 분류 라벨 목록 — 모델 성능 표(Confusion Matrix)의 축으로 쓴다. */
export const FAULT_LABELS = FAULT_CODES.map((fault) => fault.label);

/**
 * 인버터 상태에 붙을 수 있는 고장코드 후보.
 * 일사량계(F-301)는 설비 계층 밖이라 여기 넣지 않는다.
 */
export const FAULT_BY_STATUS: Record<OperationStatus, string[]> = {
  running: [],
  ready: [],
  degraded: ['F-101', 'F-102', 'F-201'],
  fault: ['F-103', 'F-104', 'F-202'],
  commLost: ['F-401'],
};
