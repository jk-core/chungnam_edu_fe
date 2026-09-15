import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from '@/components/common/Icon';
import type { FileMeta } from '@/service/common';
import styles from './PlantPhotos.module.scss';
import type { PointerEvent } from 'react';

interface PlantPhotosProps {
  photos: FileMeta[];
  /** 대체 텍스트를 짓는 데 쓴다 — 사진 자체는 무엇을 찍은 것인지 말해 주지 않는다 */
  plantName: string;
  className?: string;
}

/**
 * 발전소 현장 대표이미지.
 *
 * 숫자와 표만으로는 그 발전소가 지붕형인지 주차장 캐노피인지, 모듈이 몇 줄로 누웠는지가
 * 끝내 그려지지 않는다. 현장에 가 본 적 없는 사람이 화면만 보고 이야기해야 하는 자리라
 * 사진 한 장이 제원 열 줄을 대신한다.
 *
 * 여러 장을 나란히 늘어놓지 않고 한 칸에 겹쳐 넘긴다 — 장수가 발전소마다 달라서 늘어놓으면
 * 한 장인 곳과 세 장인 곳의 사진 크기가 딴판이 되고, 좁은 칸에서는 셋 다 우표만 해진다.
 * 칸은 늘 같은 크기·같은 비율이고, 사진은 제 비율을 지킨 채 그 안에 담긴다.
 */
export function PlantPhotos({ photos, plantName, className }: PlantPhotosProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  /** 끄는 동안의 시작 지점. 렌더에 쓰이지 않아 상태로 두지 않는다 */
  const drag = useRef<{ x: number; from: number } | null>(null);
  /** 스크롤이 멎기를 기다리는 시계 */
  const settle = useRef(0);
  const [index, setIndex] = useState(0);

  /*
    보고 있는 칸은 매번 목록 길이 안으로 접어 넣는다.

    지도는 패널을 띄워 둔 채 다른 발전소로 갈아탄다(순회는 7초마다 저절로 갈아탄다) — 이때
    컴포넌트는 그대로 살아 있어 번호만 남는다. 두 장짜리에서 둘째를 보던 채로 한 장짜리가
    들어오면 「2 / 1」 이 적힌다.
  */
  const current = Math.min(index, photos.length - 1);

  // 번호가 바뀌면 그 칸으로 민다.
  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    const left = current * track.clientWidth;

    // 손으로 밀어 넘긴 뒤에는 이미 그 자리다 — 다시 넣으면 스냅이 한 번 더 튄다.
    if (Math.abs(track.scrollLeft - left) > 1) track.scrollLeft = left;
  }, [current]);

  if (photos.length === 0) return null;

  /*
    지금 몇 번째인지는 **스크롤이 멎은 뒤에** 읽는다.

    스크롤 이벤트마다 상태를 갱신하면 넘어가는 도중에 화면이 몇 번씩 다시 그려지고, 스냅
    컨테이너가 그때마다 자리를 다시 잡느라 방금 시작한 이동을 되돌려 버린다 — 점을 눌러도
    제자리에 서 있던 것이 이 때문이었다. 멎은 뒤에 한 번만 읽으면 이동이 끝까지 간다.
  */
  const readIndex = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const track = trackRef.current;

      if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
    }, 120);
  };

  /*
    옮기는 것은 번호만 바꾸고, 실제로 미는 일은 아래 `useEffect` 가 렌더 뒤에 한다.

    누르는 자리에서 곧바로 `scrollLeft` 를 넣으면 그 직후의 재렌더에서 스냅 컨테이너가
    **직전에 붙어 있던 칸으로 되돌아간다** — 점을 눌러도 제자리에 서 있던 것이 이 때문이다.
    번호를 유일한 출처로 두고 그림이 뒤따르게 하면 되돌려질 자리가 없다.
  */
  const goTo = (next: number) => setIndex(next);

  /*
    마우스로 끌어 넘기기.

    손가락과 트랙패드는 브라우저가 이미 옆으로 밀어 주므로 마우스만 맡는다 — 둘 다 받으면
    한 번 민 것이 두 번 밀린다. 끄는 동안에는 스냅을 꺼 둔다. 켜 둔 채로 위치를 직접 넣으면
    브라우저가 매 프레임 가까운 칸으로 되돌려 손을 따라오지 못한다.
  */
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (!track || event.pointerType !== 'mouse') return;

    drag.current = { x: event.clientX, from: track.scrollLeft };
    track.setPointerCapture(event.pointerId);
    track.dataset.dragging = '';
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (!track || !drag.current) return;

    track.scrollLeft = drag.current.from - (event.clientX - drag.current.x);
  };

  const endDrag = () => {
    const track = trackRef.current;

    if (!track || !drag.current) return;

    drag.current = null;
    delete track.dataset.dragging;
    // 손을 뗀 자리에서 가장 가까운 칸으로 붙인다 — 스냅을 다시 켜는 것만으로는 움직이지 않는다.
    goTo(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div className={className ? `${styles.gallery} ${className}` : styles.gallery}>
      <div className={styles.frame}>
        <div
          ref={trackRef}
          className={styles.track}
          data-many={photos.length > 1 ? '' : undefined}
          onScroll={readIndex}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="group"
          aria-label={photos.length > 1
            ? `현장 사진 ${photos.length}장. 좌우로 밀어 넘깁니다.`
            : '현장 사진 1장'}
        >
          {photos.map((photo, order) => (
            <Slide
              key={`${photo.fileId}-${photo.fileSeq}`}
              photo={photo}
              label={`${plantName} 현장 사진 ${order + 1}`}
            />
          ))}
        </div>

        {/* 넘길 곳이 남아 있을 때만 화살표를 세운다 — 눌러도 안 움직이는 단추는 고장으로 읽힌다 */}
        {current > 0 ? (
          <button
            type="button"
            className={`${styles.arrow} ${styles['arrow--prev']}`}
            onClick={() => goTo(current - 1)}
            aria-label="이전 사진"
          >
            <ChevronLeftIcon width={16} height={16} aria-hidden />
          </button>
        ) : null}

        {current < photos.length - 1 ? (
          <button
            type="button"
            className={`${styles.arrow} ${styles['arrow--next']}`}
            onClick={() => goTo(current + 1)}
            aria-label="다음 사진"
          >
            <ChevronRightIcon width={16} height={16} aria-hidden />
          </button>
        ) : null}

        <span className={styles.counter}>{current + 1} / {photos.length}</span>
      </div>

      {/* 한 장뿐이면 넘길 것이 없어 점을 두지 않는다 */}
      {photos.length > 1 ? (
        <div className={styles.dots}>
          {photos.map((photo, order) => (
            <button
              key={`${photo.fileId}-${photo.fileSeq}`}
              type="button"
              className={order === current ? `${styles.dot} ${styles['dot--on']}` : styles.dot}
              onClick={() => goTo(order)}
              aria-label={`${order + 1}번째 사진 보기`}
              aria-current={order === current ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 사진 한 장.
 *
 * 실린 뒤에야 실패를 알 수 있어 상태를 각 칸이 따로 쥔다 — 한 장이 없다고 나머지까지
 * 자리표시자로 떨어뜨리면, 파일이 하나씩 들어오는 동안 화면이 실제보다 비어 보인다.
 */
function Slide({ photo, label }: { photo: FileMeta; label: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={styles.slide}>
      {failed ? (
        <span className={styles.blank} role="img" aria-label={`${label} 준비 중`}>
          <PhotoIcon width={22} height={22} aria-hidden />
          사진 준비 중
        </span>
      ) : (
        <img
          className={styles.image}
          src={photo.url}
          alt={label}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
