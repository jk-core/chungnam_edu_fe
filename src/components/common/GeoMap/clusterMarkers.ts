import type { BadgeTone } from '@/components/common/Badge';

export interface MapMarkerDatum<T> {
  id: string;
  x: number;
  y: number;
  tone: BadgeTone;
  label: string;
  data: T;
}

export interface MapCluster<T> {
  id: string;
  x: number;
  y: number;
  members: MapMarkerDatum<T>[];
}

/**
 * 화면 좌표를 격자에 담아 같은 칸에 든 마커를 하나로 묶는다.
 * 줌이 커지면 격자 한 칸이 담는 실제 범위가 작아져 자연히 흩어진다 (SFR-007-09/10).
 */
export function clusterMarkers<T>(
  markers: MapMarkerDatum<T>[],
  zoom: number,
  cellSize: number,
): MapCluster<T>[] {
  const size = cellSize / zoom;
  const buckets = new Map<string, MapMarkerDatum<T>[]>();

  markers.forEach((marker) => {
    const key = `${Math.floor(marker.x / size)}:${Math.floor(marker.y / size)}`;
    const bucket = buckets.get(key);

    if (bucket) bucket.push(marker);
    else buckets.set(key, [marker]);
  });

  return [...buckets.entries()].map(([key, members]) => ({
    id: key,
    // 묶인 마커들의 무게중심에 버블을 놓는다.
    x: members.reduce((sum, item) => sum + item.x, 0) / members.length,
    y: members.reduce((sum, item) => sum + item.y, 0) / members.length,
    members,
  }));
}
