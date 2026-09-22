import { z } from 'zod';
import { dropdownSchema } from '@/service/common';

/**
 * 지역 드롭다운 한 줄.
 *
 * `id` 가 숫자다 — 발전소 저장 계약의 `regionCode` 는 문자열이라 그대로 실어 보내면 형이
 * 어긋난다. 고른 값을 문자열로 바꿔 넣는다.
 */
export type AreaDropdown = z.infer<typeof areaDropdownSchema>;
export const areaDropdownSchema = dropdownSchema(z.number().int());
