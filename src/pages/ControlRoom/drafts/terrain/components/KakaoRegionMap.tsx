import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CustomOverlayMap, Map as KakaoMap, Polygon } from 'react-kakao-maps-sdk';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { CloseIcon } from '@/components/common/Icon';
import { focusOn, TONE_CLASS } from '@/components/common/GeoMap/kakaoMarkers';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import { OPERATION_LABEL, OPERATION_RANK } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { getRegionOutlines } from '../utils/regionPolygons';
import styles from './KakaoRegionMap.module.scss';
import type { RegionStat } from '../hooks/useTerrainRegions';

interface KakaoRegionMapProps {
  regions: RegionStat[];
  active: RegionStat;
  onSelect: (index: number) => void;
  /** 자리를 옮기지는 않는 손길(발전소 고르기·상세 닫기·전체 보기) — 자동 순회를 붙잡아 둔다 */
  onTouch: () => void;
  center: { lat: number; lng: number };
  /** 카카오 배율 — 숫자가 작을수록 크게 보인다. 도 전체가 한눈에 들어오는 값을 준다 */
  level: number;
}

/**
 * 시·군 하나를 고르면 이 배율로 확대해 들어간다 (고객 요청 2026-09-15, "정해진 확대율").
 *
 * 고객이 "정해진 확대율" 을 말했으므로 고정값 하나로 둔다. 시·군마다 넓이가 달라(공주시가
 * 계룡시의 몇 배다) 한 값으로는 넓은 시·군이 조금 잘리거나 좁은 시·군에 여백이 남지만, 경계
 * 점렬로 bounds 를 잡아 배율을 시·군마다 맞추는 길과 견줘 본 결과 이 값(9)이 열다섯 곳 모두에서
 * 시·군 몸통과 이름표·발전소 점이 판 안에 들어와, 고정값을 택했다. 도 전체는 level 11(props).
 */
const REGION_ZOOM_LEVEL = 9;

/**
 * 발전소 하나를 고르면 들어가는 배율 (고객 요청 2026-09-15).
 *
 * 시·군 배율(9)에서는 학교 하나가 점만 하게 남아, 상세를 펴 놓고도 **그 학교가 어디에 선
 * 건물인지** 가 지도에서 답해지지 않는다. 5 는 학교 건물과 둘레 길이 함께 들어오는 자리다.
 * 3 까지 파고들면 건물 하나가 판을 채워 둘레를 잃고, 7 은 시·군 배율과 거의 구별되지 않는다.
 */
const PLANT_ZOOM_LEVEL = 5;

/**
 * 도 전체 뷰에서 배지를 서로 밀어내는 화면 오프셋(px) (③, 고객 요청 2026-09-15).
 *
 * 겹침은 **도 전체 뷰에서만** 문제다 — 시·군에 확대해 들어가면 배지 사이가 저절로 벌어진다.
 * 그러니 도 전체 뷰를 기준으로만 값을 잡는다. 20px 안팎의 이동은 확대 상태에서도 해가 없어
 * 배율마다 오프셋을 바꾸는 처리는 하지 않는다.
 *
 * 미는 거리는 24px 안쪽으로 묶는다 — 제 무게중심에서 멀어질수록 어느 시·군을 가리키는지 흐려진다.
 * 이 정도면 배지에 이름이 적혀 있어 지시선 없이도 헷갈리지 않는다. y 는 양수가 아래.
 *
 * 값을 통째로 다시 잡았다 (2026-09-15, 배지를 알약에서 상자로 바꾸면서). 알약은 가로로 길고
 * 납작해(149×27) **좌우** 가 부딪혔지만, 두 단으로 쌓은 상자는 폭이 절반에 키가 두 배라
 * (78×47) **위아래** 가 부딪힌다 — 밀어야 할 방향이 뒤집혔다. 그래서 값이 모두 세로가 되었고,
 * 가로로 밀던 값은 하나도 남지 않았다(가로는 이미 상자 폭보다 넉넉히 벌어져 있다).
 *
 * 남은 것은 네 짝이다. 셋(천안-아산·예산-홍성·논산-계룡)은 무게중심이 세로로 6~39px 밖에
 * 떨어지지 않아 47px(상자 키) 넘게 벌어지도록 **두 쪽을 반대로** 민다 — 한쪽만 크게 미는 대신
 * 둘로 나눠 밀어, 어느 배지도 제 무게중심에서 24px 넘게 떠나지 않는다.
 *
 * 서산만 가로로 민다. 아래의 태안과는 63px(폭 78px 에 못 미친다), 위의 당진과는 51px(키 47px
 * 은 넘는다) 떨어져 있어, 서산을 위로 올리면 태안과는 떨어져도 당진과 새로 붙는다 — 위아래가
 * 막힌 자리다. 오른쪽으로 16px 밀면 태안과 79px 로 벌어지고 당진과는 세로 간격이 그대로 남는다.
 */
const BADGE_SHIFT: Record<string, { x?: number; y?: number }> = {
  천안시: { y: -24 },
  아산시: { y: 22 },
  예산군: { y: -10 },
  홍성군: { y: 10 },
  서산시: { x: 16 },
  계룡시: { y: -10 },
  논산시: { y: 6 },
};

/**
 * 발전소 이름표가 앉는 기준점 — 가리키는 자리 바로 위에 선다.
 *
 * 겹침을 재려면 이름표가 화면 어디를 차지하는지 알아야 하는데, 카카오가 놓아 준 자리는
 * 이름표가 접혀 점만 남으면 함께 줄어든다. 기준점 비율을 알고 있으면 접힌 상태의 상자에서도
 * 가리키는 자리를 되짚을 수 있어(rect + 비율), 카카오 내부 좌표계를 건드리지 않고 잰다.
 */
const PLANT_X_ANCHOR = 0.5;
const PLANT_Y_ANCHOR = 1.1;

/** 발전소 이름표끼리 두는 최소 틈(px) — 붙어 서면 두 이름이 한 덩이로 읽힌다 */
const PLANT_LABEL_GAP = 4;

/** 이름표가 점 위·아래 어느 쪽에 서는지 */
type PlantPlace = 'up' | 'down';

/**
 * 아래쪽에 설 때 제 키의 몇 배를 내려가는지.
 * 1.2 면 점 아래로 키의 0.1 만큼 띄운 자리에 선다 — 위에 설 때 띄우는 값과 대칭이다.
 */
const PLANT_DOWN_SHIFT = 1.2;

/** 겹침을 잴 때 쓰는 화면 사각형 — 왼쪽·위·오른쪽·아래 */
interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

function overlaps(a: Box, b: Box) {
  return a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
}

/** 이름표가 두는 최소 틈만큼 사각형을 부풀린다 */
function inflate(rect: DOMRect): Box {
  return {
    l: rect.left - PLANT_LABEL_GAP,
    t: rect.top - PLANT_LABEL_GAP,
    r: rect.right + PLANT_LABEL_GAP,
    b: rect.bottom + PLANT_LABEL_GAP,
  };
}

function samePlaces(a: Map<string, PlantPlace> | null, b: Map<string, PlantPlace>) {
  if (a === null || a.size !== b.size) return false;

  for (const [id, place] of b) if (a.get(id) !== place) return false;

  return true;
}

/**
 * 시·군별 현황을 실제 카카오 지도 위에 세운다 (SFR-004-01) — 고객 요청(2026-09-14).
 *
 * 시·군마다 학교들의 무게중심에 **배지** 를 세워 시·군 단위로 묶어 보인다. 배지는 두 단으로
 * 쌓은 상자다 — 위에 이름, 아래에 개소 수, 왼쪽 가장자리에 개소 수 단계 띠. 누르면 그 시·군이
 * 선택되어 상세가 바뀌고 지도가 그리로 확대해 들어간다.
 *
 * 시·군 경계는 도형 SVG 를 역투영해 지도 위에 얹는다 (`utils/regionPolygons`). 배지만으로는
 * 「어디부터 어디까지가 그 시·군인가」 가 답해지지 않아 고객이 선과 색을 함께 요구했다.
 *
 * 경계를 얹는 일은 `kakao.maps.Polygon` 을 직접 만들지 않고 **SDK 의 `<Polygon>` 컴포넌트**
 * 에 맡긴다. 직접 만들면 지도가 아직 제 크기를 못 받은 사이에 붙어 폭 0 으로 깔리고, 그 뒤
 * `relayout()` 을 불러도 이미 깔린 오버레이는 되살아나지 않는다 — 실제로 그렇게 실패했다.
 * 컴포넌트에 맡기면 지도가 준비된 뒤에 붙고 사라질 때 함께 걷힌다.
 *
 * 확대해 들어가면 그 시·군의 발전소가 **이름표** 로 드러나고, 누르면 시안 A 와 같은
 * `PlantDetailPanel` 이 지도 위에 펼쳐진다 (고객 요청 2026-09-15).
 */
export function KakaoRegionMap({ regions, active, onSelect, onTouch, center, level }: KakaoRegionMapProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  /*
    경계 점렬은 열다섯 경로를 훑어 뽑는 셈이라 시·군을 고를 때마다 다시 하면 지도가 멎는다.
    값이 바뀔 일이 없으므로 한 번만 뽑는다.
  */
  const outlines = useMemo(() => getRegionOutlines(), []);

  /*
    도 전체(열다섯이 다 보이는) 뷰인지, 한 시·군에 확대해 들어가 있는지.

    시작은 도 전체다 — 처음 한 박자는 도 전체를 보여 맥락을 준 뒤 순회가 첫 시·군으로 파고든다.
    `overviewAnchor` 는 전체 뷰로 들어선 순간의 시·군 이름을 적어 둔다. 순회(또는 선택)가 그
    시·군을 벗어나면 전체 뷰를 걷고 다시 확대에 들어간다 — 그래서 「전체 보기」 를 눌러도 그 자리에
    머무는 동안(멈춰 세웠다면 계속) 열다섯을 다시 고를 수 있고, 순회가 넘어가면 저절로 파고든다.
  */
  const [overview, setOverview] = useState(true);
  const overviewAnchor = useRef(active.name);

  /** 사람이 고른 발전소 — 상세가 지도 위에 펼쳐진다 */
  const [openId, setOpenId] = useState<string | null>(null);
  const openPlant = active.schools.find((school) => school.id === openId) ?? null;

  /* 배율을 누가 쥐는지 가르는 값 — 열려 있으면 발전소가, 닫히면 시·군이 쥔다 */
  const plantOpen = openPlant !== null;

  /*
    이름을 드러낼 발전소.

    천안 49개소·아산 55개소를 이름표로 다 세우면 서로 겹쳐 **하나도 읽히지 않는다** —
    「전부 보여준다」 는 요구는 지키되 읽히게 하려면 이름을 줄일 것이 아니라(글자 하한 14px)
    **한 번에 이름이 서는 개수** 를 줄여야 한다 (고객 요청 2026-09-15).

    그래서 발전소는 모두 세우되, 이름표는 화면에서 자리가 나는 만큼만 편다. 자리가 없는
    것은 상태 점으로 접히고 — 여전히 그 자리에 있고 눌러 상세를 볼 수 있다 — 지도를 확대하면
    점 사이가 벌어지면서 접혔던 이름이 차례로 펴진다. 급한 것부터 자리를 가져가도록
    이상 → 용량 순으로 훑는다.
  */
  const [labelPlaces, setLabelPlaces] = useState<Map<string, PlantPlace> | null>(null);
  const plantSizes = useRef(new Map<string, { w: number; h: number }>());

  const plantNodes = useRef(new Map<string, HTMLElement>());
  const badgeNodes = useRef(new Map<string, HTMLElement>());

  /** 이름표 자리다툼의 차례 — 이상이 먼저, 같으면 큰 설비가 먼저 */
  const plantOrder = useMemo(
    () => [...active.schools].sort(
      (a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw,
    ),
    [active.schools],
  );
  /*
    고른 시·군이 바뀌면 자리표를 비워 처음부터 다시 잰다.

    `plantSizes` 는 발전소마다 **펴 놓고 잰** 이름표 폭인데, 새 시·군의 발전소는 아직 한 번도
    펴 본 적이 없어 그 값이 없다. 값이 없으면 자리를 받지 못하고, 자리를 못 받으면 접힌 채로
    남고, 접혀 있는 동안에는 폭을 재지 않으므로 **영영 펴지지 않는다** — 실제로 시·군을 넘길
    때마다 이름표가 통째로 사라졌다.

    비우는 일은 효과가 아니라 **그리는 도중**에 한다. 효과로 미루면 낡은 자리표로 한 번 그린
    뒤에야 비워져 이름표가 한 박자 깜빡인다. 리액트가 파생 상태를 되돌릴 때 권하는 수법이다.
  */
  const [placedFor, setPlacedFor] = useState(plantOrder);

  if (placedFor !== plantOrder) {
    setPlacedFor(plantOrder);
    setLabelPlaces(null);
  }

  /** 도 전체 뷰에서는 이름표를 펴지 않는다 — 시·군 배지 열다섯이 이미 그 자리를 쓰고 있다 */
  const namesOn = !overview;

  /*
    지도가 붙는 순간 칸이 아직 flex 로 자리를 잡기 전이면 카카오가 어긋난 크기로 타일을 깐다.
    칸이 바뀔 때마다(자리바꿈 포함) relayout() 로 다시 재게 하고, 틀어지는 중심을 붙잡았다
    되돌린다 (KakaoMiniMap 이 같은 방식을 쓴다).
  */
  useEffect(() => {
    const frame = frameRef.current;

    if (!map || !frame) return undefined;

    const relayout = () => {
      const heart = map.getCenter();

      map.relayout();
      map.setCenter(heart);
    };

    const observer = new ResizeObserver(relayout);

    observer.observe(frame);

    return () => observer.disconnect();
  }, [map]);

  /*
    순회나 선택이 다른 시·군으로 넘어가면 전체 뷰를 자동으로 걷는다.
    mount 직후 첫 순회 전환도 여기에 걸려, 도 전체를 한 박자 보여 준 뒤 첫 시·군으로 파고든다.
  */
  useEffect(() => {
    if (overview && overviewAnchor.current !== active.name) setOverview(false);
  }, [active.name, overview]);

  /*
    시·군이 바뀌면 앞 시·군의 발전소 상세와 이름표 배치를 함께 걷는다.

    효과가 아니라 렌더 도중에 건다 — 효과로 미루면 새 시·군의 발전소를 앞 시·군의 이름표
    배치로 한 번 그린 뒤 고쳐 그리게 되어, 엉뚱한 자리에 이름이 떴다 사라진다.
  */
  const [drawnRegion, setDrawnRegion] = useState(active.name);

  if (drawnRegion !== active.name) {
    setDrawnRegion(active.name);
    setOpenId(null);
    setLabelPlaces(null);
  }

  /*
    고른 시·군으로 미끄러져 들어가거나(확대), 도 전체로 물러난다 (고객 요청 2026-09-15).

    시·군으로 들어갈 때는 `focusOn` 을 쓴다 — `panTo` 는 도 반대편처럼 먼 거리를 그냥 건너뛰어
    순회가 멀리 넘어갈 때 화면이 툭 바뀐다. `focusOn` 은 자리를 직접 끌어 어느 거리든 고르게
    미끄러지고, 다 온 뒤에 배율을 맞춘다. 되돌려 주는 취소 함수를 정리 때 불러, 다음 이동이
    시작되기 전에 앞 이동을 거둔다 — 두 움직임이 서로를 밀지 않게.

    도 전체로 물러날 때는 **중심을 먼저 옮기고** 배율을 푼다. 순서를 뒤집었던 때는(배율 먼저)
    카카오의 배율 애니메이션이 제가 시작할 때의 중심을 끝에 되돌려 놓아, 「전체 보기」 를 눌러도
    방금 보던 시·군 언저리에 머물고 도 남쪽 다섯이 판 밖에 남았다. 중심을 먼저 박아 두면 배율만
    풀려 열다섯이 한꺼번에 드러난다. 중심 이동을 미끄러뜨리지 않는 것은, 물러나며 이미 도 전체가
    드러나 어디로 가는지 다 보이기 때문이다 — 굳이 끌면 배율 풀림과 엇박이 난다.

    `reduced-motion` 에서는 미끄러짐 없이 곧바로 옮긴다 — 멀미를 줄이려는 설정을 지도가 어기지
    않게 한다.
  */
  useEffect(() => {
    /*
      발전소 상세가 열려 있는 동안에는 이 효과가 쉰다 — 아래 발전소 효과가 배율을 쥔다.
      닫히면 `plantOpen` 이 내려가며 여기가 다시 돌아 **시·군 배율로 저절로 물러난다**.
      다른 발전소로 옮길 때는 `plantOpen` 이 계속 참이라 여기가 돌지 않아, 시·군으로 갔다가
      다시 파고드는 요동이 없다.
    */
    if (!map || plantOpen) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (overview) {
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
      if (reduce) map.setLevel(level);
      else map.setLevel(level, { animate: { duration: 260 } });

      return undefined;
    }

    if (reduce) {
      map.setLevel(REGION_ZOOM_LEVEL);
      map.setCenter(new kakao.maps.LatLng(active.centroid.lat, active.centroid.lng));

      return undefined;
    }

    return focusOn(map, active.centroid, REGION_ZOOM_LEVEL);
  }, [map, overview, active.centroid, active.name, center, level, plantOpen]);

  /*
    발전소 하나를 고르면 그 자리로 한 단 더 파고든다 (고객 요청 2026-09-15).

    시·군으로 들어가는 효과와 따로 두는 것은 되돌아오는 길 때문이다. 위 효과는 상세가 열려
    있는 동안 쉬고 있다가, 닫히는 순간 다시 돌아 시·군 배율로 물러난다 — 한 효과에 묶어 두면
    닫은 뒤에도 학교 하나에 바싹 붙은 채 남는다.

    도 전체를 보고 있을 때는 파고들지 않는다. 그 화면에서 발전소를 누르는 일은 없지만,
    순회가 막 물러나는 참에 상세가 열려 있으면 두 움직임이 서로를 밀기 때문이다.
  */
  useEffect(() => {
    if (!map || !openPlant || overview) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (reduce) {
      map.setLevel(PLANT_ZOOM_LEVEL);
      map.setCenter(new kakao.maps.LatLng(openPlant.location.lat, openPlant.location.lng));

      return undefined;
    }

    return focusOn(map, openPlant.location, PLANT_ZOOM_LEVEL);
  }, [map, openPlant, overview]);

  /**
   * 이름표를 펼 자리를 고른다 — 화면 좌표에서 직접 재는 그리디 배치.
   *
   * 카카오의 투영 API 를 부르지 않고 **놓인 DOM 을 그대로 잰다**. 전역 타입 선언에 투영이
   * 빠져 있어 그것을 쓰려면 이 시안 밖(`src/kakao-maps.d.ts`)을 건드려야 하는데, 재는 데
   * 필요한 것은 결국 화면 사각형뿐이라 굳이 그럴 까닭이 없다. 접힌 이름표는 상자가 작아져
   * 제 폭을 잃으므로, 펴진 동안 잰 크기를 적어 두었다가 다시 쓴다.
   */
  const layoutLabels = useCallback(() => {
    const frame = frameRef.current;

    if (!frame) return;

    const bounds = frame.getBoundingClientRect();
    const taken: Box[] = [];
    const next = new Map<string, PlantPlace>();

    /*
      이름표보다 먼저 자리를 잡은 것들 — 시·군 배지와, 지도 위에 얹힌 손잡이·상세.

      이들은 이름표보다 위층에 있어 밑에 깔린 이름을 통째로 가린다. 「자리가 없어 접혔다」 가
      아니라 「펴 놓고 가려졌다」 가 되면, 접힘 규칙이 화면에서 거짓말을 하는 셈이다.
      배지는 확대·축소에 따라 커지므로 칸이 아니라 **보이는 대로**(transform 이 반영된 rect) 잰다.
    */
    badgeNodes.current.forEach((node) => taken.push(inflate(node.getBoundingClientRect())));
    [styles.deck, styles.detail].forEach((name) => {
      const layer = frame.querySelector(`.${name}`);

      if (layer) taken.push(inflate(layer.getBoundingClientRect()));
    });

    plantOrder.forEach((plant) => {
      const node = plantNodes.current.get(plant.id);
      const seat = node?.parentElement;

      if (!node || !seat) return;

      /*
        자리는 이름표가 아니라 **카카오가 놓아 준 칸**(오버레이가 만든 바깥 div)에서 잰다.
        이름표는 아래쪽에 설 때 `position: relative` 로 제 칸 안에서만 내려가므로 칸은 늘
        가리키는 자리에 붙어 있다 — 이름표를 재면 내려간 만큼이 섞여 기준점이 흐트러진다.
      */
      const rect = seat.getBoundingClientRect();

      // 펴진 상태로 놓여 있을 때만 제 크기다 — 접힌 상자의 폭을 적어 두면 다시는 펴지지 않는다
      if (rect.width > 0 && !node.hasAttribute('data-mini')) {
        plantSizes.current.set(plant.id, { w: rect.width, h: rect.height });
      }

      const size = plantSizes.current.get(plant.id);

      if (!size) return;

      // 접혀 있어도 기준점 비율로 가리키는 자리를 되짚는다
      const x = rect.left + rect.width * PLANT_X_ANCHOR;
      const y = rect.top + rect.height * PLANT_Y_ANCHOR;
      const l = x - size.w * PLANT_X_ANCHOR - PLANT_LABEL_GAP;
      const top = y - size.h * PLANT_Y_ANCHOR - PLANT_LABEL_GAP;
      const boxes: [PlantPlace, Box][] = [
        ['up', { l, t: top, r: l + size.w + PLANT_LABEL_GAP * 2, b: top + size.h + PLANT_LABEL_GAP * 2 }],
        ['down', {
          l,
          t: top + size.h * PLANT_DOWN_SHIFT,
          r: l + size.w + PLANT_LABEL_GAP * 2,
          b: top + size.h * (1 + PLANT_DOWN_SHIFT) + PLANT_LABEL_GAP * 2,
        }],
      ];

      /*
        점 위가 막혔으면 점 아래를 한 번 더 본다 (고객 요청 2026-09-15 — 「전부 보여주고」).

        이름표를 늘 점 위에만 세우면 아산·천안처럼 학교가 시가지에 몰린 곳에서 이름이 한 줄로
        줄을 서다 여덟 개쯤에서 자리가 동난다. 위아래 두 자리를 다 보면 같은 배율에서 드러나는
        이름이 곱절 가까이 는다. 좌우까지 넓히지 않는 것은, 이름표가 가로로 길어(180px 안팎)
        옆으로 밀면 어느 점을 가리키는지 곧바로 흐려지기 때문이다.
      */
      const fit = boxes.find(([, box]) => {
        // 판 밖으로 삐져나갈 이름표는 펴지 않는다 — 반만 보이는 이름은 읽히지도, 자리를 비우지도 않는다
        if (box.l < bounds.left || box.r > bounds.right || box.t < bounds.top || box.b > bounds.bottom) return false;

        return !taken.some((made) => overlaps(made, box));
      });

      if (!fit) return;

      taken.push(fit[1]);
      next.set(plant.id, fit[0]);
    });

    setLabelPlaces((prev) => (samePlaces(prev, next) ? prev : next));
  }, [plantOrder]);

  /*
    처음 한 번은 모두 펴 놓고 잰다 — 그래야 이름표의 제 폭이 잡힌다. 그동안은 보이지 않게
    두어(`data-measuring`) 다 펼쳐진 한 컷이 눈에 걸리지 않게 한다.
  */
  useLayoutEffect(() => {
    if (!namesOn || labelPlaces !== null) return;

    layoutLabels();
  }, [namesOn, labelPlaces, layoutLabels]);

  /* 상세가 열리고 닫힐 때도 다시 고른다 — 그 판이 덮은 자리가 새로 막히거나 비기 때문이다 */
  useEffect(() => {
    if (namesOn) layoutLabels();
  }, [openId, namesOn, layoutLabels]);

  /* 지도가 멎을 때마다(확대·이동이 끝날 때마다) 자리를 다시 고른다 */
  useEffect(() => {
    if (!map || !namesOn) return undefined;

    const onIdle = () => layoutLabels();

    kakao.maps.event.addListener(map, 'idle', onIdle);

    return () => kakao.maps.event.removeListener(map, 'idle', onIdle);
  }, [map, namesOn, layoutLabels]);

  const backToOverview = () => {
    overviewAnchor.current = active.name;
    setOpenId(null);
    setOverview(true);
    onTouch();
  };

  return (
    <div ref={frameRef} className={styles.canvas}>
      <KakaoMap
        center={center}
        level={level}
        className={styles.canvas}
        onCreate={setMap}
        aria-label={`충청남도 시·군별 개소 현황 지도. 지금 ${active.name}`}
      >
        {/*
          시·군 경계.

          평소에는 제 CI 색을 옅게 깔아 이웃과 갈리게만 하고, 고른 곳만 면과 선을 함께 올려
          한눈에 잡히게 한다. 면을 진하게 칠하면 그 아래 지도가 가려져 「실제 지도 위」 라는
          뜻이 없어지므로, 고른 곳도 절반을 넘기지 않는다.

          선은 3px 아래로 내리지 않는다. 2px 에 투명도 0.55 로 두었더니 벽에서 몇 걸음 떨어지면
          선이 통째로 사라져, 경계를 그려 놓고도 「안 그려진 화면」 으로 보였다.

          고른 시·군을 나중에 그려 이웃의 선 위로 올린다 — 먼저 그린 것의 선이 위에 남으면
          고른 곳의 테두리가 이웃에게 잘린 것처럼 보인다.
        */}
        {[...outlines]
          .sort((a, b) => Number(a.name === active.name) - Number(b.name === active.name))
          .map((outline) => {
            const at = outline.name === active.name;

            return (
              <Polygon
                key={outline.name}
                path={outline.path}
                fillColor={REGION_CI_COLOR[outline.name]}
                fillOpacity={at ? 0.5 : 0.2}
                strokeColor={REGION_CI_COLOR[outline.name]}
                strokeWeight={at ? 6 : 3}
                strokeOpacity={at ? 1 : 0.9}
                zIndex={at ? 4 : 2}
              />
            );
          })}

        {/*
          고른 시·군의 발전소.

          확대해 들어가면 이름표로 서고(자리가 나는 만큼), 도 전체 뷰에서는 상태 점으로 접힌다.
          접힌 것도 같은 단추라 눌러 상세를 열 수 있다 — 「전부 보여준다」 는 요구에서 사라지는
          발전소가 없어야 하기 때문이다.
        */}
        {active.schools.map((school) => {
          const place = labelPlaces?.get(school.id);
          /*
            발전소 하나로 파고든 동안에는 겹침 셈을 건너뛰고 **모두 편다** (고객 요청 2026-09-15).

            그 배율(250m 안팎)에서는 화면에 남는 발전소가 몇 되지 않아 서로 부딪힐 일이 드물고,
            자세히 보려고 들어간 자리에서 이름이 점으로 접혀 있으면 들어간 까닭이 사라진다.
            겹침을 줄이려 접는 것은 도 전체·시·군 배율에서나 몫을 하는 일이다.
          */
          const named = namesOn && (plantOpen || labelPlaces === null || place !== undefined);

          return (
            <CustomOverlayMap
              key={school.id}
              position={school.location}
              xAnchor={PLANT_X_ANCHOR}
              yAnchor={PLANT_Y_ANCHOR}
              zIndex={school.id === openId ? 9 : 6}
              clickable
            >
              <button
                type="button"
                ref={(node) => {
                  if (node) plantNodes.current.set(school.id, node);
                  else plantNodes.current.delete(school.id);
                }}
                className={`${styles.plant} ${styles[`plant--${TONE_CLASS[school.status]}`]}`}
                data-mini={named ? undefined : ''}
                data-place={place === 'down' ? 'down' : undefined}
                data-measuring={namesOn && labelPlaces === null ? '' : undefined}
                data-open={school.id === openId ? '' : undefined}
                onClick={() => {
                  setOpenId(school.id);
                  onTouch();
                }}
                aria-label={`${school.name}, ${OPERATION_LABEL[school.status]}`}
              >
                {/* 접혔을 때만 서는 상태 점 — 이름과 상태 글이 숨으면 이것만 남는다 */}
                <span className={styles.plant__pip} aria-hidden />
                <span className={styles.plant__name}>{school.name}</span>
                <span className={styles.plant__state}>{OPERATION_LABEL[school.status]}</span>
              </button>
            </CustomOverlayMap>
          );
        })}

        {/* 시·군 배지 — 모든 시·군에 늘 세워 두고, 고른 곳만 도드라지게 */}
        {regions.map((region, index) => {
          const at = region.name === active.name;
          const shift = BADGE_SHIFT[region.name];

          return (
            <CustomOverlayMap key={region.name} position={region.centroid} yAnchor={1.15} zIndex={at ? 20 : 10} clickable>
              <button
                type="button"
                ref={(node) => {
                  if (node) badgeNodes.current.set(region.name, node);
                  else badgeNodes.current.delete(region.name);
                }}
                className={styles.badge}
                data-on={at ? '' : undefined}
                /* 도 전체 뷰에서 이웃과 겹치지 않도록 화면에서 조금 밀어 둔 값 — scale 앞에 translate 로
                   걸리므로(중첩 SCSS) 고른 배지가 1.16 배로 커져도 민 거리가 배율의 영향을 받지 않는다 */
                /* 그 시·군의 CI 색 — 지도 면을 칠하는 색과 같아 배지와 면이 한 곳을 가리킨다 */
                style={{
                  '--region-tone': REGION_CI_COLOR[region.name],
                  ...(shift ? { '--badge-shift-x': `${shift.x ?? 0}px`, '--badge-shift-y': `${shift.y ?? 0}px` } : {}),
                } as CSSProperties}
                /* 누르면 그 시·군을 고르고(순회 자리를 옮기고) 곧바로 확대해 들어간다 */
                onClick={() => { onSelect(index); setOverview(false); }}
                aria-current={at ? 'true' : undefined}
                aria-label={`${region.name} ${formatNumber(region.count)}개소${region.abnormal > 0 ? `, 이상 ${region.abnormal}` : ''}`}
              >
                {/* 윗단 — 그 시·군 색 점과 이름 */}
                <span className={styles.badge__head}>
                  <span className={styles.badge__tone} aria-hidden />
                  <span className={styles.badge__name}>{region.name}</span>
                </span>

                {/* 아랫단 — 개소 수, 그 옆에 이상 수 */}
                <span className={styles.badge__foot}>
                  <span className={styles.badge__count}>
                    {formatNumber(region.count)}
                    <span className={styles.badge__unit}>개소</span>
                  </span>
                  {region.abnormal > 0
                    ? <span className={styles.badge__alert}>이상 {formatNumber(region.abnormal)}</span>
                    : null}
                </span>
              </button>
            </CustomOverlayMap>
          );
        })}
      </KakaoMap>

      <div className={styles.deck}>
        {/*
          도 전체로 돌아가는 손잡이 (고객 요청 2026-09-15).

          한 시·군에 확대해 들어가면 나머지 열넷이 판 밖으로 나가 다시 고를 수 없다. 벽에 걸어 두는
          화면이라 늘 되돌아갈 길이 있어야 한다. 도 전체 뷰에서는 열다섯이 다 보여 이 손잡이가 필요
          없으므로 확대해 들어갔을 때만 세운다.
        */}
        {!overview ? (
          <button type="button" className={styles.overview} onClick={backToOverview}>
            전체 보기
          </button>
        ) : null}

      </div>

      {/*
        고른 발전소 상세 — 시안 A 의 `PlantDetailPanel` 을 그대로 쓴다 (고객 요청 2026-09-15).

        지도 **위에 겹쳐** 편다. 오른쪽 판을 발전소 상세로 갈아 끼우는 길도 있었지만, 그러면
        지금 보고 있는 시·군의 수치가 통째로 사라져 「이 학교가 그 시·군에서 어떤 자리인가」 가
        끊긴다 — 시안 A 의 `FaultMap` 도 같은 까닭으로 지도 옆에 겹쳐 편다. 겹치는 자리는
        지도의 오른쪽 끝이라 시·군 몸통(가운데)을 가리지 않는다.
      */}
      {openPlant ? (
        <aside className={styles.detail} aria-label={`${openPlant.name} 상세`}>
          <button
            type="button"
            className={styles.detail__close}
            onClick={() => {
              setOpenId(null);
              onTouch();
            }}
            aria-label="발전소 상세 닫기"
          >
            <CloseIcon width={17} height={17} />
          </button>

          <div className={styles.detail__scroll}>
            <PlantDetailPanel plant={openPlant} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
