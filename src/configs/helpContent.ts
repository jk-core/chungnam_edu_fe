import { PATH } from '@/routes/routes';

/**
 * 화면별 온라인 도움말 (SIF-005).
 * overview 가 화면의 목적을, steps 가 버튼 사용 순서를, errorCodes 가 자주 겪는 오류를 잇는다.
 * 오류 코드 상세는 errorCatalog 가 갖고 있어 도움말 패널이 함께 보여 준다.
 */
export interface HelpTopic {
  overview: string;
  steps: string[];
  errorCodes: string[];
}

export const HELP_CONTENT: Record<string, HelpTopic> = {
  [PATH.HOME]: {
    overview: '충남 전체 학교 태양광의 오늘 발전 현황과 이상 설비를 한눈에 봅니다.',
    steps: [
      '상단 지표에서 오늘 발전량과 이상 설비 수를 확인합니다.',
      '통합관제 지도를 확대·축소하며 시·군별 발전소 상태를 봅니다.',
      '이상 표시가 있는 학교를 누르면 상세 화면으로 이어집니다.',
    ],
    errorCodes: ['NET-001'],
  },
  [PATH.STATISTICS_OVERVIEW]: {
    overview: '고른 설비 계층(발전소·인버터·접속반·스트링)의 발전량과 세부 데이터를 봅니다.',
    steps: [
      '좌측 조회 대상에서 발전소를 고르고, 필요하면 구조 트리에서 인버터 아래까지 좁힙니다.',
      '일별·월별·연도별 탭과 일자 선택으로 기간을 정합니다.',
      '데이터 내려받기 버튼으로 표를 CSV 파일로 저장합니다.',
    ],
    errorCodes: ['DAT-001', 'NET-001'],
  },
  [PATH.STATISTICS_PERIOD]: {
    overview: '기간을 정해 발전 추이를 비교합니다.',
    steps: ['기간을 고릅니다.', '그래프에 마우스를 올려 일자별 수치를 확인합니다.'],
    errorCodes: ['DAT-001'],
  },
  [PATH.STATISTICS_SCHOOL]: {
    overview: '학교끼리 발전량·이용률을 견줍니다.',
    steps: ['정렬 기준을 고릅니다.', '학교를 누르면 그 학교 기준으로 조회 대상이 바뀝니다.'],
    errorCodes: [],
  },
  [PATH.STATISTICS_ECO]: {
    overview: '발전량을 탄소 저감량·나무 그루 수로 환산해 봅니다.',
    steps: ['기간을 고르면 환산값이 다시 계산됩니다.'],
    errorCodes: [],
  },
  [PATH.COLLECTION_TREND]: {
    overview: '통신주기(1분) 계측값의 흐름을 그래프로 봅니다.',
    steps: [
      '조회 대상과 일자를 고릅니다.',
      '보고 싶은 계측 항목을 켜고 끕니다.',
      '구간을 드래그하면 확대됩니다.',
    ],
    errorCodes: ['NET-002', 'DAT-002'],
  },
  [PATH.COLLECTION_RAW]: {
    overview: '검증 전 원시 데이터를 표로 확인합니다.',
    steps: ['일자를 고릅니다.', '이상값이 있는 행은 색으로 표시됩니다.'],
    errorCodes: ['NET-002'],
  },
  [PATH.COLLECTION_STATUS]: {
    overview: '발전소별 수집 성공률과 최근 수신 시각을 봅니다.',
    steps: ['미수신 발전소부터 확인합니다.'],
    errorCodes: ['NET-001', 'NET-002'],
  },
  [PATH.COLLECTION_HISTORY]: {
    overview: '인버터별 운전 기록을 달력과 표로 조회하고 내려받습니다.',
    steps: [
      '달력에서 날짜를 누르면 그 날 기록으로 바뀝니다.',
      '그래프·표 전환 버튼으로 보기 방식을 고릅니다.',
      '엑셀 내려받기 버튼으로 CSV 를 저장합니다.',
    ],
    errorCodes: ['NET-002', 'DAT-002'],
  },
  [PATH.AI_DIAGNOSIS_OVERVIEW]: {
    overview: '발전 지표와 설비별 진단, 일자별 발전 효율을 한 화면에서 봅니다.',
    steps: [
      '조회 대상과 기간을 고릅니다.',
      'AI 고장분석 버튼으로 원인 소견을 받습니다.',
      '일자별 발전효율 표에서 색이 들어온 칸을 누르면 원인·조치와 참고 사진이 열립니다.',
      '표·차트 버튼으로 보기 방식을 바꿉니다.',
    ],
    errorCodes: ['DAT-001', 'DAT-002'],
  },
  [PATH.AI_DIAGNOSIS_SCHEDULE]: {
    overview: '현장 점검 일정을 등록하고 관리합니다.',
    steps: ['일정 등록 버튼으로 방문일과 대상을 정합니다.'],
    errorCodes: [],
  },
  [PATH.ALERTS_LIST]: {
    overview: '발생한 알림을 조건으로 걸러 봅니다.',
    steps: ['기간·유형·심각도로 거릅니다.', '행을 누르면 원인·조치 방법이 열립니다.'],
    errorCodes: [],
  },
  [PATH.ALERTS_PENDING]: {
    overview: '아직 조치되지 않은 알림을 경과 순으로 봅니다.',
    steps: [
      '경과가 오래된 건부터 확인합니다.',
      '조치 예정일 버튼으로 알림을 예정일까지 접어 둘 수 있습니다.',
    ],
    errorCodes: [],
  },
  [PATH.ALERTS_TIMELINE]: {
    overview: '고장 발생부터 조치 완료까지 단계별 이력을 관리합니다.',
    steps: [
      '막대 길이로 얼마나 오래 끌었는지 봅니다.',
      '발전소 이름을 누르면 설비별로 펼쳐집니다.',
      '막대를 누르면 단계별 이력이 열리고, 조치 기록 버튼으로 진행·완료를 남깁니다.',
    ],
    errorCodes: [],
  },
  [PATH.ALERTS_SETTINGS]: {
    overview: '알림 수신 조건을 설정합니다.',
    steps: ['항목별 수신 여부를 켜고 끕니다.'],
    errorCodes: [],
  },
  [PATH.REPORTS_MONTHLY]: {
    overview: '설비별 월간보고서를 자동 생성해 PDF 로 저장합니다.',
    steps: ['보고 월과 발전소를 고릅니다.', 'PDF 로 저장 버튼을 누르면 인쇄 대화상자가 열립니다.'],
    errorCodes: ['DAT-002'],
  },
  [PATH.REPORTS_FIELD]: {
    overview: '점검 체크리스트와 현장 사진으로 보고서를 작성합니다.',
    steps: [
      '보고서 작성 버튼으로 양식을 고릅니다.',
      '항목마다 정상·이상·해당없음 중 하나를 고르고 사진을 붙입니다.',
      '임시 저장해 두면 나중에 이어서 제출할 수 있습니다.',
    ],
    errorCodes: ['FIL-001'],
  },
  [PATH.REPORTS_BOARD]: {
    overview: '공지사항과 Q&A 를 주고받습니다.',
    steps: ['글쓰기 버튼으로 글을 올립니다.', '공지사항은 기간을 정해 메인 화면 팝업으로 띄울 수 있습니다.'],
    errorCodes: [],
  },
  [PATH.MY]: {
    overview: '내 계정 정보를 확인하고 비밀번호를 바꿉니다.',
    steps: ['현재 비밀번호를 확인한 뒤 새 비밀번호를 두 번 입력합니다.'],
    errorCodes: ['AUT-001'],
  },
};

/** 관리자 콘솔 공통 도움말 — 화면별 항목이 없을 때의 기본값이기도 하다. */
export const HELP_FALLBACK: HelpTopic = {
  overview: '이 화면의 도움말이 준비 중입니다. 사용 중 막히면 관리자에게 문의하세요.',
  steps: ['좌측 메뉴에서 화면을 고릅니다.', '표·그래프의 항목을 누르면 상세 정보가 열립니다.'],
  errorCodes: ['UNKNOWN'],
};

/** 현재 경로에 맞는 도움말. 상세 경로는 가장 긴 접두사로 잡는다. */
export function findHelp(pathname: string): HelpTopic {
  if (HELP_CONTENT[pathname]) return HELP_CONTENT[pathname];

  const prefix = Object.keys(HELP_CONTENT)
    .filter((path) => path !== PATH.HOME && pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];

  return prefix ? HELP_CONTENT[prefix] : HELP_FALLBACK;
}
