import { CUMULATIVE, PEAK_OUTPUT } from '@/mocks/generation';
import { formatNumber, scaleSi } from '@/utils/format';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../WarRoom.module.scss';
import { Line, Stat } from './StackRows';

/** 왼쪽 — 지금 얼마나 내고 있는가 */
export function OutputRail({ data }: { data: ControlRoomData }) {
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const ratio = Math.max(0, Math.min(1, data.totals.outputKw / peak));
  // 도 전체를 더하면 kW 로는 자릿수가 길어 판을 넘는다 — 단위를 한 칸 올린다.
  const output = scaleSi(data.totals.outputKw, 'W');
  const stale = data.collection.stale.length;

  return (
    <aside className={styles.rail} aria-label="현재 총출력과 누적 발전량">
      <section className={styles.glass}>
        <h2 className={styles.glass__title}>현재 총출력</h2>

        <p className={styles.output}>
          <strong>{formatNumber(output.amount, output.fractionDigits)}</strong>
          <span>{output.unit}</span>
        </p>

        {/* 피크 대비 몇 할인지 — 막대 하나면 충분하다 */}
        <div className={styles.bar} role="img" aria-label={`피크 대비 ${Math.round(ratio * 100)}퍼센트`}>
          <span className={styles.bar__fill} style={{ inlineSize: `${(ratio * 100).toFixed(1)}%` }} />
        </div>
        <p className={styles.glass__note}>
          피크 {formatNumber(peak, 0)}kW 대비 {Math.round(ratio * 100)}%
        </p>
      </section>

      <section className={styles.glass}>
        <h2 className={styles.glass__title}>누적 발전량</h2>
        <dl className={styles.stack}>
          <Stat label="금일" kwh={data.totals.todayKwh} />
          <Stat label="금월" kwh={data.totals.monthKwh} />
          <Stat label="금년" kwh={data.totals.yearKwh} />
          <Stat label="전체" kwh={CUMULATIVE.totalKwh} />
        </dl>
      </section>

      <section className={styles.glass}>
        <h2 className={styles.glass__title}>수집</h2>
        <dl className={styles.stack}>
          <Line label="조회 개소" value={`${formatNumber(data.rows.length)}개소`} />
          <Line label="미수신" value={`${formatNumber(stale)}개소`} tone={stale > 0 ? 'caution' : undefined} />
          <Line
            label="품질 미달"
            value={`${formatNumber(data.belowThreshold)}개소`}
            tone={data.belowThreshold > 0 ? 'caution' : undefined}
          />
          <Line label="최근 수집" value={data.collection.latest.slice(11, 16)} />
        </dl>
      </section>
    </aside>
  );
}
