/**
 * 오류 코드별 설명과 대처 방안 (SIF-004-04/05, SIF-005-03).
 * "오류가 발생했습니다"로 끝내지 않고, 무엇이 잘못됐고 무엇을 하면 되는지까지 적는다.
 */
export interface ErrorEntry {
  code: string;
  title: string;
  cause: string;
  action: string;
}

export const ERROR_CATALOG: Record<string, ErrorEntry> = {
  'NET-001': {
    code: 'NET-001',
    title: '수집 서버 응답 지연',
    cause: '수집 서버가 정해진 시간 안에 응답하지 않았습니다.',
    action: '잠시 후 다시 조회해 보세요. 계속 같은 증상이면 수집 현황 화면에서 서버 상태를 확인하세요.',
  },
  'NET-002': {
    code: 'NET-002',
    title: 'RTU 미응답',
    cause: '현장 RTU가 응답하지 않아 해당 구간 계측값이 비어 있습니다.',
    action: 'RTU 전원과 통신 신호를 확인하세요. 통신단절로 판정된 설비는 알림이력에 함께 기록됩니다.',
  },
  'DAT-001': {
    code: 'DAT-001',
    title: '조회 기간이 너무 넓습니다',
    cause: '한 번에 조회할 수 있는 기간을 넘겼습니다.',
    action: '기간을 1년 이내로 좁혀 다시 조회하세요.',
  },
  'DAT-002': {
    code: 'DAT-002',
    title: '유효 발전 데이터 없음',
    cause: '고른 기간에 판정할 수 있는 발전 데이터가 없습니다.',
    action: '수집이 정상인 날짜가 포함되도록 기간을 옮겨 다시 진단하세요.',
  },
  'FIL-001': {
    code: 'FIL-001',
    title: '첨부파일 용량 초과',
    cause: '허용 용량을 넘는 파일이 있습니다.',
    action: '사진은 해상도를 줄여 다시 올리거나, 여러 건으로 나눠 첨부하세요.',
  },
  'AUT-001': {
    code: 'AUT-001',
    title: '접근 권한 없음',
    cause: '지금 계정으로는 이 화면을 열 수 없습니다.',
    action: '담당 설비 범위를 확인하고, 필요하면 소속 기관 담당자에게 권한을 요청하세요.',
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    title: '처리 중 문제가 생겼습니다',
    cause: '원인을 특정하지 못했습니다.',
    action: '화면을 새로 열어 다시 시도하고, 같은 증상이 이어지면 화면 이름과 시각을 담당자에게 알려 주세요.',
  },
};

export const getError = (code: string): ErrorEntry => ERROR_CATALOG[code] ?? ERROR_CATALOG.UNKNOWN;

export const ERROR_CODES = Object.keys(ERROR_CATALOG).filter((code) => code !== 'UNKNOWN');
