import { cn } from '@/utils/cn';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { KinderFlow, KinderSchool, KinderSun } from './KinderArt';
import styles from './KinderJourney.module.scss';

/**
 * 햇빛이 전기가 되어 교실에 닿기까지 — 한 장의 그림 (SFR-005-01/02/06/07).
 *
 * 시안 둘이 나눠 쓴다. 현행 시안은 걸음을 하나씩 올려 그림을 **쌓아 가고**, 시안 D 는 마지막
 * 걸음을 넘겨 처음부터 **다 켜진 채로** 세운다. 같은 그림이라야 두 시안을 나란히 놓고 골랐을 때
 * 무엇이 다른지가 「보여 주는 방식」 하나로 좁혀진다.
 *
 * 그림이 사라지지 않고 쌓이는 것이 특히 중요하다. 유치원 나이는 앞 장면을 기억해 이어 붙이는 일을
 * 아직 잘 못한다 — 해님이 화면에 남아 있어야 「해님 덕분에」 가 성립하고, 마지막에는 해부터
 * 교실까지가 한 장에 모두 남아 이야기 전체가 그림 한 장이 된다.
 */
export function KinderJourney({ step, nowHour, label }: { step: number; nowHour: number; label: string }) {
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;
  const shown = (at: number) => cn(styles.item, { [styles['item--on']]: step >= at });

  return (
    <svg viewBox="0 0 900 400" fill="none" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      {/*
        무대 — 땅과 학교.

        이야기의 걸음이 아니라 걸음이 벌어지는 자리라, 처음부터 끝까지 서 있다. 첫 장면에
        해님 하나만 띄웠더니 화면 넉 자리 가운데 셋이 빈 하늘로 남아, 멀리서는 무엇을 보여 주려는
        화면인지 알 수 없었다. 다만 창은 아직 어둡다 — 마지막 걸음에 불이 들어오는 것이 이 이야기의 끝이다.
      */}
      <path d="M0 356h900" stroke="var(--brand-contrast)" strokeWidth="6" strokeLinecap="round" />
      <KinderSchool x={528} y={204} w={324} h={152} lit={step >= 3} />

      <g className={shown(0)}>
        <KinderSun cx={172} cy={144} r={78} asleep={!isDay} />
      </g>

      {/* 해에서 지붕으로 내려오는 햇빛. 알갱이가 실제로 굴러가야 「받는다」 가 보인다 */}
      <g className={shown(1)}>
        <KinderFlow d="M282 200 C 378 214 462 182 546 152" color="var(--solar)" dots={4} />
      </g>

      {/*
        전선은 건물 바깥으로 돌린다.
        옥상에서 곧장 출발시켰더니 선이 벽을 뚫고 창문 위를 지나가 집 앞에 그은 낙서처럼 보였다.
        실제 배선도 옥상 끝에서 벽을 타고 내려오므로, 왼쪽 모서리에서 시작해 창 아래로 들어간다.
      */}
      <g className={shown(2)}>
        <KinderFlow d="M507 180 L 470 180 L 470 340 L 560 340" color="var(--ok)" dots={3} />
      </g>

      {/* 켜진 교실에서 퍼지는 빛 — 창이 밝아지는 것만으로는 멀리서 표가 나지 않는다 */}
      <g className={shown(3)}>
        <circle className={styles.burst} cx="690" cy="280" r="148" fill="var(--solar)" fillOpacity="0.18" />
      </g>
    </svg>
  );
}
