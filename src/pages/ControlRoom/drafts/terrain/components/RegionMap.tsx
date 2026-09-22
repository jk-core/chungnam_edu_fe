import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Panel } from '@/pages/ControlRoom/components/Panel';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import { useTerrainRegions } from '../hooks/useTerrainRegions';
import { ExpandButton } from './ExpandButton';
import { KakaoRegionMap } from './KakaoRegionMap';
import { SvgRegionShapes } from './SvgRegionShapes';
import styles from './RegionMap.module.scss';
import type { MapView } from './TerrainBoard';
import type { TourState } from '../hooks/useTerrainTour';
import type { CSSProperties } from 'react';

/** 단계색 다섯 단 — 범례가 이 순서로 늘어선다 */
const SCALES = [1, 2, 3, 4, 5] as const;

/**
 * 순회가 지금 어떤 상태인지 한 마디로 (고객 요청 2026-09-15).
 *
 * 규칙이 셋으로 늘면서(자동 20초 / 직접 고름 / 사람이 멈춤) 아이콘 하나로는 말이 모자란다 —
 * 붙잡힌 동안에도 「멈춤」 아이콘이 서 있어, 화면이 선 까닭이 사람이 세운 것인지 방금 누른
 * 것인지 구별되지 않는다. 손잡이 옆에 한 마디를 붙여 무엇이 돌고 무엇이 서 있는지 밝힌다.
 *
 * 「60초 뒤 자동」 이라고 적던 것은 손잡이 테두리를 도는 게이지에 넘겼다 (고객 요청 2026-09-15)
 * — 남은 시간은 글자로 세는 것보다 차오르는 길이로 보는 편이 빠르고, 그 자리에 매초 바뀌는
 * 숫자를 두면 벽 화면에서 눈이 그리로 끌린다.
 */
const TOUR_STATE_LABEL: Record<TourState, string> = {
  running: '자동 순회',
  held: '직접 선택',
  stopped: '순회 정지',
};

/**
 * 지도 보기 고르개 — A 시안의 MapPanel 과 같은 말을 쓴다(「시·군」=도형, 「지도」=실지도).
 * 「SVG」 같은 기술 용어는 이 화면을 보는 사람에게 뜻이 닿지 않아 쓰지 않는다.
 */
const VIEW_OPTIONS: { value: MapView; label: string }[] = [
  { value: 'kakao', label: '지도' },
  { value: 'shape', label: '시·군' },
];

interface RegionMapProps {
  plants: School[];
  /** 큰 자리인지 작은 자리인지 — 작은 자리에는 「크게 보기」 손잡이가 선다 */
  variant: 'big' | 'small';
  /** 실지도(카카오)냐 도형(시·군)이냐 — 위에서 한 벌만 쥐고 내려 준다 */
  mapView: MapView;
  onMapView: (view: MapView) => void;
  /** 작은 자리에서 큰 자리로 올리는 손잡이 */
  onExpand?: () => void;
}

/**
 * 시·군별 개소 현황 지도 판 — 시안 B 의 주인공 (SFR-004-01/03).
 *
 * 두 보기를 골라 본다(고객 요청 2026-09-14). **「지도」** 는 실제 카카오 지도 위에 시·군 배지와
 * 고른 시·군의 발전소 점을 얹고, **「시·군」** 은 행정구역 도형 면에 개소 수를 단계색으로 물들여
 * 얹는다 — 「그 학교가 실제로 어디」 는 지도가, 「어느 시·군이 얼마나」 는 도형이 답한다. 기본은
 * 지도 쪽이다(고객이 실지도를 먼저 요구). 카카오를 못 실으면(키·학교망·거부) 도형으로 내려간다.
 *
 * 고른 시·군과 순회 자리는 상세 판과 같은 `useTerrainRegions` 를 보므로, 보기를 오가도·상세와도
 * 늘 같은 곳을 가리킨다.
 */
export function RegionMap({ plants, variant, mapView, onMapView, onExpand }: RegionMapProps) {
  const { regions, active, tour, colorForRegion, indexOfRegion, province, provinceCenter } = useTerrainRegions(plants);
  const mapStatus = useKakaoMaps();

  // 「지도」 를 골랐어도 카카오가 준비되지 않으면 도형으로 보여 준다 — 빈 칸을 남기지 않는다
  const showKakao = mapView === 'kakao' && mapStatus === 'ready';

  return (
    <Panel
      title="시·군별 개소 현황"
      /*
        손잡이를 판 이름과 **같은 줄**에 세운다 (고객 요청 2026-09-15).

        전에는 이름 한 줄 아래에 손잡이 한 줄을 따로 깔아 두 줄이 지도 위를 먹었다. A 의
        `MapPanel` 이 제목 줄 오른쪽(`note`)에 설명과 고르개를 나란히 세우는 것과 같은 수법으로
        한 줄에 모으면, 그만큼이 통째로 지도 높이가 된다.

        도 전체 요약(「운영 318개소 · 금일 62.3MWh」)은 이 줄에서 덜어냈다 — 개소 수는 바로 옆
        범례가 최소~최대로 이미 말하고, 금일 발전량은 오른쪽 상세 판이 고른 시·군 것으로 받는다.
        한 줄에 다 욱여넣으면 손잡이가 접혀 오히려 높이가 는다.
      */
      note={(
        <span className={styles.tools}>
          {/* 무엇을 볼지 — 실지도냐 도형이냐 */}
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={mapView}
            onChange={onMapView}
            label="지도 표시 방식"
            className={styles.view}
          />

          <span className={styles.legend}>
            <span className={styles.legend__title}>개소 수</span>
            <span className={styles.legend__scale} role="img" aria-label={`개소 수 단계, 최소 ${province.minCount}개소부터 최대 ${province.maxCount}개소까지`}>
              {SCALES.map((scale) => (
                <span key={scale} className={styles.legend__step} style={{ backgroundColor: `var(--map-scale-${scale})` } as CSSProperties} />
              ))}
            </span>
            <span className={styles.legend__ends}>{formatNumber(province.minCount)}~{formatNumber(province.maxCount)}</span>
          </span>

          <span className={styles.tour}>
            <span className={styles.tour__state} data-state={tour.state}>{TOUR_STATE_LABEL[tour.state]}</span>

            <button
              type="button"
              className={styles.tour__button}
              onClick={() => tour.toggle()}
              aria-label={tour.state === 'stopped' ? '순회 시작' : '순회 멈춤'}
            >
              {/*
                붙잡힌 동안 테두리를 도는 게이지 — 한 바퀴를 다 돌면 순회가 저절로 되살아난다.

                `key` 에 마지막 손길 시각을 물려 두는 것은, 손을 댈 때마다 게이지를 **처음부터**
                다시 돌리기 위해서다. 리액트가 키가 바뀐 조각을 새로 만들어 CSS 애니메이션이
                되감긴다 — 남은 시간을 매초 셈해 내려 주면 그때마다 지도까지 다시 그려진다.
              */}
              {tour.state === 'held' ? (
                <svg key={tour.touchedAt} className={styles.tour__gauge} viewBox="0 0 44 44" aria-hidden focusable="false">
                  <circle cx="22" cy="22" r="20" pathLength={100} />
                </svg>
              ) : null}

              {tour.state === 'stopped' ? <PlayIcon width={20} height={20} /> : <PauseIcon width={20} height={20} />}
            </button>
          </span>

          {/* 어디에 둘지 — 작은 자리에서만, 위 「무엇을 볼지」 와 성격이 달라 자리를 갈라 둔다 */}
          {variant === 'small' && onExpand ? (
            <ExpandButton label="지도 크게 보기" onClick={onExpand} />
          ) : null}
        </span>
      )}
    >
      <div className={styles.figure}>
        {showKakao ? (
          <KakaoRegionMap
            regions={regions}
            active={active}
            onSelect={(index) => tour.pick(index)}
            onTouch={() => tour.touch()}
            center={provinceCenter}
            level={11}
          />
        ) : (
          <SvgRegionShapes
            regions={regions}
            activeName={active.name}
            colorForRegion={colorForRegion}
            indexOfRegion={indexOfRegion}
            onSelect={(index) => tour.pick(index)}
          />
        )}
      </div>
    </Panel>
  );
}
