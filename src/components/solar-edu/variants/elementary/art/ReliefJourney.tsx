import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { SceneDefs } from '@/components/solar-edu/scene-art/SceneDefs';
import { ReliefFlow, ReliefSchool, ReliefSun } from './ReliefArt';
import styles from './ReliefJourney.module.scss';

/**
 * 햇빛이 전기가 되어 교실에 닿기까지 — 입체 한 장 (SFR-005-01/02/06/07).
 *
 * 같은 물건을 평면으로 그리는 `PictureArt` 와 뷰박스·좌표를 맞춰 두었다. 해도 학교도 길도 자리가
 * 같고, 달라진 것은 그 물건들이 면을 갈라 두께를 얻었다는 것뿐이다 — 시안 b 와 c 를 나란히 놓고
 * 골라야 하므로 차이가 「입체감 하나」로 좁혀져 있어야 한다.
 *
 * 걸음을 나누지 않는다. 이 그림을 쓰는 판은 처음부터 다 켜 두는 쪽이라, 걸음별 등장 장치를
 * 여기까지 끌고 오면 쓰이지 않는 길이 생긴다.
 */
export function ReliefJourney({ nowHour, label }: { nowHour: number; label: string }) {
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;

  return (
    <svg viewBox="0 0 900 400" fill="none" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <SceneDefs />

      {/* 땅 — 그림들이 놓일 바닥 */}
      <path d="M0 356h900" stroke="var(--brand-contrast)" strokeWidth="6" strokeLinecap="round" />

      <ReliefSchool x={528} y={204} w={324} h={152} lit />
      <ReliefSun cx={172} cy={144} r={78} asleep={!isDay} />

      {/*
        해에서 지붕으로 내려오는 햇빛.

        평면 쪽보다 조금 낮게 내려앉는다. 이 건물은 옥상 난간이 아니라 슬래브를 이고 있어 판이
        더 낮게 놓이는데, 같은 높이로 그으면 빛이 판에 닿지 못하고 그 위 허공에서 끊긴다.
      */}
      <ReliefFlow d="M282 200 C 378 214 466 192 554 176" color="var(--solar)" dots={4} />

      {/*
        옥상 끝에서 벽을 타고 창 아래로 들어가는 전기.

        빛줄기를 판까지 내리고 나니 둘이 슬래브 왼쪽 위에서 엇갈렸다 — 주황과 초록이 교차하면
        어느 쪽이 들어오는 것이고 어느 쪽이 나가는 것인지 한눈에 갈리지 않는다.
        전선을 슬래브 아래 벽 높이에서 출발시켜 두 길이 만나지 않게 했다.
      */}
      <ReliefFlow d="M521 214 L 470 214 L 470 340 L 560 340" color="var(--ok)" dots={3} />

      {/*
        켜진 교실에서 퍼지는 빛.
        평면 쪽보다 옅게 둔다 — 이쪽 건물은 면마다 명암이 얹혀 있어, 같은 농도로 덮으면
        그 명암이 노란 기운에 묻혀 애써 만든 두께가 사라진다.
      */}
      <circle className={styles.burst} cx="690" cy="280" r="148" fill="var(--solar)" fillOpacity="0.11" />
    </svg>
  );
}
