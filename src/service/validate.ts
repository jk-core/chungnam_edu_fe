import { z } from 'zod';

/*
  응답이 계약과 같은지 본다.

  스키마 마흔일곱 벌이 이미 있었지만 **런타임에 한 번도 쓰이지 않았다** — `z.infer` 로 타입만
  뽑아 쓰고 있었다. 그래서 명세가 `regionName: z.string()` 이라 적혀 있어도 서버가 `null` 을
  주면 TypeScript 는 선언을 믿고 통과시키고, 그 `null` 이 열 단계를 흘러가 엉뚱한 자리에서
  터졌다 — 「`null.trim()`」 같은 식으로, 원인에서 가장 먼 곳에서 (2026-09-22).
*/

/** 같은 경고를 매 조회마다 쏟지 않는다 — 판이 스스로 갱신하는 화면에서는 1분에 수십 번 온다 */
const warned = new Set<string>();

/**
 * 계약과 견주어 보고, 어긋나면 **알리기만** 한다.
 *
 * 값을 막지 않는 것은 일부러다. 엄격히 거르면 지금까지 조용히 흘러가던 불일치가 한꺼번에
 * 드러나 멀쩡히 보이던 화면들이 함께 멈춘다. 그래서 동작은 종전과 같게 두고, 어느 조회의
 * 어느 필드가 왜 어긋났는지를 콘솔에 남긴다 — 그 목록이 곧 고칠 자리의 목록이다.
 *
 * 명세와 실제가 맞아떨어지는 것이 확인되면 이 함수를 `schema.parse` 로 바꾸면 된다.
 */
export function checked<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);

  if (result.success) return result.data;

  if (!warned.has(label)) {
    warned.add(label);

    // eslint-disable-next-line no-console
    console.warn(`[API 계약 불일치] ${label}`, z.treeifyError(result.error));
  }

  /*
    걸러 내지 않고 원본을 그대로 넘긴다. 타입 단정이 불편하지만 여기서 막으면 위에 적은
    까닭대로 화면이 더 많이 멈춘다 — 이 자리는 「고칠 곳을 드러내는」 몫까지만 한다.
  */
  return data as T;
}
