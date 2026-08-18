import styles from './Masthead.module.scss';

/**
 * 사괘 — 자리와 기울기, 그리고 각 효가 이어졌는지(`true`)·끊겼는지(`false`).
 *
 * 왼쪽 위부터 건(☰)·감(☵)·리(☲)·곤(☷) 이다. 네 괘의 자리는 정해져 있어 임의로 바꾸지 않는다.
 * 기울기 33.69°(= `atan(2/3)`)는 깃면의 가로세로 비에서 나온 값이라, 괘가 태극을 향해 선다.
 */
const TRIGRAMS = [
  { x: 7.5, y: 5, turn: -33.69, bars: [true, true, true] },
  { x: 22.5, y: 5, turn: 33.69, bars: [false, true, false] },
  { x: 7.5, y: 15, turn: 33.69, bars: [true, false, true] },
  { x: 22.5, y: 15, turn: -33.69, bars: [false, false, false] },
];

/** 효 하나의 크기 — 이어진 효는 통으로, 끊긴 효는 이 길이를 둘로 나눠 그린다 */
const BAR = { width: 6.4, height: 1, gap: 0.62 };

/**
 * 태극기.
 *
 * 20px 남짓으로 들어가는 장식이라 사괘까지는 눈에 잡히지 않지만, 통으로 뭉뚱그리면 어느 나라
 * 깃발인지 모를 얼룩이 된다. 자리와 이어짐·끊어짐만 제대로 두면 작아져도 태극기로 읽힌다.
 */
function KoreaFlag() {
  return (
    <svg className={styles.masthead__flag} viewBox="0 0 30 20" aria-hidden="true" focusable="false">
      <rect width="30" height="20" fill="#fff" />

      {/*
        태극. 아래를 파랑으로 깔고 위쪽 절반을 빨강으로 덮는다 —
        두 색을 따로 그리면 맞물리는 S 곡선에서 흰 실금이 비친다.
      */}
      <g transform="rotate(-33.69 15 10)">
        <circle cx="15" cy="10" r="5" fill="#0047a0" />
        <path d="M10 10a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 0 5 0 5 5 0 0 0-10 0Z" fill="#cd2e3a" />
      </g>

      {TRIGRAMS.map((trigram) => (
        <g key={`${trigram.x}-${trigram.y}`} transform={`rotate(${trigram.turn} ${trigram.x} ${trigram.y})`} fill="#000">
          {trigram.bars.map((joined, row) => {
            const y = trigram.y - (BAR.height + BAR.gap) + row * (BAR.height + BAR.gap) - BAR.height / 2;
            const left = trigram.x - BAR.width / 2;
            // 끊긴 효는 가운데를 비운다 — 빈 폭은 효 두께와 같게 두어 어느 크기에서도 같은 결로 보인다
            const half = (BAR.width - BAR.height) / 2;

            return joined ? (
              <rect key={row} x={left} y={y} width={BAR.width} height={BAR.height} />
            ) : (
              <g key={row}>
                <rect x={left} y={y} width={half} height={BAR.height} />
                <rect x={left + half + BAR.height} y={y} width={half} height={BAR.height} />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/**
 * 정부 누리집 안내 띠 (KRDS 마스트헤드).
 *
 * 공공 누리집을 사칭한 곳과 구별할 근거를 첫 화면에서 내주는 자리다. 그래서 로고나 메뉴보다
 * 위, 화면에서 가장 먼저 닿는 곳에 선다.
 *
 * 헤더 안이 아니라 그 위에 따로 둔다. 헤더는 `sticky` 라 안에 넣으면 스크롤 내내 따라다니는데,
 * 이 문장은 한 번 읽으면 그만인 안내지 늘 손 닿는 곳에 있어야 하는 것이 아니다 — 자리만
 * 차지하고 정작 필요한 메뉴를 아래로 민다.
 */
export function Masthead() {
  return (
    <div className={styles.masthead}>
      <p className={styles.masthead__inner}>
        <KoreaFlag />
        이 누리집은 대한민국 공식 전자정부 누리집입니다.
      </p>
    </div>
  );
}
