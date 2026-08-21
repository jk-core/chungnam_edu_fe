import { getAccumulatedAt, PEAK_OUTPUT } from '@/mocks/generation';
import { formatNumber, scaleSi } from '@/utils/format';
import { NOW_HOUR } from '@/mocks/today';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../WarRoom.module.scss';

interface LiveStripProps {
  data: ControlRoomData;
}

/**
 * 지금 값 한 줄.
 *
 * 아래 두 켜가 하루를 말하므로 여기는 「이 순간」 만 짧게 짚는다. 값을 칸마다 흩어 놓으면
 * 눈이 네 번 멈추므로, 큰 활자 하나에 딸린 값들을 옆으로 붙여 한 번에 읽히게 두었다.
 */
export function LiveStrip({ data }: LiveStripProps) {
  const output = scaleSi(data.totals.outputKw, 'W');
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const ratio = Math.max(0, Math.min(1, data.totals.outputKw / peak));
  const today = scaleSi(data.totals.todayKwh, 'Wh');
  // 곡선 아래 넓이 가운데 지금까지 지나온 몫 — 오늘 낼 것의 몇 할을 이미 냈는지
  const done = getAccumulatedAt(NOW_HOUR) / Math.max(1, data.totals.todayKwh);
  const stale = data.collection.stale.length;

  return (
    <section className={styles.live} aria-label="현재 총출력과 오늘 실적">
      <p className={styles.live__output}>
        <strong>{formatNumber(output.amount, output.fractionDigits)}</strong>
        <span>{output.unit}</span>
      </p>

      <div className={styles.live__bar} role="img" aria-label={`피크 대비 ${Math.round(ratio * 100)}퍼센트`}>
        <span style={{ inlineSize: `${(ratio * 100).toFixed(1)}%` }} />
      </div>

      <dl className={styles.live__facts}>
        <div>
          <dt>피크 대비</dt>
          <dd>{Math.round(ratio * 100)}%</dd>
        </div>
        <div>
          <dt>금일 발전량</dt>
          <dd>
            {formatNumber(today.amount, today.fractionDigits)}
            <em>{today.unit}</em>
          </dd>
        </div>
        <div>
          <dt>오늘 진행</dt>
          <dd>{Math.round(Math.min(1, done) * 100)}%</dd>
        </div>
        <div>
          <dt>조회 개소</dt>
          <dd>{formatNumber(data.rows.length)}</dd>
        </div>
        <div>
          <dt>미수신</dt>
          <dd data-tone={stale > 0 ? 'caution' : undefined}>{formatNumber(stale)}</dd>
        </div>
        <div>
          <dt>최근 수집</dt>
          <dd>{data.collection.latest.slice(11, 16)}</dd>
        </div>
      </dl>
    </section>
  );
}
