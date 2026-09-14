import { useEffect, useState } from 'react';
import type { BadgeTone } from '@/components/common/Badge';
import { TONE_VAR } from './status';
import styles from './AiPanel.module.scss';
import type { CSSProperties } from 'react';

/** 한 글자가 찍히는 간격(ms) — 읽는 속도를 앞지르지 않을 만큼만 */
const TYPE_MS = 22;

/** 한 번에 찍는 글자 수 — 한 자씩 찍으면 긴 글이 너무 늦게 끝난다 */
const STEP = 2;

export interface BriefToken {
  text: string;
  /** 숫자·이름처럼 눈에 걸려야 하는 조각 */
  strong?: boolean;
  /** 그 값이 말하는 상태의 색 — 비우면 강조색으로 적힌다 */
  tone?: BadgeTone;
}

export interface BriefLine {
  /** 이 줄이 무엇을 말하는지 — 왼쪽에 세워 눈이 걸릴 자리를 만든다 */
  label: string;
  tokens: BriefToken[];
}

/** 앞에서부터 `shown` 글자까지만 잘라 낸다 — 조각 경계를 지나도 굵은 조각은 굵게 남는다 */
function cut(tokens: BriefToken[], shown: number): BriefToken[] {
  const out: BriefToken[] = [];
  let at = 0;

  for (const token of tokens) {
    const text = token.text.slice(0, Math.max(0, Math.min(token.text.length, shown - at)));

    at += token.text.length;

    if (text) out.push({ text, strong: token.strong, tone: token.tone });
    if (at >= shown) break;
  }

  return out;
}

/** 줄마다 글이 시작하는 자리 — 앞 줄들의 길이를 모두 더한 값 */
function offsetsOf(lines: BriefLine[]): number[] {
  const out: number[] = [];
  let at = 0;

  for (const line of lines) {
    out.push(at);
    at += line.tokens.reduce((sum, token) => sum + token.text.length, 0);
  }

  return out;
}

/**
 * 지역 요약 (SFR-011-05) — 청사진 판.
 *
 * 규모·출력·실적·상태를 줄로 갈라, 왼쪽 이름표가 무엇을 말하는 줄인지 먼저 읽히게 한다.
 * 글은 진단이 방금 쓴 것처럼 한 글자씩 찍힌다 — 완성된 글이 통째로 나타나면 미리 적어 둔
 * 안내문과 구분되지 않는다. 부모가 지역마다 `key` 로 새로 세우므로 여기서는 처음부터 찍는다.
 *
 * 네 줄은 어떤 경우에도 끝까지 보여야 한다(과업 조건) — 그래서 줄바꿈을 허용하고, 넘칠 높이는
 * 부모가 자리로 보장한다.
 */
export function Briefing({ lines, instant }: { lines: BriefLine[]; instant: boolean }) {
  const total = lines.reduce(
    (sum, line) => sum + line.tokens.reduce((inner, token) => inner + token.text.length, 0),
    0,
  );
  const [typed, setTyped] = useState(instant ? total : 0);

  // 찍은 글자 수는 흐른 시간으로 센다 — 탭이 가려져 시계가 늦어도 깨어날 때 한 번에 따라잡는다.
  useEffect(() => {
    if (instant) return undefined;

    const began = performance.now();
    const timer = window.setInterval(
      () => setTyped(Math.round(((performance.now() - began) / TYPE_MS) * STEP)),
      TYPE_MS,
    );

    return () => window.clearInterval(timer);
  }, [instant]);

  const shown = Math.min(typed, total);
  const offsets = offsetsOf(lines);

  return (
    <div className={styles.brief}>
      {lines.map((line, index) => {
        const pieces = cut(line.tokens, shown - offsets[index]);

        if (pieces.length === 0) return null;

        // 다음 줄이 시작됐다면 이 줄은 다 찍힌 것이다 — 커서는 지금 찍는 줄에만 선다.
        const done = shown >= (index + 1 < offsets.length ? offsets[index + 1] : total);

        return (
          <p key={line.label} className={styles.brief__line}>
            <span className={styles.brief__label}>{line.label}</span>
            <span className={styles.brief__text}>
              {pieces.map((piece, at) => (piece.strong
                ? (
                  <strong
                    key={at}
                    className={styles.brief__key}
                    style={piece.tone ? { '--seg': TONE_VAR[piece.tone] } as CSSProperties : undefined}
                    data-tone={piece.tone ?? undefined}
                  >
                    {piece.text}
                  </strong>
                )
                : <span key={at}>{piece.text}</span>))}
              {done ? null : <span className={styles.brief__caret} aria-hidden="true" />}
            </span>
          </p>
        );
      })}
    </div>
  );
}
