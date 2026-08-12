import { useEffect, useState } from 'react';
import { EDU_SCAN_STAGES, eduStageOf, SCAN_CYCLE_MS, SCAN_RUN_MS } from '@/mocks/eduDiagnosis';
import type { EduScanStage } from '@/mocks/eduDiagnosis';

/** 진행률을 다시 읽는 간격. 게이지의 CSS 전환이 이 사이를 메운다. */
const TICK_MS = 200;

/**
 * 소견이 드러나기 시작하는 진행률 — 추론 단계에 들어선 뒤부터다.
 * 단계 구간을 손보면 여기도 따라와야 하므로 표에서 직접 읽는다.
 */
const REASON_FROM = EDU_SCAN_STAGES.find((item) => item.stage === 'classify')?.until ?? 0;

export interface EduScan {
  percent: number;
  stage: EduScanStage;
  /** 지금 단계 안에서 얼마나 왔는지 (0~1). 단계별 본문이 이 값에 맞춰 차오른다 */
  stageProgress: number;
  /** 100% 에 닿아 결과를 보여 주고 있는 동안 */
  finished: boolean;
  /** 지금까지 드러난 소견 줄 수 */
  revealed: number;
}

/**
 * 교육용 AI 진단이 도는 상태 (SFR-005-07/08).
 *
 * 운영용 `useAiAnalysis` 는 사람이 눌러 시작하고 한 번 끝나면 멈춘다. 여기는 아무도 누르지 않는
 * 복도 모니터라 스스로 무한히 돌아야 해서 따로 두었다.
 *
 * 진행률을 틱마다 더해 쌓지 않고 **시작한 뒤 흐른 시간으로 계산**하는 것이 핵심이다.
 * 브라우저는 화면이 가려진 탭의 `setInterval` 을 1초까지 늦추는데, 쌓아 올리는 방식이면 그동안
 * 진행이 밀려 벽시계와 어긋난 채로 남는다. 흐른 시간을 보면 늦게 깨어나도 제자리를 찾는다.
 */
export function useEduAiScan(lineCount: number): EduScan {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    // 시각을 읽는 일은 그릴 때가 아니라 붙은 뒤에 한다 — 그려지는 동안은 값이 늘 같아야 한다.
    const startedAt = Date.now();
    const read = () => setPosition((Date.now() - startedAt) % SCAN_CYCLE_MS);

    read();

    const timer = window.setInterval(read, TICK_MS);

    // 화면이 다시 보이는 순간에는 틱을 기다리지 않고 곧바로 맞춘다.
    document.addEventListener('visibilitychange', read);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', read);
    };
  }, []);

  const finished = position >= SCAN_RUN_MS;
  const percent = finished ? 100 : Math.round((position / SCAN_RUN_MS) * 1000) / 10;
  const reasonProgress = (percent - REASON_FROM) / (100 - REASON_FROM);
  const stage = eduStageOf(percent, finished);
  // 이 단계가 시작된 지점을 찾아, 단계 안에서의 진행도를 따로 낸다.
  const index = EDU_SCAN_STAGES.indexOf(stage);
  const from = index > 0 ? EDU_SCAN_STAGES[index - 1].until : 0;
  const span = stage.until - from;

  return {
    percent,
    stage,
    stageProgress: finished || span <= 0 ? 1 : Math.min(1, Math.max(0, (percent - from) / span)),
    finished,
    revealed: finished
      ? lineCount
      : Math.max(0, Math.min(lineCount, Math.ceil(reasonProgress * lineCount))),
  };
}
