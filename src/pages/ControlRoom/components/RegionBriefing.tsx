import { useEffect, useState } from 'react';
import styles from './AiDiagnosisPanel.module.scss';

/** 한 글자가 찍히는 간격(ms) — 읽는 속도를 앞지르지 않을 만큼만 빠르게 */
const TYPE_MS = 22;

/** 한 번에 찍는 글자 수. 한 자씩 찍으면 긴 문단이 너무 늦게 끝난다 */
const STEP = 2;

export interface BriefToken {
  text: string;
  /** 숫자·이름처럼 눈에 걸려야 하는 조각 */
  strong?: boolean;
}

/** 앞에서부터 `shown` 글자까지만 잘라 낸다 — 조각 경계를 지나면서도 굵은 조각은 굵게 남는다 */
function cut(tokens: BriefToken[], shown: number): BriefToken[] {
  const out: BriefToken[] = [];
  let at = 0;

  for (const token of tokens) {
    const text = token.text.slice(0, Math.max(0, Math.min(token.text.length, shown - at)));

    at += token.text.length;

    if (text) out.push({ text, strong: token.strong });
    if (at >= shown) break;
  }

  return out;
}

/**
 * 지역 요약 문단.
 *
 * 진단이 방금 쓴 글처럼 한 글자씩 찍힌다 — 완성된 문단이 통째로 나타나면 미리 적어 둔 안내문과
 * 구분되지 않는다. 다 찍히면 커서가 사라진다.
 *
 * 부모가 지역이 바뀔 때마다 `key` 로 새로 세우므로 여기서는 처음부터 찍기만 하면 된다.
 */
export function RegionBriefing({ tokens, instant }: { tokens: BriefToken[]; instant: boolean }) {
  const total = tokens.reduce((sum, token) => sum + token.text.length, 0);
  const [typed, setTyped] = useState(instant ? total : 0);

  /*
    찍은 글자 수는 흐른 시간으로 센다.

    한 박자에 한 걸음씩 더하면, 화면이 다른 탭에 가려 브라우저가 시계를 늦출 때 글이 몇 자만
    적힌 채로 남는다. 흐른 시간으로 세면 늦게 깨어나도 그 사이만큼 한 번에 따라잡는다.
  */
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

  return (
    <p className={styles.brief}>
      {cut(tokens, shown).map((piece, index) => (piece.strong
        ? <strong key={index} className={styles.brief__key}>{piece.text}</strong>
        : <span key={index}>{piece.text}</span>))}
      {shown < total ? <span className={styles.brief__caret} aria-hidden="true" /> : null}
    </p>
  );
}
