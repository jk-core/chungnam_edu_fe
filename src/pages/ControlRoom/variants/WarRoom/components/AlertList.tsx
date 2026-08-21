import { formatNumber } from '@/utils/format';
import { toneOfAlert } from '@/pages/ControlRoom/useControlRoomData';
import type { AlertRecord } from '@/interface/alert';
import styles from '../WarRoom.module.scss';

/** 띠에 세우는 건수 — 더 담으면 글자가 작아져 멀리서 못 읽는다 */
const SHOWN = 6;

interface AlertListProps {
  alerts: AlertRecord[];
  /** 골라 둔 시·군. 없으면 전체 */
  picked: string | null;
}

/**
 * 미조치 경보 (SFR-004-06/14).
 *
 * 위 두 켜가 「언제·어디가」 까지 좁혀 주므로, 여기는 「그래서 무엇을」 만 답하면 된다.
 * 위에서 시·군을 고르면 이 줄이 그 지역으로 좁혀진다 — 히트맵의 어두운 줄을 보고 이름을 누르면
 * 바로 그 지역에서 열려 있는 건이 뜬다.
 */
export function AlertList({ alerts, picked }: AlertListProps) {
  const rows = picked ? alerts.filter((alert) => alert.regionName === picked) : alerts;
  const shown = rows.slice(0, SHOWN);
  const rest = rows.length - shown.length;

  return (
    <section className={styles.alerts} aria-label="미조치 경보">
      <header className={styles.alerts__head}>
        <h2 className={styles.alerts__title}>미조치 경보</h2>
        <em className={styles.alerts__count} data-empty={rows.length === 0 ? '' : undefined}>
          {formatNumber(rows.length)}
        </em>
        {picked ? <span className={styles.alerts__scope}>{picked}</span> : null}
      </header>

      {rows.length === 0 ? (
        <p className={styles.alerts__calm}>{picked ? `${picked}에 열려 있는 경보가 없습니다.` : '열려 있는 경보가 없습니다.'}</p>
      ) : (
        <ul className={styles.alerts__list}>
          {shown.map((alert) => (
            <li key={alert.id} className={styles.alert} data-tone={toneOfAlert(alert)}>
              <span className={styles.alert__time}>{alert.occurredAt.slice(11, 16)}</span>
              <span className={styles.alert__name}>{alert.schoolName}</span>
              <span className={styles.alert__title}>{alert.title}</span>
              <span className={styles.alert__region}>{alert.regionName}</span>
            </li>
          ))}
          {rest > 0 ? <li className={styles.alert__rest}>{`외 ${formatNumber(rest)}건`}</li> : null}
        </ul>
      )}
    </section>
  );
}
