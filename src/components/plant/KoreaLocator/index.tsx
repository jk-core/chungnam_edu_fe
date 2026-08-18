import Chungcheongbukdo from '@/assets/geo/provinces/Chungcheongbukdo';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import Gangwondo from '@/assets/geo/provinces/Gangwondo';
import Gyeonggido from '@/assets/geo/provinces/Gyeonggido';
import Gyeongsangbukdo from '@/assets/geo/provinces/Gyeongsangbukdo';
import Gyeongsangnamdo from '@/assets/geo/provinces/Gyeongsangnamdo';
import Jejudo from '@/assets/geo/provinces/Jejudo';
import Junrabukdo from '@/assets/geo/provinces/Junrabukdo';
import Junranamdo from '@/assets/geo/provinces/Junranamdo';
import styles from './KoreaLocator.module.scss';

/** 충남을 뺀 나머지 — 배경으로 물러난다 */
const OTHERS = [
  Gyeonggido,
  Gangwondo,
  Chungcheongbukdo,
  Junrabukdo,
  Junranamdo,
  Gyeongsangbukdo,
  Gyeongsangnamdo,
  Jejudo,
];

interface KoreaLocatorProps {
  /** 화면 밖으로 읽어 줄 설명 */
  label: string;
}

/**
 * 한반도 안에서 충남이 어디인지 (SFR-004-11).
 *
 * 조회 대상 패널 맨 위의 미니 지도다. 충남만 그려 두었을 때는 그 도형이 어디의 무엇인지
 * 아는 사람에게만 지도였다 — 전국을 깔고 충남만 밝히면 처음 보는 사람도 자리를 안다.
 *
 * 점은 찍지 않는다. 좁은 컬럼에서 128개를 찍으면 뭉쳐서 위치를 말해 주지 못하고, 고르는 일은
 * 눌러서 펼치는 큰 지도가 맡는다. 여기는 "여기가 충남이다" 한 가지만 답한다.
 */
export function KoreaLocator({ label }: KoreaLocatorProps) {
  return (
    <svg className={styles.locator} viewBox="108 18 306 466" role="img" aria-label={label}>
      {OTHERS.map((Province, index) => (
        <Province key={index} fill="var(--surface-sunken)" stroke="var(--border-subtle)" />
      ))}

      {/* 지금 보고 있는 도 — 하나만 밝혀 두면 눈이 거기서 멎는다 */}
      <g className={styles.locator__here}>
        <Chungcheongnamdo fill="var(--brand)" stroke="var(--surface)" />
      </g>
    </svg>
  );
}
