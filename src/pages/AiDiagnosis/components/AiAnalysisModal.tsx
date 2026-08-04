import { useEffect, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Button } from '@/components/common/Button';
import { DIAG_EFFICIENCY_WARN } from '@/mocks/equipment';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { Modal } from '@/components/common/Modal';
import type { AnalysisStage, DiagnosisReport } from '@/interface/diagnosis';
import { AiOrbit } from './AiOrbit';
import { AnalyzingProgress } from './AnalyzingProgress';
import styles from './AiAnalysis.module.scss';

/** 소견 문장을 한 줄씩 내보내는 간격 */
const LINE_INTERVAL_MS = 620;

interface AiAnalysisModalProps {
  isOpen: boolean;
  percent: number;
  stage: AnalysisStage;
  report: DiagnosisReport | null;
  onClose: () => void;
}

/**
 * 소견을 한 문장씩 내보낸다. 한 번에 쏟아 놓으면 읽히지 않는다.
 * 보고서가 바뀌면 key 로 다시 마운트해 첫 문장부터 시작한다.
 */
function InsightLines({ lines }: { lines: string[] }) {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setShown((prev) => {
        if (prev >= lines.length) {
          window.clearInterval(timer);

          return prev;
        }

        return prev + 1;
      });
    }, LINE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [lines.length]);

  return (
    <div className={styles.insight__list}>
      {lines.slice(0, shown).map((line, index) => (
        <p key={line} className={styles.insight__line}>
          <span>
            {line}
            {/* 아직 더 쓸 문장이 남았으면 마지막 줄 끝에서 커서가 깜빡인다 */}
            {index === shown - 1 && shown < lines.length ? (
              <span className={styles.insight__caret} aria-hidden />
            ) : null}
          </span>
        </p>
      ))}
    </div>
  );
}

export function AiAnalysisModal({ isOpen, percent, stage, report, onClose }: AiAnalysisModalProps) {
  const abnormal = report?.findings.filter((finding) => isAbnormal(finding.status)) ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="AI 고장분석"
      description={
        report
          ? `${report.targetName} · ${report.startDate} ~ ${report.endDate}`
          : '수집값을 스캔해 고장을 분류하고, 원인과 조치를 문장으로 정리합니다.'
      }
      footer={report ? <Button onClick={onClose}>닫기</Button> : null}
    >
      {report ? (
        <div className={styles.report}>
          <div className={styles.insight}>
            <div className={styles.insight__head}>
              <AiOrbit size={26} />
              <p className={styles.insight__title}>AI 참고 소견</p>
            </div>
            <InsightLines key={`${report.targetId}-${report.startDate}-${report.endDate}`} lines={report.insight} />
          </div>

          <div className={styles.report__meta}>
            <span>분석 모델 {report.model}</span>
            <span>생성 시각 {report.generatedAt}</span>
            {report.irradSensorSuspected ? <span>일사량계 계측 오차 의심</span> : null}
          </div>

          <div className={styles.findings}>
            <p className={styles.findings__title}>
              설비별 소견 {formatNumber(report.findings.length)}건
              {abnormal.length > 0 ? ` · 이상 ${formatNumber(abnormal.length)}건` : ''}
            </p>

            {report.findings.length === 0 ? (
              <p className={styles.report__empty}>판정할 하위 설비가 없습니다.</p>
            ) : (
              report.findings.map((finding) => (
                <article
                  key={finding.id}
                  className={cn(styles.finding, {
                    [styles['finding--abnormal']]: isAbnormal(finding.status),
                  })}
                >
                  <header className={styles.finding__head}>
                    <div>
                      <p className={styles.finding__name}>{finding.equipmentName}</p>
                      <p className={styles.finding__parent}>{finding.parentName}</p>
                    </div>
                    <div className={styles.finding__badges}>
                      <span
                        className={cn(styles.finding__efficiency, {
                          [styles['finding__efficiency--low']]: finding.diagEfficiency < DIAG_EFFICIENCY_WARN,
                        })}
                      >
                        진단효율 {formatNumber(finding.diagEfficiency, 1)}%
                      </span>
                      {finding.snowSuspected ? <Badge tone="brand">적설 의심</Badge> : null}
                      {finding.faultCode ? <Badge tone="critical">{finding.faultCode}</Badge> : null}
                      <Badge tone={OPERATION_TONE[finding.status]} withDot>
                        {OPERATION_LABEL[finding.status]}
                      </Badge>
                    </div>
                  </header>

                  <p className={styles.finding__row}>
                    <span className={styles.finding__tag}>원인</span>
                    {finding.cause}
                  </p>
                  <p className={styles.finding__row}>
                    <span className={styles.finding__tag}>권고</span>
                    {finding.recommendation}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : (
        <AnalyzingProgress percent={percent} stage={stage} />
      )}
    </Modal>
  );
}
