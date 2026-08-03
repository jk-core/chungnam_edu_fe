import dayjs from 'dayjs';
import { Button } from '@/components/common/Button';
import { INVERTER_TYPE_LABEL } from '@/mocks/equipment';
import { KIND_LABEL } from '@/mocks/tree';
import { useAiAnalysis } from '@/hooks/useAiAnalysis';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import { AiAnalysisModal } from './AiAnalysisModal';
import { AiOrbit } from './AiOrbit';
import styles from './AiAnalysis.module.scss';

/**
 * AI 고장분석 실행 배너.
 * 판정 대상과 기간을 미리 밝혀 두어, 무엇을 분석하는지 누르기 전에 알 수 있게 한다.
 */
export function AnalysisBanner() {
  const { target, inverter, promoted } = useDiagnosisScope();
  const [range] = useDiagnosisRange();
  const analysis = useAiAnalysis(target, range.start, range.end);
  const days = dayjs(range.end).diff(dayjs(range.start), 'day') + 1;

  return (
    <>
      <section className={styles.banner} aria-label="AI 고장분석">
        <AiOrbit size={56} active={analysis.isOpen && !analysis.report} />

        <div className={styles.banner__body}>
          <p className={styles.banner__eyebrow}>AI Diagnosis</p>
          <h2 className={styles.banner__title}>AI 고장분석</h2>
          <p className={styles.banner__text}>
            일사량으로 계산한 기대 출력과 실측값을 맞춰 보고, 고장으로 볼 만한 구간에 원인과 조치를 붙입니다.
            {promoted ? ' 채널은 판정 대상이 아니라 상위 접속반 기준으로 분석합니다.' : ''}
          </p>
          <p className={styles.banner__meta}>
            <span>
              분석 대상 {target.fullName} ({KIND_LABEL[target.kind]})
            </span>
            <span>분석 기간 {days}일</span>
            {inverter ? <span>인버터 {INVERTER_TYPE_LABEL[inverter.type]}</span> : null}
          </p>
        </div>

        <div className={styles.banner__action}>
          <Button
            variant="solar"
            size="lg"
            isFullWidth
            onClick={analysis.start}
            disabled={analysis.isOpen && !analysis.report}
          >
            {analysis.isOpen && !analysis.report ? '분석 중…' : 'AI 진단 시작'}
          </Button>
        </div>
      </section>

      <AiAnalysisModal
        isOpen={analysis.isOpen}
        percent={analysis.percent}
        stage={analysis.stage}
        report={analysis.report}
        onClose={analysis.close}
      />
    </>
  );
}
