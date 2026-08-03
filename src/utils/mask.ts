/**
 * 개인정보 모자이크 (SFR-016-04, SFR-018-05).
 * 판단은 호출부(권한)가 하고, 여기서는 문자열만 가린다.
 */

/** 홍길동 → 홍*동, 홍길 → 홍*, 외자·영문은 첫 글자만 남긴다. */
export function maskName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;

  return `${trimmed[0]}${'*'.repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}

/** 010-1234-5678 → 010-****-5678. 가운데 자리만 가린다. */
export function maskPhone(phone: string): string {
  const parts = phone.trim().split('-');

  if (parts.length < 3) return phone.replace(/\d(?=\d{4})/g, '*');

  return [parts[0], ...parts.slice(1, -1).map((part) => '*'.repeat(part.length)), parts[parts.length - 1]].join('-');
}

/** 시·군·구·읍·면·동까지만 남기고 상세 주소를 가린다. */
export function maskAddress(address: string): string {
  const tokens = address.trim().split(/\s+/);
  const lastAreaIndex = tokens.findLastIndex((token) => /[시군구읍면동]$/.test(token));

  if (lastAreaIndex < 0 || lastAreaIndex === tokens.length - 1) return address;

  return `${tokens.slice(0, lastAreaIndex + 1).join(' ')} ***`;
}

/** 이메일 로컬 파트 뒷부분을 가린다. mgr11@a.b → mg***@a.b */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');

  if (!domain || local.length <= 2) return email;

  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
}
