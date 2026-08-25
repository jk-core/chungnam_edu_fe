import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { MAP_FIT, MAP_VIEW, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { KakaoMiniMap } from '@/components/common/GeoMap/KakaoMiniMap';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { MapStatusFilter, useStatusFilter } from '@/components/plant/MapStatusFilter';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import { PlantPhotos } from '@/components/plant/PlantPhotos';
import type { School } from '@/interface/energy';
import styles from './FaultMap.module.scss';

/** 상황판 한 칸에 들어가는 기본 높이 */
const MAP_HEIGHT = 210;

interface FaultMapProps {
  /** 전체 발전소 */
  plants: School[];
  /**
   * 무엇을 점으로 찍을지.
   * `faults` 는 이상만 찍어 어디가 아픈지 도드라지게 하고,
   * `all` 은 관내 전부를 상태 색으로 찍어 분포를 보여 준다.
   */
  scope?: 'faults' | 'all';
  /** 지도 높이. `'100%'` 를 주면 칸을 꽉 채운다 */
  height?: number | string;
  /** 점을 눌러 그 발전소 설명을 옆에 펼칠지 */
  selectable?: boolean;
  /** 이상 설비를 하나씩 돌아가며 펼친다 — 지켜보는 화면에서 아무도 누르지 않을 때를 위한 것 */
  tour?: boolean;
}

/** 순회가 한 곳에 머무는 시간(ms) */
const TOUR_MS = 7000;

/**
 * 발전소 위치 지도 (SFR-004-01/14).
 * 상황판은 훑어보는 화면이라 확대·이동 없이 위치와 상태만 보여 준다.
 */
export function FaultMap({ plants, scope = 'faults', height = MAP_HEIGHT, selectable, tour }: FaultMapProps) {
  const mapStatus = useKakaoMaps();
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  /*
    순회가 멈추는 까닭은 둘인데 서로 다른 것이라 따로 쥔다.

    `isPlaying` 은 아래 단추로 사람이 정한 것이고, `isHeld` 는 점 하나를 눌러 들여다보는
    동안만 잠시 붙잡아 두는 것이다. 하나로 묶으면 들여다보다 설명을 닫는 순간 "정지" 로
    세워 둔 것까지 함께 풀려, 멈춰 놓고 자리를 뜬 사람이 돌아왔을 때 화면이 또 돌고 있다.
  */
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHeld, setIsHeld] = useState(false);
  const showAll = scope === 'all';
  const shown = showAll ? plants : plants.filter((plant) => isAbnormal(plant.status));
  // 범례가 곧 필터다 — 「경고 11개소」를 읽고 그 열한 곳만 남겨 볼 수 있어야 한다.
  const status = useStatusFilter(shown);
  const marks = status.visible;
  const label = showAll
    ? `충청남도 발전소 위치. 관내 ${marks.length}개소.`
    : `충청남도 장애 발생 위치. 이상 설비 ${marks.length}개소.`;
  const openPlant = marks.find((plant) => plant.id === openId) ?? null;

  /*
    이상 설비 순회.

    벽에 걸어 두는 화면이라 아무도 누르지 않는다. 지도에 점만 찍혀 있으면 어느 학교가
    무슨 일인지는 끝내 알 수 없으므로, 이상이 있는 곳을 하나씩 돌아가며 스스로 펼친다.
    사람이 하나를 고르면 멈추고, 닫으면 다시 돈다.
  */
  const abnormalIds = plants.filter((plant) => isAbnormal(plant.status)).map((plant) => plant.id);
  const idsKey = abnormalIds.join(',');
  /** 순회가 지금 서 있는 자리. 이전·다음 단추도 이 값을 옮긴다 */
  const [cursor, setCursor] = useState(0);
  const isRunning = Boolean(tour) && isPlaying && !isHeld;

  // 순회를 켜 두고 아직 아무것도 펼치지 않았다면(처음 켰거나 설명을 닫았다면) 지금 자리를 편다.
  if (isRunning && openId === null && abnormalIds.length > 0) {
    setOpenId(abnormalIds[cursor % abnormalIds.length]);
  }

  useEffect(() => {
    if (!isRunning || abnormalIds.length === 0) return undefined;

    const ids = idsKey.split(',');

    /*
      한 번 재는 시계를 자리마다 새로 건다.

      되풀이 시계 하나로 돌리면 사람이 다음 단추를 눌러 건너뛴 순간에도 시계는 가던 대로 가,
      방금 넘긴 학교가 1초 만에 또 넘어간다. 자리가 바뀔 때마다 다시 걸면 손으로 넘겼든
      저절로 넘어갔든 머무는 시간이 똑같다.
    */
    const timer = window.setTimeout(() => {
      const next = (cursor + 1) % ids.length;

      setCursor(next);
      setOpenId(ids[next]);
    }, TOUR_MS);

    /*
      멈출 때 시계만 끄고 펼쳐 둔 설명은 그대로 둔다 — 정지는 지금 보이는 것을 붙잡는 일이지
      지우는 일이 아니다. 다시 켜면 `cursor` 가 그대로라 섰던 자리에서 이어 간다.
    */
    return () => window.clearTimeout(timer);
    // 목록이 바뀌면 처음부터 다시 돈다. 배열 자체는 매 렌더 새로 만들어지므로 이름만 이어 붙여 견준다.
  }, [isRunning, idsKey, abnormalIds.length, cursor]);

  /**
   * 사람이 앞뒤로 넘긴다.
   *
   * 멈춰 둔 채로도 넘길 수 있어야 하는데 그때는 위 시계가 걸리지 않으므로, 여기서 펼칠 곳을
   * 직접 정한다. 점을 눌러 붙잡아 둔 상태였다면 함께 푼다 — 넘기겠다는 뜻이 곧 그 하나를
   * 그만 들여다보겠다는 뜻이다.
   */
  const step = (delta: number) => {
    if (abnormalIds.length === 0) return;

    const next = (((cursor + delta) % abnormalIds.length) + abnormalIds.length) % abnormalIds.length;

    setCursor(next);
    setOpenId(abnormalIds[next]);
    setIsHeld(false);
  };

  /*
    고른 발전소 설명은 지도 옆에 편다 (SFR-004-01).
    상황판은 훑어보는 화면이라 말풍선으로 지도를 가리면 다른 곳을 못 본다.
  */
  const side = openPlant ? (
    <aside className={styles.side} aria-label={`${openPlant.name} 상세`}>
      <button
        type="button"
        className={styles.side__close}
        onClick={() => {
          setOpenId(null);
          // 붙잡아 둔 것만 푼다 — 아래 단추로 세워 둔 것이라면 닫아도 서 있어야 한다.
          setIsHeld(false);
        }}
        aria-label="상세 닫기"
      >
        <CloseIcon width={15} height={15} />
      </button>

      {/*
        순회가 다음 학교로 넘어갈 때 내용만 갈아 끼우면 숫자가 제자리에서 바뀌어, 같은 학교의
        값이 바뀐 것인지 다른 학교로 넘어간 것인지 알 수 없다. 왼쪽으로 밀어내고 오른쪽에서
        밀어 넣어, 넘어갔다는 사실이 움직임으로 읽히게 한다.
      */}
      {/*
        스크롤은 이 안쪽이 맡는다.
        테두리를 가진 바깥 상자가 스크롤까지 맡으면 미끄러지는 동안 가로로 넘쳐 스크롤바가
        깜빡 생겼다 사라진다 — 옆으로 밀려난 만큼은 여기서 잘라 낸다.
      */}
      <div className={styles.side__scroll}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={openPlant.id}
            initial={reduceMotion ? false : { opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -22 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.26, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <PlantDetailPanel plant={openPlant} />

            {/*
              현장 사진.
              상황판을 지켜보는 사람은 그 학교에 가 본 적이 없다. 이름과 주소만 들고 현장에
              전화하면 어디를 말하는지부터 맞춰야 하는데, 사진 몇 장이 그 왕복을 없앤다.
            */}
            <PlantPhotos plantId={openPlant.id} className={styles.side__photos} />
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  ) : null;

  /** 사람이 고른 것 — 보는 동안 순회를 붙잡아 둔다. 설명을 닫으면 풀린다 */
  const pick = (id: string) => {
    setIsHeld(true);
    setOpenId(id);
  };

  /*
    지도 아래 순회 제어 (SFR-004-01).

    스스로 넘어가는 화면은 읽던 것을 빼앗는다 — 설명을 다 읽기 전에 다음 학교로 넘어가면
    되짚을 방법이 없다. 세워 둘 수 있어야 회의 자리에서 한 곳을 놓고 이야기할 수 있다.

    다시 켤 때는 붙잡아 둔 것도 함께 푼다. 그러지 않으면 재생을 눌러도 지금 펼친 설명이
    순회를 막고 있어 화면이 그대로 서 있는다.
  */
  const tourControl = tour && abnormalIds.length > 0 ? (
    <div className={styles.tour}>
      <button
        type="button"
        className={`${styles.tour__button} ${styles.tour__step}`}
        aria-label="이전 설비"
        onClick={() => step(-1)}
      >
        <ChevronLeftIcon width={13} height={13} />
      </button>

      <button
        type="button"
        className={styles.tour__button}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? '이상 설비 자동 순회 정지' : '이상 설비 자동 순회 재생'}
        onClick={() => {
          setIsPlaying((playing) => !playing);
          if (!isPlaying) setIsHeld(false);
        }}
      >
        {isPlaying ? <PauseIcon width={13} height={13} /> : <PlayIcon width={13} height={13} />}
        {isPlaying ? '정지' : '재생'}
        <span className={styles.tour__count}>
          {abnormalIds.length}개소 순회
        </span>
      </button>

      <button
        type="button"
        className={`${styles.tour__button} ${styles.tour__step}`}
        aria-label="다음 설비"
        onClick={() => step(1)}
      >
        <ChevronRightIcon width={13} height={13} />
      </button>
    </div>
  ) : null;

  // 지도 키가 없거나 외부망이 막히면 내장 지도로 간다 — 상황판이 멈추면 안 된다.
  if (mapStatus === 'ready') {
    return (
      <div className={styles.map} data-fill={height === '100%' ? '' : undefined}>
        {/*
          설명 패널은 지도 위에만 얹힌다.
          바깥 칸을 기준으로 두면 아래 상태 필터와 순회 단추까지 덮어, 순회를 멈추려는 사람이
          누를 곳을 찾지 못한다.
        */}
        <div className={styles.map__stage}>
          <KakaoMiniMap
            plants={marks}
            height={height}
            label={label}
            selectedId={openId ?? undefined}
            // 순회로 펼친 곳은 지도에서도 그 하나만 보이게 당긴다
            focusSelected={Boolean(tour)}
            onPick={selectable ? pick : undefined}
          />
          {side}
        </div>

        <div className={styles.map__foot}>
          <MapStatusFilter
            counts={status.counts}
            picked={status.picked}
            onToggle={status.toggle}
            onReset={status.reset}
            hideEmpty
          />
          {tourControl}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.map} data-fill={height === '100%' ? '' : undefined}>
      <div className={styles.map__stage}>
        <svg
          className={styles.map__svg}
          style={{ height }}
          viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
          role="img"
          aria-label={label}
        >
          <g transform={`translate(${MAP_FIT.x} ${MAP_FIT.y}) scale(${MAP_FIT.scale})`}>
            {/*
              도 모양을 두 겹으로 깐다.

              아래 겹을 조금 내려 어둡게 두면 지도가 판 위에 떠 있는 것처럼 보인다 — 카카오
              지도를 못 불러왔을 때만 나오는 화면이라, 밋밋한 실루엣 하나로는 「지도가 있어야 할
              자리」 로 읽히지 않는다 (2026-08-21 회의).
            */}
            <g className={styles.map__shadow} aria-hidden="true">
              <Chungcheongnamdo fill="currentColor" stroke="none" />
            </g>
            <g className={styles.map__province}>
              {/* 지역 경계선은 긋지 않는다 — 상황판에서 읽을 것은 도 모양과 그 위 점이다. */}
              <Chungcheongnamdo fill="var(--map-scale-1)" stroke="none" />
            </g>

            {marks.map((plant) => {
              const point = projectPoint(plant.location);
              // 확대하지 않으므로 점 크기는 지도 축척만 되돌려 맞춘다.
              const scale = 1 / MAP_FIT.scale;

              return (
                <g
                  key={plant.id}
                  transform={`translate(${point.x} ${point.y}) scale(${scale})`}
                  className={selectable ? styles.pick : undefined}
                  role={selectable ? 'button' : undefined}
                  aria-label={selectable ? `${plant.name} 상세 보기` : undefined}
                  onClick={selectable ? () => pick(plant.id) : undefined}
                >
                  {/*
                    뾰족핀. 뾰족한 끝이 발전소 자리를 정확히 짚는다 — 동그라미는 중심이 어디인지
                    눈으로 가늠해야 한다 (2026-08-21 회의). 그래서 핀 전체를 끝점 위로 올려 그린다.
                  */}
                  <circle className={`${styles.dot__halo} ${styles[`dot--${OPERATION_TONE[plant.status]}`]}`} r={10} />
                  <path
                    className={`${styles.pin} ${styles[`dot--${OPERATION_TONE[plant.status]}`]}`}
                    d="M0 0 L-5.4 -8.4 A6.2 6.2 0 1 1 5.4 -8.4 Z"
                  >
                    <title>{`${plant.name} · ${OPERATION_LABEL[plant.status]}`}</title>
                  </path>
                  <circle className={styles.pin__eye} cy={-13.4} r={2.1} />
                </g>
              );
            })}
          </g>
        </svg>

        {side}
      </div>

      <div className={styles.map__foot}>
        <MapStatusFilter
          counts={status.counts}
          picked={status.picked}
          onToggle={status.toggle}
          onReset={status.reset}
          hideEmpty
        />
        {tourControl}
      </div>
    </div>
  );
}
