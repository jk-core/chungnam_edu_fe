import { z } from 'zod';
import { MSG } from '@/configs/messages';

/**
 * 그룹관리자 편집 폼 (SFR-018, SFR-023) — 정하는 것은 그 사람이 볼 발전소뿐이다.
 *
 * BE v2.0 은 계정에 담당 발전소를 거는 칸(`powerPlantIds`)을 아직 받지 않는다.
 */
export type GroupFormValues = z.infer<typeof groupFormSchema>;
export const groupFormSchema = z.object({
  userId: z.number(MSG.selectRequired('그룹관리자')).int(),
  /** 보일 이름 — 규칙은 id 가 진다 (참조가 지워지면 이름만 비는데 오류를 보여 줄 자리가 없다) */
  userLabel: z.string(),
  powerPlantIds: z.array(z.number().int()).min(1, '맡을 발전소를 한 곳 이상 골라 주세요.'),
});
