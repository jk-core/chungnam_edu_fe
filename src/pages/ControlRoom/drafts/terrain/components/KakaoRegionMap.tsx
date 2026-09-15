import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { CustomOverlayMap, Map, Polygon } from 'react-kakao-maps-sdk';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { focusOn, TONE_CLASS } from '@/components/common/GeoMap/kakaoMarkers';
import { OPERATION_LABEL } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { getRegionOutlines } from '../utils/regionPolygons';
import styles from './KakaoRegionMap.module.scss';
import type { RegionStat } from '../hooks/useTerrainRegions';

interface KakaoRegionMapProps {
  regions: RegionStat[];
  active: RegionStat;
  onSelect: (index: number) => void;
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
 * 도 전체 뷰에서 배지를 서로 밀어내는 화면 오프셋(px) (③, 고객 요청 2026-09-15).
 *
 * 담는 것을 줄이고(이상 표기를 점으로) 한 단 줄여도(0.92) 북부 무게중심들은 서로 너무 가까워
 * 겹침이 남는다. 겹침은 **도 전체 뷰에서만** 문제다 — 시·군에 확대해 들어가면 배지 사이가 저절로
 * 벌어진다. 그러니 도 전체 뷰를 기준으로만 값을 잡는다. 20px 안팎의 이동은 확대 상태에서도 해가
 * 없어 배율마다 오프셋을 바꾸는 처리는 하지 않는다.
 *
 * 미는 거리는 24px 안쪽으로 묶는다 — 제 무게중심에서 멀어질수록 어느 시·군을 가리키는지 흐려진다.
 * 이 정도면 배지에 이름이 적혀 있어 지시선 없이도 헷갈리지 않는다. y 는 양수가 아래.
 *
 * 북부 오른쪽은 당진-천안-아산-예산이 세로로 바싹 붙는데, 그중 천안-아산 틈이 가장 좁다(13px).
 * 천안을 올리고 아산을 내려 틈을 벌리되, 천안만 올리면 위의 당진과 새로 부딪히므로 당진도 같이
 * 올려 둘 사이 틈을 지킨다. 청양-공주, 부여-계룡도 같은 식으로 아래위로 조금씩 벌린다.
 * 논산-금산(28×2)은 스치는 정도라 두지 않는다 — 억지로 밀면 이웃과 새로 부딪힌다.
 */
const BADGE_SHIFT: Record<string, { x?: number; y?: number }> = {
  당진시: { y: -10 },
  천안시: { y: -12 },
  아산시: { y: 12 },
  공주시: { y: -14 },
  청양군: { y: 8 },
  계룡시: { y: -18 },
};

/**
 * 시·군별 현황을 실제 카카오 지도 위에 세운다 (SFR-004-01) — 고객 요청(2026-09-14).
 *
 * 시·군마다 학교들의 무게중심에 **배지** 를 세워 시·군 단위로 묶어 보인다. 배지에 이름·개소·
 * 이상 여부가 들어가고, 안쪽 색점이 개소 수 단계(제 CI 계열 단계색)를 이어 이웃과 갈린다.
 * 누르면 그 시·군이 선택되어 상세가 바뀐다.
 *
 * 시·군 경계는 도형 SVG 를 역투영해 지도 위에 얹는다 (`utils/regionPolygons`). 배지만으로는
 * 「어디부터 어디까지가 그 시·군인가」 가 답해지지 않아 고객이 선과 색을 함께 요구했다.
 *
 * 경계를 얹는 일은 `kakao.maps.Polygon` 을 직접 만들지 않고 **SDK 의 `<Polygon>` 컴포넌트**
 * 에 맡긴다. 직접 만들면 지도가 아직 제 크기를 못 받은 사이에 붙어 폭 0 으로 깔리고, 그 뒤
 * `relayout()` 을 불러도 이미 깔린 오버레이는 되살아나지 않는다 — 실제로 그렇게 실패했다.
 * 컴포넌트에 맡기면 지도가 준비된 뒤에 붙고 사라질 때 함께 걷힌다.
 *
 * 발전소 낱개는 고른 시·군의 것만 점으로 찍는다 — 도 전체 300여 개를 다 찍으면 배지가 점에
 * 묻히고 지금 보는 시·군이 어디까지인지도 흐려진다. 지도는 도 전체가 들어오는 자리에 고정한다.
 */
export function KakaoRegionMap({ regions, active, onSelect, center, level }: KakaoRegionMapProps) {
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
    고른 시·군으로 미끄러져 들어가거나(확대), 도 전체로 물러난다 (고객 요청 2026-09-15).

    시·군으로 들어갈 때는 `focusOn` 을 쓴다 — `panTo` 는 도 반대편처럼 먼 거리를 그냥 건너뛰어
    순회가 멀리 넘어갈 때 화면이 툭 바뀐다. `focusOn` 은 자리를 직접 끌어 어느 거리든 고르게
    미끄러지고, 다 온 뒤에 배율을 맞춘다. 되돌려 주는 취소 함수를 정리 때 불러, 다음 이동이
    시작되기 전에 앞 이동을 거둔다 — 두 움직임이 서로를 밀지 않게.

    도 전체로 물러날 때는 배율을 먼저 풀어(setLevel) 열다섯을 한꺼번에 드러낸 뒤 중심을 옮긴다.
    이때 중심 이동을 미끄러뜨리지 않는 것은, 물러나며 이미 도 전체가 드러나 어디로 가는지 다
    보이기 때문이다 — 굳이 끌면 배율 풀림과 엇박이 난다.

    `reduced-motion` 에서는 미끄러짐 없이 곧바로 옮긴다 — 멀미를 줄이려는 설정을 지도가 어기지
    않게 한다.
  */
  useEffect(() => {
    if (!map) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (overview) {
      if (reduce) map.setLevel(level);
      else map.setLevel(level, { animate: { duration: 260 } });
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));

      return undefined;
    }

    if (reduce) {
      map.setLevel(REGION_ZOOM_LEVEL);
      map.setCenter(new kakao.maps.LatLng(active.centroid.lat, active.centroid.lng));

      return undefined;
    }

    return focusOn(map, active.centroid, REGION_ZOOM_LEVEL);
  }, [map, overview, active.centroid, active.name, center, level]);

  const backToOverview = () => {
    overviewAnchor.current = active.name;
    setOverview(true);
  };

  return (
    <div ref={frameRef} className={styles.canvas}>
      <Map
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

        {/* 고른 시·군의 발전소만 점으로 — 지금 보는 시·군이 어디까지인지 점의 무리로 드러난다 */}
        {active.schools.map((school) => (
          <CustomOverlayMap key={school.id} position={school.location} zIndex={6}>
            <span
              className={`${styles.dot} ${styles[`dot--${TONE_CLASS[school.status]}`]}`}
              title={`${school.name} · ${OPERATION_LABEL[school.status]}`}
            />
          </CustomOverlayMap>
        ))}

        {/* 시·군 배지 — 모든 시·군에 늘 세워 두고, 고른 곳만 도드라지게 */}
        {regions.map((region, index) => {
          const at = region.name === active.name;
          const shift = BADGE_SHIFT[region.name];

          return (
            <CustomOverlayMap key={region.name} position={region.centroid} yAnchor={1.15} zIndex={at ? 20 : 10} clickable>
              <button
                type="button"
                className={styles.badge}
                data-on={at ? '' : undefined}
                /* 도 전체 뷰에서 이웃과 겹치지 않도록 화면에서 조금 밀어 둔 값 — scale 앞에 translate 로
                   걸리므로(중첩 SCSS) 고른 배지가 1.16 배로 커져도 민 거리가 배율의 영향을 받지 않는다 */
                style={shift ? ({ '--badge-shift-x': `${shift.x ?? 0}px`, '--badge-shift-y': `${shift.y ?? 0}px` } as CSSProperties) : undefined}
                /* 누르면 그 시·군을 고르고(순회 자리를 옮기고) 곧바로 확대해 들어간다 */
                onClick={() => { onSelect(index); setOverview(false); }}
                aria-current={at ? 'true' : undefined}
                aria-label={`${region.name} ${formatNumber(region.count)}개소${region.abnormal > 0 ? `, 이상 ${region.abnormal}` : ''}`}
              >
                {/* 개소 수 단계는 안쪽 색점이 쥔다 — 테두리는 어느 타일 위에서도 읽히도록 고대비 한 색으로 둔다 */}
                <span className={styles.badge__pip} data-scale={region.scale} aria-hidden />
                <span className={styles.badge__name}>{region.name}</span>
                <span className={styles.badge__count}>{formatNumber(region.count)}<span>개소</span></span>
                {/*
                  이상 표기의 폭이 겹침의 직접 원인이라, 고르지 않은 배지에서는 「이상 N」 텍스트
                  칸을 지우고 작은 점 하나만 남겨 폭을 좁힌다 (고객 요청 2026-09-15). 구체 수치는
                  어차피 오른쪽 상세가 말하므로, 표식은 「여기 이상이 있다」 는 사실만 전한다.
                  고른 배지는 그대로 「이상 N」 을 다 보여 준다 — 위로 올라와 자리가 넉넉하다.
                  스크린리더용 개소·이상 수는 상위 button 의 aria-label 이 이미 쥐고 있어, 시각
                  표식은 aria-hidden 으로 둔다.
                */}
                {region.abnormal > 0
                  ? at
                    ? <span className={styles.badge__alert}>이상 {formatNumber(region.abnormal)}</span>
                    : <span className={styles.badge__flag} aria-hidden />
                  : null}
              </button>
            </CustomOverlayMap>
          );
        })}
      </Map>

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
  );
}
