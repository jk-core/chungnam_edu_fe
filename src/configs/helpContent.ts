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
      '통합관제 지도를 확대·축소하며 지역별 발전소 상태를 봅니다.',
      '이상 표시가 있는 학교를 누르면 상세 화면으로 이어집니다.',
    ],
    errorCodes: ['NET-001'],
  },
  [PATH.ENERGY_STATISTICS]: {
    overview: '고른 설비 계층의 발전량과 환경 기여도를 한 화면에서 봅니다. 날짜 선택 달력에 그 날 날씨와 발전 실적이 함께 나옵니다.',
    steps: [
      '좌측 조회 대상에서 발전소를 고르고, 필요하면 인버터까지 좁힙니다.',
      '일별·월별·연도별로 기간 단위를 바꿉니다.',
      '표·차트 버튼으로 보기 방식을 고릅니다.',
      '엑셀 내려받기로 조회 결과를 저장합니다.',
    ],
    errorCodes: ['DAT-001', 'DAT-002'],
  },
  [PATH.ENERGY_HISTORY]: {
    overview: '수집주기마다 올라온 계측값을 그대로 폅니다.',
    steps: [
      '좌측 조회 대상에서 발전소·인버터를 고릅니다.',
      '달력에서 날짜를 누르면 그 날 기록으로 바뀝니다.',
      '엑셀 내려받기 버튼으로 CSV 를 저장합니다.',
    ],
    errorCodes: ['NET-002', 'DAT-002'],
  },
  [PATH.ENERGY_FIELD_REPORT]: {
    overview: '현장 점검 결과를 온라인으로 작성하고 점검 일정을 관리합니다.',
    steps: [
      '보고서 작성 버튼으로 양식을 고르고 체크리스트를 채웁니다.',
      '사진을 붙이고 임시 저장했다가 제출합니다.',
      '관계자 공유 버튼으로 권한이 있는 담당자에게 보냅니다.',
    ],
    errorCodes: ['FIL-001'],
  },
  [PATH.ENERGY_PLANT_INFO]: {
    overview: '고른 발전소의 등록 제원과 설비 구성을 봅니다. 값을 고치는 것은 관리자 콘솔에서 합니다.',
    steps: [
      '좌측 조회 대상에서 발전소를 고릅니다.',
      '등록 정보에서 주소·준공·시공 업체·담당자를 확인합니다.',
      '설비 구성 표에서 인버터별 제품·모듈 구성·설치 각도를 봅니다.',
      '값이 올라오지 않으면 계측 설비의 RTU·일사량계 상태를 먼저 확인합니다.',
    ],
    errorCodes: ['DAT-002'],
  },
  [PATH.AI_DIAGNOSIS_OVERVIEW]: {
    overview: '설비별 진단 현황과 일자별 발전 효율을 한 화면에서 봅니다.',
    steps: [
      '조회 대상과 기간을 고릅니다.',
      '일자별 발전효율 표에서 색이 들어온 칸을 누르면 원인·조치와 참고 사진이 열립니다.',
      '표·차트 버튼으로 보기 방식을 바꿉니다.',
    ],
    errorCodes: ['DAT-001', 'DAT-002'],
  },
  [PATH.AI_DIAGNOSIS_ALERTS]: {
    overview: '발생한 알림과 고장 타임라인을 함께 봅니다.',
    steps: [
      '기간·유형·심각도로 거릅니다.',
      '미조치 건은 경과가 오래된 것부터 확인합니다.',
      '타임라인에서 막대를 누르면 단계별 이력과 조치 기록이 열립니다.',
    ],
    errorCodes: [],
  },
  [PATH.GUIDE_NOTICE]: {
    overview: '시스템 공지와 점검 안내를 봅니다.',
    steps: ['제목을 누르면 본문이 열립니다.'],
    errorCodes: [],
  },
  [PATH.GUIDE_INQUIRY]: {
    overview: '궁금한 점을 남기고 답변을 받습니다.',
    steps: ['질문을 등록하면 담당자가 답변을 답니다.'],
    errorCodes: [],
  },
  [PATH.AI_DIAGNOSIS_MONTHLY]: {
    overview: '설비별 월간보고서를 자동 생성해 PDF 로 저장합니다.',
    steps: ['보고 월과 발전소를 고릅니다.', 'PDF 로 저장 버튼을 누르면 인쇄 대화상자가 열립니다.'],
    errorCodes: ['DAT-002'],
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
