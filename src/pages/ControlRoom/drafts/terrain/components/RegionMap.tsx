import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { formatEnergy, formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import { useTerrainRegions } from '../hooks/useTerrainRegions';
import { ExpandButton } from './ExpandButton';
import { KakaoRegionMap } from './KakaoRegionMap';
import { SvgRegionShapes } from './SvgRegionShapes';
import styles from './RegionMap.module.scss';
import type { MapView } from './TerrainBoard';
import type { CSSProperties } from 'react';

/** 단계색 다섯 단 — 범례가 이 순서로 늘어선다 */
const SCALES = [1, 2, 3, 4, 5] as const;

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
  const today = formatEnergy(province.todayKwh);

  return (
    <section className={styles.map} aria-label="시·군별 개소 현황" data-variant={variant}>
      <header className={styles.map__bar}>
        <div className={styles.map__lead}>
          <h2 className={styles.map__title}>시·군별 개소 현황</h2>
          <p className={styles.map__province}>
            운영 <strong>{formatNumber(province.count)}</strong>개소 · 금일 <strong>{today.value}</strong>{today.unit}
          </p>
        </div>

        <div className={styles.map__tools}>
          {/* 무엇을 볼지 — 실지도냐 도형이냐 */}
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={mapView}
            onChange={onMapView}
            label="지도 표시 방식"
            className={styles.view}
          />

          <div className={styles.legend}>
            <span className={styles.legend__title}>개소 수</span>
            <span className={styles.legend__scale} role="img" aria-label={`개소 수 단계, 최소 ${province.minCount}개소부터 최대 ${province.maxCount}개소까지`}>
              {SCALES.map((scale) => (
                <span key={scale} className={styles.legend__step} style={{ backgroundColor: `var(--map-scale-${scale})` } as CSSProperties} />
              ))}
            </span>
            <span className={styles.legend__ends}>{formatNumber(province.minCount)}~{formatNumber(province.maxCount)}</span>
          </div>

          <button
            type="button"
            className={styles.play}
            onClick={() => tour.toggle()}
            aria-label={tour.isPlaying ? '순회 멈춤' : '순회 시작'}
          >
            {tour.isPlaying ? <PauseIcon width={20} height={20} /> : <PlayIcon width={20} height={20} />}
          </button>

          {/* 어디에 둘지 — 작은 자리에서만, 위 「무엇을 볼지」 와 성격이 달라 자리를 갈라 둔다 */}
          {variant === 'small' && onExpand ? (
            <ExpandButton label="지도 크게 보기" onClick={onExpand} />
          ) : null}
        </div>
      </header>

      <div className={styles.map__figure}>
        {showKakao ? (
          <KakaoRegionMap
            regions={regions}
            active={active}
            onSelect={(index) => tour.goTo(index)}
            center={provinceCenter}
            level={11}
          />
        ) : (
          <SvgRegionShapes
            regions={regions}
            activeName={active.name}
            colorForRegion={colorForRegion}
            indexOfRegion={indexOfRegion}
            onSelect={(index) => tour.goTo(index)}
          />
        )}
      </div>
    </section>
  );
}
