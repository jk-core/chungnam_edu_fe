import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { AIRCON_WATT } from '@/mocks/eduElementary';
import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber } from '@/utils/format';
import type { ElementaryContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { CastShadow, SceneDefs } from '../../scene-art/SceneDefs';
import { Conifer, Sun, Window } from '../../scene-art/SceneParts';
import { PrincipleStrip } from '../shared/PrincipleStrip';
import styles from './ElementaryClock.module.scss';
import type { ReactNode } from 'react';

/*
  시계 그림의 좌표계.

  반지름을 정할 때 바깥으로 나가는 것을 전부 세어야 한다 — 해의 후광은 반지름의 1.75배까지 퍼지고
  시각 이름표는 그보다 더 밖에 선다. 하나라도 빠뜨리면 뷰박스 밖으로 잘려 나간다.
*/
const VIEW = 440;
const CENTER = VIEW / 2;

/** 해가 도는 길의 반지름 */
const TRACK = 150;

/** 아침·점심·저녁 이름표가 서는 자리 — 해의 후광(150 × 1.75 = 185)보다 밖이다 */
const TICK = 202;

/*
  시간 막대는 길 안쪽으로 뻗는다.
  바깥으로 뻗으면 이름표·후광과 자리를 다투게 되고, 안쪽은 가운데 판까지 비어 있어 여유가 있다.
*/
const BAR_FROM = 134;
const BAR_MAX = 40;

/** 가운데 판의 반지름 — 막대가 닿는 곳(134 − 40 = 94)보다 안쪽이어야 겹치지 않는다 */
const CORE = 88;

/*
  「지금」 을 가리키는 바늘.

  뿌리는 가운데 판 밑에서 시작해 판이 덮어 주고, 끝은 막대 띠를 가로질러 해 바로 앞에서 멎는다.
  판과 막대 사이에는 6px 밖에 없어(88 ~ 94) 그 틈에만 두면 아예 보이지 않는다 — 막대를 넘어
  가리키는 수밖에 없고, 그래서 막대와 다른 색으로 그린다.
*/
const NEEDLE_FROM = CORE - 10;
const NEEDLE_TO = TRACK - 22;

/** 뿌리 쪽 반폭. 끝으로 갈수록 좁아져 가리키는 방향이 뾰족해진다 */
const NEEDLE_HALF = 6;

/** 해가 도는 각도 범위. 위쪽이 정오가 되도록 왼쪽 아래에서 시작해 오른쪽 아래로 진다 */
const ARC_FROM = 150;
const ARC_TO = 390;

/**
 * 지금 해가 얼마나 높이 떴는지에 따라 달라지는 설명.
 *
 * 시계만 걸어 두면 "지금 몇 시" 까지만 알려 준다. 이 화면이 가르치려는 것은 시각이 아니라
 * **해의 높이가 발전량을 정한다** 는 것이라, 시각마다 그 까닭이 한 줄씩 바뀌어야 한다.
 * 아침에 본 아이와 점심에 본 아이가 서로 다른 것을 배우게 하는 장치이기도 하다.
 */
const HEIGHT_LESSON = [
  {
    until: 0.22,
    title: '해가 낮게 떠 있어요',
    body: '햇빛이 비스듬히 들어와 판 위에 넓게 퍼져요. 같은 빛이 넓게 나뉘니 한 자리가 받는 양은 적어요.',
  },
  {
    until: 0.4,
    title: '해가 올라가고 있어요',
    body: '해가 높아질수록 빛이 판에 더 똑바로 닿아요. 막대가 점점 길어지는 것이 그 때문이에요.',
  },
  {
    until: 0.62,
    title: '해가 가장 높아요',
    body: '빛이 판에 거의 똑바로 내리쬐어요. 같은 넓이에 빛이 가장 많이 모이는 때라, 지금이 하루 중 전기를 가장 많이 만드는 시간이에요.',
  },
  {
    until: 0.82,
    title: '해가 내려가고 있어요',
    body: '다시 비스듬해지면서 약해져요. 아직 밝아 보여도 판이 받는 빛은 아까보다 적어요.',
  },
  {
    until: 1.01,
    title: '해가 지고 있어요',
    body: '햇빛이 지나오는 공기층이 두꺼워져서 많이 흩어져요. 이제 곧 오늘 발전이 끝나요.',
  },
];

interface ElementaryClockProps {
  stats: EduStats;
  content: ElementaryContent;
  nowHour: number;
}

/** 시각을 시계 위 각도로. 해 뜨는 때가 왼쪽 끝, 지는 때가 오른쪽 끝이다 */
function angleOf(hour: number): number {
  const ratio = (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);

  return ARC_FROM + Math.min(1, Math.max(0, ratio)) * (ARC_TO - ARC_FROM);
}

/** 각도와 반지름으로 좌표 하나 */
function pointAt(angle: number, radius: number) {
  const rad = angle * (Math.PI / 180);

  return { x: CENTER + Math.cos(rad) * radius, y: CENTER + Math.sin(rad) * radius };
}

/** 원호 하나를 그리는 path */
function describeArc(radius: number, from: number, to: number): string {
  const start = pointAt(from, radius);
  const end = pointAt(to, radius);
  const large = to - from > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}

/**
 * 초등 판 · 시안 B — 우리 학교의 하루 (SFR-005-01/03/05/06).
 *
 * 현행 시안은 이야기를 **걸음** 으로 나눈다 — 한 장면씩 넘어가며 한 가지씩 말한다.
 * 이 시안은 **시각** 으로 나눈다. 하루 한 바퀴를 시계로 그려 놓고, 해가 지나온 만큼 막대가 자란다.
 *
 * 아이가 복도를 지나며 늘 같은 것을 보게 되는 화면에서, 아침에 본 것과 점심에 본 것이 다르다는
 * 사실 자체가 배움이 된다 — 아침에는 막대가 왼쪽에만 있고 하교할 때는 오른쪽까지 차 있다.
 * 넘어가는 것을 기다릴 필요 없이, 언제 봐도 "지금 여기" 가 해의 자리로 바로 읽힌다.
 */
export function ElementaryClock({ stats, content, nowHour }: ElementaryClockProps) {
  const sun = angleOf(nowHour);
  const sunAt = pointAt(sun, TRACK);
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;
  // 막대 길이를 재는 자. 가장 많이 만든 시간을 꽉 찬 길이로 삼는다.
  const peak = Math.max(...stats.hourly, 1);
  // 하루의 어디쯤인지 — 해의 높이 설명을 고르는 자다.
  const progress = (nowHour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);
  const lesson = HEIGHT_LESSON.find((item) => progress < item.until) ?? HEIGHT_LESSON[HEIGHT_LESSON.length - 1];

  return (
    <div className={styles.board}>
      {/* 왼쪽 — 하루 시계 */}
      <section className={styles.clock} aria-label={`오늘 하루 시간대별 발전량. 지금 ${Math.floor(nowHour)}시`}>
        <svg className={styles.clock__svg} viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none" role="presentation">
          <SceneDefs />

          <defs>
            {/* 지나온 길에 칠하는 빛. 아침 쪽이 옅고 한낮 쪽이 짙다 */}
            <linearGradient id="clock-arc" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="var(--solar)" stopOpacity="0.5" />
              <stop offset="0.5" stopColor="var(--solar)" />
              <stop offset="1" stopColor="var(--solar-deep)" />
            </linearGradient>

            {/* 시계판 바탕 — 가운데가 환하고 가장자리로 잠긴다 */}
            <radialGradient id="clock-face" cx="0.5" cy="0.42" r="0.62">
              <stop offset="0" stopColor="var(--solar)" stopOpacity="0.14" />
              <stop offset="0.72" stopColor="var(--brand)" stopOpacity="0.05" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={CENTER} cy={CENTER} r={TICK - 6} fill="url(#clock-face)" />

          {/*
            하루가 지나가는 길.
            해가 도는 자리를 옅은 띠로 먼저 깔아 둔다 — 아직 오지 않은 시간도 자리를 갖고 있어야
            "앞으로 이만큼 더 남았어요" 가 보인다.
          */}
          <path d={describeArc(TRACK, ARC_FROM, ARC_TO)} stroke="var(--surface-sunken)" strokeWidth="18" strokeLinecap="round" />

          {/* 해가 지나온 만큼 길에 빛이 남는다 */}
          <path
            d={describeArc(TRACK, ARC_FROM, sun)}
            stroke="url(#clock-arc)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/*
            시간마다 하나씩 안쪽으로 뻗는 막대.
            많이 만든 시간일수록 길고 짙다 — 길이와 색이 같은 것을 두 번 말해 멀리서도 읽힌다.
            아직 오지 않은 시간은 자리만 남겨 하루가 채워지는 중이라는 것이 보이게 한다.
          */}
          {stats.hourly.map((kwh, hour) => {
            if (hour < Math.floor(SUNRISE_HOUR) || hour > Math.ceil(SUNSET_HOUR)) return null;

            const ratio = kwh / peak;
            const angle = angleOf(hour + 0.5);
            const from = pointAt(angle, BAR_FROM);
            const to = pointAt(angle, BAR_FROM - Math.max(3, ratio * BAR_MAX));
            const done = hour <= nowHour;

            return (
              <line
                key={hour}
                className={done ? styles.bar : `${styles.bar} ${styles['bar--todo']}`}
                stroke={done ? (ratio > 0.6 ? 'var(--solar-deep)' : 'var(--solar)') : undefined}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}

          {/* 아침·점심·저녁 눈금 — 시계를 읽는 기준점이 셋이면 충분하다 */}
          {[
            { hour: 7, label: '아침' },
            { hour: 12.5, label: '점심' },
            { hour: 18, label: '저녁' },
          ].map((mark) => {
            const at = pointAt(angleOf(mark.hour), TICK);
            const notch = pointAt(angleOf(mark.hour), TRACK + 15);

            return (
              <g key={mark.label}>
                <circle cx={notch.x} cy={notch.y} r="3" fill="var(--border-strong)" />
                <text className={styles.tick} x={at.x} y={at.y + 5} textAnchor="middle">
                  {mark.label}
                </text>
              </g>
            );
          })}

          {/* 해 — 지금 시각에 서 있다. 이 자리가 곧 "지금" 이다 */}
          {isDay ? (
            <g transform={`translate(${sunAt.x - CENTER} ${sunAt.y - CENTER})`}>
              <Sun cx={CENTER} cy={CENTER} r={22} glowClass={styles.sunGlow} rayClass={styles.sunRays} />
            </g>
          ) : null}

          {/*
            한가운데 — 오늘 지금까지 만든 전기.
            띄운 판 위에 얹어야 막대와 겹쳐도 숫자가 앞에 선다. 글자만 놓으면 뒤의 선들과 뒤엉킨다.
          */}
          <circle cx={CENTER} cy={CENTER} r={CORE} fill="var(--surface)" filter="url(#edu-lift)" />
          <circle cx={CENTER} cy={CENTER} r={CORE} fill="url(#edu-shine)" />
          <circle cx={CENTER} cy={CENTER} r={CORE} fill="none" stroke="var(--border-subtle)" strokeWidth="1.5" />

          <text className={styles.core__label} x={CENTER} y={CENTER - 22} textAnchor="middle">
            {isDay ? '금일 발전량' : '해가 지고 없어요'}
          </text>
          <text className={styles.core__value} x={CENTER} y={CENTER + 20} textAnchor="middle">
            {formatNumber(stats.todayKwh, 0)}
          </text>
          <text className={styles.core__unit} x={CENTER} y={CENTER + 46} textAnchor="middle">
            kWh
          </text>

          {/*
            지금을 가리키는 바늘.

            해가 어디에 있는지는 해 자체가 이미 말한다. 다만 그것은 길 **바깥** 의 표시라 눈이
            테두리를 훑어야 찾는데, 가운데에서 뻗어 나온 바늘은 눈이 숫자에 머물러 있을 때 그대로
            읽힌다 — 숫자를 보다가 고개를 들지 않아도 시각이 함께 들어온다.

            가운데 판 위에 그린다. 뿌리는 판 테두리 안쪽에서 시작해 판에서 뻗어 나온 것으로 보이고,
            몸통은 막대 띠를 가로질러 해 앞에서 멎는다. 도는 축을 점으로 찍어 두지는 않는다 —
            판 한가운데는 오늘 만든 전기가 쓰는 자리라, 점 하나가 숫자를 가린다.

            0도(오른쪽)를 향해 그려 두고 통째로 돌린다 — 점마다 좌표를 셈하면 시각이 바뀔 때
            모양이 미세하게 달라지고, 회전만 바꾸면 CSS 가 그 사이를 이어 줄 수 있다.
          */}
          {isDay ? (
            <g className={styles.needle} transform={`rotate(${sun} ${CENTER} ${CENTER})`}>
              <polygon
                className={styles.needle__blade}
                points={[
                  `${CENTER + NEEDLE_FROM},${CENTER - NEEDLE_HALF}`,
                  `${CENTER + NEEDLE_TO},${CENTER}`,
                  `${CENTER + NEEDLE_FROM},${CENTER + NEEDLE_HALF}`,
                ].join(' ')}
              />
            </g>
          ) : null}

          {/* 시계 아래 우리 학교 — 이 시계가 무엇의 하루인지 그림이 말한다 */}
          <g transform={`translate(${CENTER - 46} ${VIEW - 22})`}>
            <CastShadow cx={46} cy={4} rx={64} ry={9} />
            <path d="M-18 4h128" stroke="var(--border-subtle)" strokeWidth="3" strokeLinecap="round" />
            <MiniSchool />
          </g>
        </svg>

        {/*
          지금 해의 높이가 뜻하는 것.
          시계는 "몇 시" 까지만 말한다 — 이 화면이 가르치려는 것은 **해의 높이가 발전량을 정한다** 는
          쪽이라, 시각이 흐르면 이 줄이 바뀌어 같은 화면이 하루에 다섯 가지를 이야기한다.
        */}
        {isDay ? (
          <p className={styles.lesson}>
            <strong>{lesson.title}</strong>
            {lesson.body}
          </p>
        ) : (
          <p className={styles.lesson}>
            <strong>해가 지고 없어요</strong>
            해가 지면 판은 전기를 만들지 않아요. 내일 아침 해가 다시 뜨면 막대가 왼쪽부터 자라기 시작해요.
          </p>
        )}
      </section>

      {/* 오른쪽 — 그 시계가 뜻하는 것 */}
      <div className={styles.side}>
        <Card
          label="실시간 출력"
          value={formatNumber(stats.outputKw, 1)}
          unit="kW"
          note={`가장 셀 때의 ${Math.round(stats.loadRatio * 100)}만큼 내고 있어요`}
          tone="solar"
          art={<SunArt />}
        />
        <Card
          label="발전시간"
          value={formatNumber(stats.equivalentHours, 1)}
          unit="시간"
          note="해가 가장 셀 때만 골라서 발전했다면 이만큼 걸렸을 시간이에요"
          tone="brand"
          art={<CupArt ratio={Math.min(1, stats.equivalentHours / 8)} />}
        />
        <Card
          label="소나무로 환산하면"
          value={formatNumber(kwhToTrees(stats.dayKwh))}
          unit="그루"
          note="탄소가 그만큼 줄었어요"
          tone="ok"
          art={<TreeArt />}
        />
        <Card
          label="4인 가구 사용일수"
          value={formatNumber(kwhToHouseholdDays(stats.dayKwh))}
          unit="일"
          note={`에어컨이라면 ${formatNumber((stats.dayKwh * 1000) / AIRCON_WATT)}시간이에요`}
          tone="brand"
          art={<HouseArt />}
        />

        <p className={styles.caption}>{content.headline.mainNote(stats)}</p>
      </div>

      {/*
        아래를 가로지르는 원리 네 마디.
        시계와 숫자만으로는 이 전기가 **어떻게** 만들어졌는지가 끝내 빠진다. 걸어 두는 화면의
        목적이 태양광을 설명하는 것이라면, 원리는 어느 시안에서도 화면을 떠나지 않아야 한다.
      */}
      <div className={styles.principle}>
        <PrincipleStrip stats={stats} level="elementary" heading="햇빛이 전기가 되기까지" />
      </div>
    </div>
  );
}

/** 오른쪽 숫자 한 칸 — 그림이 있어야 숫자 넷이 서로 다른 이야기로 갈린다 */
function Card({
  label,
  value,
  unit,
  note,
  tone,
  art,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  tone: 'solar' | 'brand' | 'ok';
  art: ReactNode;
}) {
  return (
    <section className={styles.card} data-tone={tone}>
      <div className={styles.card__art} aria-hidden="true">{art}</div>

      <div className={styles.card__text}>
        <h2 className={styles.card__label}>{label}</h2>
        <p className={styles.card__value}>
          {value}
          <span>{unit}</span>
        </p>
        <p className={styles.card__note}>{note}</p>
      </div>
    </section>
  );
}

/** 시계 아래 학교 — 아주 작게 그리므로 지붕과 판만 남긴다 */
function MiniSchool() {
  return (
    <g>
      <rect x="4" y="-22" width="84" height="26" fill="var(--surface)" />
      <rect x="4" y="-22" width="84" height="26" fill="url(#edu-shine)" />

      {[0, 1, 2, 3].map((slot) => (
        <rect key={slot} x={12 + slot * 20} y={-16} width="12" height="10" rx="1.5" fill="var(--solar)" fillOpacity="0.75" />
      ))}

      {/* 지붕과 그 위의 판 — 이 시계가 지붕에서 만든 전기의 하루라는 표시다 */}
      <path d="M-2 -22h96v-7H-2Z" fill="var(--surface-sunken)" />
      <path d="M-2 -22h96v-7H-2Z" fill="url(#edu-shade)" />

      {[0, 1, 2].map((slot) => (
        <g key={slot} transform={`translate(${10 + slot * 26} -30)`}>
          <path d="M0 0h20l6-6H6Z" fill="var(--brand)" />
          <path d="M0 0h20l6-6H6Z" fill="url(#edu-glass)" />
        </g>
      ))}

      <path d="M4 4v-26h84v26M-2 -22h96v-7H-2Z" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

/** 해 — 지금 만드는 힘 */
function SunArt() {
  return (
    <svg viewBox="0 0 72 72" fill="none" role="presentation">
      <SceneDefs />
      <Sun cx={36} cy={36} r={19} />
    </svg>
  );
}

/**
 * 발전시간.
 *
 * 시계판이나 모래시계를 그리면 "몇 시" 로 읽힌다. 여기서 말하는 것은 시각이 아니라 **모은 양** 이라,
 * 잔이 차오르는 모양으로 그려 두는 편이 뜻에 맞는다.
 */
function CupArt({ ratio }: { ratio: number }) {
  const top = 20 + (1 - ratio) * 32;
  const cup = 'M20 16h32l-5 40H25Z';

  return (
    <svg viewBox="0 0 72 72" fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={36} cy={58} rx={22} ry={5} />

      <path d={cup} fill="var(--surface-sunken)" />
      {/* 잔 모양대로 잘라 낸 뒤 그 안에서만 채운다 — 모서리를 넘어 흘러넘치지 않게 */}
      <clipPath id="clock-cup">
        <path d={cup} />
      </clipPath>
      <rect x="18" y={top} width="36" height={60 - top} fill="var(--solar)" clipPath="url(#clock-cup)" />
      <rect x="18" y={top} width="36" height="4" fill="var(--solar-deep)" clipPath="url(#clock-cup)" />

      <path d={cup} fill="url(#edu-glass)" />
      <path d={cup} fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 15h40" stroke="var(--border-strong)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** 나무 한 그루 */
function TreeArt() {
  return (
    <svg viewBox="-42 -118 84 132" fill="none" role="presentation">
      <SceneDefs />
      <Conifer />
    </svg>
  );
}

/**
 * 집 한 채.
 *
 * 큰 그림용 `House` 를 줄여 쓰지 않는다 — 그쪽은 폭 148 에 맞춰 지붕 높이를 못 박아 두어,
 * 작게 줄이면 지붕만 커다란 삼각형으로 남고 벽이 눌린다. 아이콘은 아이콘의 비례로 다시 그린다.
 */
function HouseArt() {
  const roof = 'M36 6 70 34H2Z';

  return (
    <svg viewBox="0 0 72 72" fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={36} cy={62} rx={28} ry={6} />

      <rect x="10" y="32" width="52" height="28" rx="3" fill="var(--surface)" />
      <rect x="10" y="32" width="52" height="28" rx="3" fill="url(#edu-shine)" />
      <rect x="10" y="32" width="52" height="28" rx="3" fill="url(#edu-shade)" />
      <rect x="10.9" y="32.9" width="50.2" height="26.2" rx="3" fill="none" stroke="var(--border-strong)" strokeWidth="1.6" />

      <Window x={17} y={38} w={16} h={12} />
      <rect x="39" y="38" width="16" height="22" rx="2" fill="var(--brand)" fillOpacity="0.45" />
      <rect x="39" y="38" width="16" height="22" rx="2" fill="none" stroke="var(--brand-contrast)" strokeWidth="1.4" />

      {/* 지붕은 벽 위에 얹어 벽 윗변을 덮는다 — 순서를 바꾸면 벽 선이 지붕을 뚫고 나온다 */}
      <path d={roof} fill="var(--brand)" />
      <path d="M36 6 70 34H36Z" fill="#0b1524" fillOpacity="0.18" />
      <path d={roof} fill="url(#edu-shine)" fillOpacity="0.5" />
      <path d={roof} fill="none" stroke="var(--brand-contrast)" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
