/**
 * 개인정보 모자이크 (SFR-018-05).
 * 판단은 호출부(권한)가 하고, 여기서는 문자열만 가린다.
 */

/** 이메일 로컬 파트 뒷부분을 가린다. mgr11@a.b → mg***@a.b */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');

  if (!domain || local.length <= 2) return email;

  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
}
