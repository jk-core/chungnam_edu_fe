/**
 * 사용자에게 보여 줄 문구를 한곳에 모은다 (SIF-004-02).
 * 화면마다 따로 쓰면 같은 상황에 다른 말이 나가고, 표현을 다듬을 때 빠뜨리는 곳이 생긴다.
 */
export const MSG = {
  // 등록·수정·삭제 확인 (SIF-004-01)
  createConfirm: (name: string) => `${name}을(를) 등록하시겠습니까?`,
  updateConfirm: (name: string) => `${name} 변경 내용을 저장하시겠습니까?`,
  deleteConfirm: (name: string) => `${name}을(를) 삭제하시겠습니까? 삭제하면 되돌릴 수 없습니다.`,
  submitConfirm: (name: string) => `${name}을(를) 제출하시겠습니까? 제출 후에는 수정 이력이 남습니다.`,

  // 결과 알림
  createSuccess: (name: string) => `${name} 등록을 마쳤습니다.`,
  updateSuccess: (name: string) => `${name} 변경 내용을 저장했습니다.`,
  deleteSuccess: (name: string) => `${name}을(를) 삭제했습니다.`,
  submitSuccess: (name: string) => `${name}을(를) 제출했습니다.`,
  saveDraftSuccess: '임시 저장했습니다. 나중에 이어서 작성할 수 있습니다.',
  copySuccess: '클립보드에 복사했습니다.',
  downloadStart: (name: string) => `${name} 파일을 내려받습니다.`,

  // 입력 검증 (SIF-001-02)
  requiredMissing: '필수 항목을 입력해 주세요.',
  requiredField: (label: string) => `${label}을(를) 입력해 주세요.`,
  selectRequired: (label: string) => `${label}을(를) 선택해 주세요.`,
  numberRange: (label: string, min: number, max: number) => `${label}은(는) ${min} 이상 ${max} 이하로 입력해 주세요.`,
  tooLong: (label: string, max: number) => `${label}은(는) ${max}자 이내로 입력해 주세요.`,

  // 첨부파일 (SFR-021-05)
  fileTooLarge: (max: number) => `파일 하나는 ${max}MB 까지 올릴 수 있습니다.`,
  fileTooMany: (max: number) => `파일은 ${max}개까지 첨부할 수 있습니다.`,
  fileTypeInvalid: '올릴 수 없는 파일 형식입니다.',

  // 처리 안내 (PER-001-02/04)
  slowTask: '처리에 다소 시간이 걸릴 수 있습니다. 화면을 닫지 말고 기다려 주세요.',
  noResult: '조건에 맞는 자료가 없습니다.',

  // 권한
  permissionDenied: '이 기능을 사용할 권한이 없습니다. 소속 기관 담당자에게 문의하세요.',
} as const;
