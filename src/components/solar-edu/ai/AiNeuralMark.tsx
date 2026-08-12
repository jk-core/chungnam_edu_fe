import styles from './AiParts.module.scss';
import type { CSSProperties } from 'react';

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 층마다 노드가 몇 개인지 — 좁은 자리라 3층이면 충분히 신경망으로 읽힌다 */
const LAYERS = [3, 4, 3, 2];

const WIDTH = 132;
const HEIGHT = 56;

/** 층과 칸 번호로 노드 자리를 잡는다 */
function nodeAt(layer: number, index: number, count: number) {
  return {
    x: 10 + (layer * (WIDTH - 20)) / (LAYERS.length - 1),
    y: (HEIGHT * (index + 1)) / (count + 1),
  };
}

/**
 * 층을 지나며 신호가 번져 가는 마크.
 *
 * 오빗 마크가 "AI 가 돌고 있다" 라면 이쪽은 "무언가가 층을 지나 판단이 된다" 를 보인다.
 * 정확한 신경망 구조를 그린 것은 아니지만, 값이 한 층씩 옮겨 가며 걸러진다는 감각은 그대로 남는다.
 */
export function AiNeuralMark() {
  const nodes = LAYERS.map((count, layer) =>
    Array.from({ length: count }, (_, index) => nodeAt(layer, index, count)));

  return (
    <svg
      className={styles.neural}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* 층과 층을 잇는 선 — 신호가 지날 때만 밝아진다 */}
      {nodes.slice(0, -1).map((layer, layerIndex) =>
        layer.map((from, fromIndex) =>
          nodes[layerIndex + 1].map((to, toIndex) => (
            <line
              key={`${layerIndex}-${fromIndex}-${toIndex}`}
              className={styles.neural__edge}
              style={delay(layerIndex * 0.42 + (fromIndex + toIndex) * 0.05)}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          ))))}

      {nodes.map((layer, layerIndex) =>
        layer.map((node, index) => (
          <circle
            key={`${layerIndex}-${index}`}
            className={styles.neural__node}
            style={delay(layerIndex * 0.42 + index * 0.08)}
            cx={node.x}
            cy={node.y}
            r="3.2"
          />
        )))}
    </svg>
  );
}
