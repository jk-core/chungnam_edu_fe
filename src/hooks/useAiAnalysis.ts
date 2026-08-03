import { useCallback, useEffect, useRef, useState } from 'react';
import { getDiagnosisReport, stageOf } from '@/mocks/llmDiagnosis';
import type { AnalysisStage, DiagnosisReport } from '@/interface/diagnosis';
import type { ScopeNode } from '@/mocks/tree';

/** 결과가 도착해도 100%(완료)를 잠깐 보여 준 뒤 본문을 공개한다. */
const REVEAL_HOLD_MS = 600;
const TICK_MS = 220;

interface State {
  isOpen: boolean;
  percent: number;
  stage: AnalysisStage;
  report: DiagnosisReport | null;
  /** 진행 화면을 접고 결과를 펼칠 준비가 됐는지 */
  revealed: boolean;
}

const IDLE: State = { isOpen: false, percent: 0, stage: 'scan', report: null, revealed: false };

/**
 * AI 고장분석 실행 상태.
 * 실제 서비스는 SSE 로 진행률과 결과가 흘러오는데, 여기서는 타이머로 그 흐름을 흉내 낸다.
 * 진행률은 구간마다 속도가 다르게 올라 "생성형 추론"에서 오래 머무는 느낌을 준다.
 */
export function useAiAnalysis(node: ScopeNode, start: Date, end: Date) {
  const [state, setState] = useState<State>(IDLE);
  const timerRef = useRef<number | undefined>(undefined);
  const holdRef = useRef<number | undefined>(undefined);

  const clear = useCallback(() => {
    if (timerRef.current !== undefined) window.clearInterval(timerRef.current);
    if (holdRef.current !== undefined) window.clearTimeout(holdRef.current);
    timerRef.current = undefined;
    holdRef.current = undefined;
  }, []);

  const close = useCallback(() => {
    clear();
    setState(IDLE);
  }, [clear]);

  const start_ = useCallback(() => {
    clear();
    setState({ isOpen: true, percent: 0, stage: 'scan', report: null, revealed: false });

    timerRef.current = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isOpen || prev.percent >= 100) return prev;

        // 스캔·분류는 빠르게, 심층 추론은 천천히 오른다.
        const step = prev.percent < 26 ? 7 : prev.percent < 92 ? 3.4 : 1.6;
        const percent = Math.min(100, Math.round((prev.percent + step) * 10) / 10);

        return { ...prev, percent, stage: stageOf(percent) };
      });
    }, TICK_MS);
  }, [clear]);

  // 100% 에 닿으면 결과를 붙이고, 잠깐 완료 화면을 보여 준 뒤 공개한다.
  useEffect(() => {
    if (!state.isOpen || state.percent < 100 || state.revealed) return;

    if (timerRef.current !== undefined) {
      window.clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    const report = getDiagnosisReport(node, start, end);

    holdRef.current = window.setTimeout(() => {
      setState((prev) => (prev.isOpen ? { ...prev, report, revealed: true } : prev));
    }, REVEAL_HOLD_MS);

    return () => {
      if (holdRef.current !== undefined) window.clearTimeout(holdRef.current);
    };
  }, [state.isOpen, state.percent, state.revealed, node, start, end]);

  // 조회 대상이 바뀌면 열려 있던 분석은 의미가 없어진다. 정리 시점에 닫는다.
  useEffect(() => close, [node.id, close]);

  return { ...state, start: start_, close };
}
