import { useState } from 'react';
import { PhotoIcon } from '@/components/common/Icon';
import { getPlantPhotos } from '@/mocks/plantPhotos';
import type { PlantPhoto } from '@/mocks/plantPhotos';
import styles from './PlantPhotos.module.scss';

interface PlantPhotosProps {
  plantId: string;
  /** 몇 장까지 펼지. 좁은 칸에서는 대표 한 장만 세운다 */
  limit?: number;
  className?: string;
}

/**
 * 발전소 현장 대표이미지.
 *
 * 숫자와 표만으로는 그 발전소가 지붕형인지 주차장 캐노피인지, 모듈이 몇 줄로 누웠는지가
 * 끝내 그려지지 않는다. 현장에 가 본 적 없는 사람이 화면만 보고 이야기해야 하는 자리라
 * 사진 한 장이 제원 열 줄을 대신한다.
 *
 * 파일이 아직 들어오지 않았거나 경로가 어긋나면 자리표시자로 떨어진다 — 깨진 이미지 아이콘이
 * 뜨면 화면이 고장난 것으로 읽히고, 칸을 통째로 지우면 자리가 있었다는 것조차 알 수 없다.
 */
export function PlantPhotos({ plantId, limit, className }: PlantPhotosProps) {
  const photos = getPlantPhotos(plantId).slice(0, limit);

  if (photos.length === 0) return null;

  return (
    <ul className={className ? `${styles.strip} ${className}` : styles.strip}>
      {photos.map((photo) => (
        <li key={photo.src} className={styles.item}>
          <Frame photo={photo} />
          <span className={styles.caption}>{photo.caption}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 사진 한 칸.
 *
 * 실린 뒤에야 실패를 알 수 있어 상태를 각 칸이 따로 쥔다 — 한 장이 없다고 나머지까지
 * 자리표시자로 떨어뜨리면, 파일이 하나씩 들어오는 동안 화면이 실제보다 비어 보인다.
 */
function Frame({ photo }: { photo: PlantPhoto }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={styles.blank} role="img" aria-label={`${photo.caption} 사진 준비 중`}>
        <PhotoIcon width={22} height={22} aria-hidden />
        사진 준비 중
      </span>
    );
  }

  return (
    <img
      className={styles.image}
      src={photo.src}
      alt={photo.caption}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
