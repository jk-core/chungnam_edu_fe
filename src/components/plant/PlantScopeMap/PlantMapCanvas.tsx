import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { MAP_FIT, MAP_VIEW, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { cn } from '@/utils/cn';
import type { School } from '@/interface/energy';
import styles from './PlantScopeMap.module.scss';

/*
  같은 자리에 겹친 점을 흩어 놓는다.

  학교가 이웃해 있으면 도 단위 지도에서 점이 1px 차이로 포개진다. 그대로 두면 위에 놓인
  점이 아래 점의 과녁까지 덮어, 아래 학교는 눌러도 영영 고를 수 없다.
  지도의 쓰임이 "대략 어느 쯤"이라 몇 px 옮기는 편이 못 고르는 것보다 낫다.

  격자로 나누면 칸 경계에 놓인 두 점이 서로 다른 칸에 들어가 그냥 붙어 버린다.
  그래서 이미 놓은 점들과의 실제 거리를 재서, 가까우면 빈자리를 찾을 때까지 밀어낸다.
  발전소가 128개라 제곱으로 세어도 눈에 띄지 않는다.
*/

/** 점끼리 두어야 할 최소 간격(화면 px) */
const MIN_GAP = 11;

/** 황금각 — 몇 개가 몰려도 고르게 퍼진다 */
const GOLDEN_ANGLE = 2.399;

/** 빈자리를 찾아 밀어내 볼 횟수 */
const MAX_NUDGE = 12;

interface Placed {
  school: School;
  x: number;
  y: number;
}

function spread(plants: School[]): Placed[] {
  const gap = MIN_GAP / MAP_FIT.scale;
  const placed: Placed[] = [];

  plants.forEach((school) => {
    const origin = projectPoint(school.location);
    let { x, y } = origin;

    for (let nudge = 1; nudge <= MAX_NUDGE; nudge += 1) {
      const clash = placed.some((other) => Math.hypot(other.x - x, other.y - y) < gap);

      if (!clash) break;

      const angle = nudge * GOLDEN_ANGLE;
      // 한 바퀴 돌 때마다 조금씩 넓혀 나간다 — 여럿이 몰려도 결국 빈자리를 찾는다.
      const radius = gap * (1.15 + (nudge - 1) * 0.22);

      x = origin.x + Math.cos(angle) * radius;
      y = origin.y + Math.sin(angle) * radius;
    }

    placed.push({ school, x, y });
  });

  return placed;
}

interface PlantMapCanvasProps {
  plants: School[];
  /** 지금 고른 발전소 — 크게 키우고 테를 둘러 어디인지 짚어 준다 */
  selectedId?: string;
  /**
   * 점을 눌러 고를 수 있는지.
   * 미리보기는 읽기 전용이라 손가락 커서와 눌림 반응을 주지 않는다.
   */
  onPick?: (plantId: string) => void;
  className?: string;
  label: string;
}

/**
 * 충청남도 경계 위에 발전소를 찍는 지도 (SFR-004-11).
 * 사이드바 미리보기와 전체 지도 모달이 같은 그림을 나눠 쓴다 — 두 곳의 점 자리가
 * 어긋나면 작은 지도에서 눈에 익힌 자리를 큰 지도에서 다시 찾아야 한다.
 */
export function PlantMapCanvas({ plants, selectedId, onPick, className, label }: PlantMapCanvasProps) {
  // 확대하지 않으므로 점 크기는 지도 축척만 되돌려 맞춘다.
  const scale = 1 / MAP_FIT.scale;
  const placed = spread(plants);

  return (
    <svg
      className={cn(styles.canvas, className)}
      viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
      /*
        고를 수 있는 지도는 점 하나하나가 조작 대상이라 그림이 아니라 묶음이다.
        `img` 로 두면 보조기술이 안쪽을 통째로 감춰 점에 이름을 붙여도 읽히지 않는다.
      */
      role={onPick ? 'group' : 'img'}
      aria-label={label}
    >
      <g transform={`translate(${MAP_FIT.x} ${MAP_FIT.y}) scale(${MAP_FIT.scale})`}>
        {/*
          면 색은 한 단계 진한 쪽을 쓴다 — 가장 옅은 색은 미리보기 바탕과 거의 같아
          도 모양이 묻히고, 점만 흩어져 있어 무슨 지도인지 읽히지 않는다.
        */}
        <Chungcheongnamdo fill="var(--map-scale-2)" stroke="none" />

        {placed.map(({ school, x, y }) => {
          const isSelected = selectedId === school.id;

          return (
            <g
              key={school.id}
              transform={`translate(${x} ${y}) scale(${scale})`}
              className={cn({ [styles.pin]: Boolean(onPick) })}
              // 점을 탭 순서에 넣지는 않는다 — 128번을 지나야 다음 칸에 닿는다.
              role={onPick ? 'button' : undefined}
              aria-label={onPick ? `${school.name} 조회 대상으로 고르기` : undefined}
              onClick={onPick ? () => onPick(school.id) : undefined}
            >
              {isSelected ? <circle className={styles.pin__halo} r={11} /> : null}
              {/* 점이 작아 겨냥하기 어렵다 — 보이지 않는 넓은 과녁을 겹쳐 둔다 */}
              {onPick ? <circle className={styles.pin__target} r={MIN_GAP / 2 - 1} /> : null}
              <circle
                className={cn(styles.pin__dot, styles[`pin__dot--${OPERATION_TONE[school.status]}`], {
                  [styles['pin__dot--selected']]: isSelected,
                })}
                r={isSelected ? 6 : 3.6}
              >
                <title>{`${school.name} · ${OPERATION_LABEL[school.status]}`}</title>
              </circle>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
