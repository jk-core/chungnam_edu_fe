import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDuration, formatNumber } from '@/utils/format';
import { useSnoozeMap } from '@/stores/faultActionStore';
import { AlertDetailModal } from '../AlertDetailModal';
import { detailOfTimeline } from '../alarmDetail';
import styles from './FaultTimeline.module.scss';
import { FaultGantt } from './FaultGantt';
import { useFaultTimelines } from './useFaultTimelines';

/**
 * 고장 발생부터 조치 완료까지 단계별 이력 (SFR-015).
 *
 * 정상 가동 기간은 만들지 않고 이상 발생 구간만 모아 보여 준다.
 * 알림 이력 화면에서 표와 갈아 끼워 쓴다 — 알림 한 줄 한 줄이 아니라 **고장 한 건이 언제부터
 * 언제까지였는지** 를 보는 자리라, 걸린 조건에 맞는 알림이 없어도 제 내용을 그린다.
 */
export function FaultTimeline() {
  const { label, timelines, axis, openCount, totalLoss, averageMinutes } = useFaultTimelines();
  const snoozedUntil = useSnoozeMap();

  const [detailId, setDetailId] = useState<string | null>(null);
  const selected = timelines.find((item) => item.id === detailId) ?? null;

  return (
    <>
      <div className={styles.panel}>
        {/* 표 대신 이 판을 볼 때도 몇 건인지는 알아야 한다 — 카드 제목이 표 기준이라 여기서 따로 적는다 */}
        <p className={styles.panel__note}>
          이상 발생 구간 {formatNumber(timelines.length)}건 · 미조치 {formatNumber(openCount)}건 · 평균 경과{' '}
          {formatDuration(averageMinutes)} · 추정 손실 {formatNumber(totalLoss, 0)}kWh
        </p>

        {timelines.length === 0 ? (
          <EmptyState
            title="이상 발생 구간이 없습니다"
            description={`${label}에는 조회 범위 안에 기록된 고장이 없습니다.`}
          />
        ) : (
          <FaultGantt rows={timelines} from={axis.from} to={axis.to} onSelect={(item) => setDetailId(item.id)} />
        )}
      </div>

      {/* 표에서 누른 알림과 같은 창이다 — 보는 것이 같으니 창도 하나다 */}
      <AlertDetailModal
        alarm={selected ? detailOfTimeline(selected, snoozedUntil[selected.id] ?? null) : null}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
