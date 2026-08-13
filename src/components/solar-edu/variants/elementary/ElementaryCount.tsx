import { AIRCON_WATT } from '@/mocks/eduElementary';
import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber } from '@/utils/format';
import type { ElementaryContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { CastShadow, SceneDefs } from '../../scene-art/SceneDefs';
import { Sun } from '../../scene-art/SceneParts';
import styles from './ElementaryCount.module.scss';
import type { CSSProperties } from 'react';

/**
 * 한 줄에 늘어놓을 그림의 최대 개수.
 *
 * 만 개를 만 개로 그릴 수는 없다. 그렇다고 숫자만 적으면 "10,020" 이 큰지 작은지 아이는 모른다.
 * 그래서 그림 하나가 몇을 뜻하는지 정해 두고 그 배수만큼 늘어놓는다 — 큰 수를 세는 법 자체가 배움이다.
 */
const MAX_ICONS = 30;

/** 그림 하나가 뜻하는 몫을 1·2·5·10·20… 꼴로 고른다 — 아이가 읽을 수 있는 수여야 한다 */
function niceStep(total: number): number {
  if (total <= MAX_ICONS) return 1;

  const rough = total / MAX_ICONS;
  const scale = 10 ** Math.floor(Math.log10(rough));

  return [1, 2, 5, 10].map((step) => step * scale).find((step) => total / step <= MAX_ICONS) ?? scale * 10;
}

type CountArtId = 'tree' | 'house' | 'aircon' | 'lamp';

interface CountRow {
  id: string;
  label: string;
  /** 그림 줄이 무엇을 뜻하는지 한 줄로 */
  line: string;
  total: number;
  unit: string;
  art: CountArtId;
  tone: 'ok' | 'brand' | 'sky' | 'solar';
}

interface ElementaryCountProps {
  stats: EduStats;
  content: ElementaryContent;
}

/**
 * 초등 판 · 시안 C — 숫자 놀이터 (SFR-005-03/05/06).
 *
 * 현행 시안은 "나무 10,020그루" 를 글로 적는다. 아이에게 만이라는 수는 글자일 뿐이라, 백이든 만이든
 * 똑같이 "많다" 로만 읽힌다.
 *
 * 이 시안은 그 수를 **세어 보인다**. 그림 하나가 몇을 뜻하는지 정해 두고 그 배수만큼 늘어놓으면,
 * 나무 줄과 집 줄의 길이가 서로 달라 어느 쪽이 더 큰지가 눈으로 바로 갈린다. 큰 수를 묶어서
 * 세는 법 자체가 이 화면이 가르치는 것이다.
 */
export function ElementaryCount({ stats, content }: ElementaryCountProps) {
  const rows: CountRow[] = [
    {
      id: 'tree',
      label: '나무를 심은 만큼',
      line: '발전소가 덜 돌아서 공기가 그만큼 깨끗해졌어요',
      total: kwhToTrees(stats.dayKwh),
      unit: '그루',
      art: 'tree',
      tone: 'ok',
    },
    {
      id: 'house',
      label: '한 집이 쓰는 날',
      line: '네 식구가 사는 집이 하루에 쓰는 양으로 나눠 봤어요',
      total: kwhToHouseholdDays(stats.dayKwh),
      unit: '일',
      art: 'house',
      tone: 'brand',
    },
    {
      id: 'aircon',
      label: '에어컨을 켜 둘 수 있는 시간',
      line: '에어컨 하나만 쉬지 않고 켠다고 셈했어요',
      total: Math.round((stats.dayKwh * 1000) / AIRCON_WATT),
      unit: '시간',
      art: 'aircon',
      tone: 'sky',
    },
    {
      id: 'lamp',
      label: '교실 조명을 켜는 시간',
      line: '40W 짜리 조명 하나를 켠다고 셈했어요',
      total: Math.round(stats.dayKwh * 25),
      unit: '시간',
      art: 'lamp',
      tone: 'solar',
    },
  ];

  return (
    <div className={styles.board}>
      {/*
        위 — 오늘 만든 전기 한 수.
        아래 네 줄이 전부 이 수를 나눈 것이라, 이 수가 화면에서 가장 커야 아래 줄들이 그 몫으로 읽힌다.
      */}
      <header className={styles.hero}>
        <div className={styles.hero__art} aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none" role="presentation">
            <SceneDefs />
            <Sun cx={60} cy={60} r={34} glowClass={styles.heroGlow} rayClass={styles.heroRays} />
          </svg>
        </div>

        <div className={styles.hero__text}>
          <p className={styles.hero__label}>오늘 우리 학교 지붕이 만든 전기</p>
          <p className={styles.hero__value}>
            {formatNumber(stats.todayKwh, 0)}
            <span>kWh</span>
          </p>
          <p className={styles.hero__note}>{content.headline.mainNote(stats)}</p>
        </div>
      </header>

      <div className={styles.rows}>
        {rows.map((row) => (
          <CountBand key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

/** 값 하나를 그림으로 세어 보이는 한 줄 */
function CountBand({ row }: { row: CountRow }) {
  const step = niceStep(row.total);
  const count = Math.max(1, Math.min(MAX_ICONS, Math.round(row.total / step)));

  return (
    <section className={styles.band} data-tone={row.tone}>
      <header className={styles.band__head}>
        <div className={styles.band__title}>
          <h2 className={styles.band__label}>{row.label}</h2>
          <p className={styles.band__line}>{row.line}</p>
        </div>

        <p className={styles.band__value}>
          {formatNumber(row.total)}
          <span>{row.unit}</span>
        </p>
      </header>

      {/*
        그림 줄.
        아래에 땅금을 하나 그어 그림들이 같은 바닥에 서 있게 한다 — 바닥이 없으면 크기가 조금씩
        다른 그림들이 공중에 흩어진 것처럼 보인다.
      */}
      <div className={styles.field}>
        <ul className={styles.icons} aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <li
              key={index}
              className={styles.icon}
              /* 왼쪽부터 차례로 돋아난다 — 세어 나가는 손가락처럼 */
              style={{ animationDelay: `${(index * 0.05).toFixed(2)}s` } as CSSProperties}
            >
              <CountArt art={row.art} />
            </li>
          ))}
        </ul>

        {/*
          그림 하나가 몇을 뜻하는지 반드시 적는다.
          적지 않으면 나무 서른 그루로 읽혀, 세어 보이려던 것이 오히려 수를 줄여 말하게 된다.
        */}
        <p className={styles.key}>
          <span className={styles.key__chip} aria-hidden="true">
            <CountArt art={row.art} />
          </span>
          = {formatNumber(step)}{row.unit}
        </p>
      </div>
    </section>
  );
}

/**
 * 줄마다 다른 그림 하나.
 *
 * 작게 늘어놓는 그림이라도 명암을 얹는다 — 납작한 실루엣 서른 개는 무늬로 보이고,
 * 두께가 있는 그림 서른 개라야 "물건이 서른 개" 로 읽힌다.
 */
function CountArt({ art }: { art: CountArtId }) {
  if (art === 'tree') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={22} cy={48} rx={15} ry={3.5} />
        <path d="M22 2 33 20H11Z" fill="var(--ok)" />
        <path d="M22 2 33 20H22Z" fill="#0b1524" fillOpacity="0.18" />
        <path d="M22 12 37 38H7Z" fill="var(--ok)" />
        <path d="M22 12 37 38H22Z" fill="#0b1524" fillOpacity="0.18" />
        <path d="M22 12 37 38H7Z" fill="url(#edu-shine)" fillOpacity="0.5" />
        <path d="M19 38h6v10h-6Z" fill="#7d5837" />
        <path d="M19 38h2.5v10H19Z" fill="#fff" fillOpacity="0.22" />
      </svg>
    );
  }

  if (art === 'house') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={22} cy={48} rx={16} ry={3.5} />
        <rect x="7" y="22" width="30" height="24" rx="2" fill="var(--surface)" />
        <rect x="7" y="22" width="30" height="24" rx="2" fill="url(#edu-shine)" />
        <rect x="7" y="22" width="30" height="24" rx="2" fill="url(#edu-shade)" />
        <rect x="7.8" y="22.8" width="28.4" height="22.4" rx="2" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" />
        <rect x="12" y="27" width="9" height="8" rx="1.2" fill="var(--solar)" />
        <rect x="24" y="27" width="9" height="19" rx="1.2" fill="var(--brand)" fillOpacity="0.5" />
        <path d="M22 4 41 23H3Z" fill="var(--brand)" />
        <path d="M22 4 41 23H22Z" fill="#0b1524" fillOpacity="0.18" />
        <path d="M22 4 41 23H3Z" fill="url(#edu-shine)" fillOpacity="0.5" />
        <path d="M22 4 41 23H3Z" fill="none" stroke="var(--brand-contrast)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (art === 'aircon') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <rect x="4" y="14" width="36" height="16" rx="6" fill="var(--border-strong)" opacity="0.6" />
        <rect x="4" y="10" width="36" height="16" rx="6" fill="var(--surface)" />
        <rect x="4" y="10" width="36" height="16" rx="6" fill="url(#edu-shine)" />
        <rect x="4" y="10" width="36" height="16" rx="6" fill="url(#edu-shade)" />
        <rect x="9" y="20" width="26" height="4" rx="2" fill="var(--surface-sunken)" />
        <rect x="4.9" y="10.9" width="34.2" height="14.2" rx="5.5" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" />
        <circle cx="34" cy="15" r="2.2" fill="var(--ok)" />
        <path d="M14 32q3.5 5 0 10M22 32q3.5 5 0 10M30 32q3.5 5 0 10" stroke="var(--ai-scan)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 44 52" fill="none" role="presentation">
      <SceneDefs />
      <path d="M22 4a14 14 0 0 1 9 24.6V34H13v-5.4A14 14 0 0 1 22 4Z" fill="var(--solar)" />
      <path d="M22 4a14 14 0 0 1 9 24.6V34H13v-5.4A14 14 0 0 1 22 4Z" fill="url(#edu-orb)" />
      <path d="M17 12a7 7 0 0 1 6-4" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="14" y="35" width="16" height="5" rx="2" fill="var(--text-faint)" />
      <rect x="16" y="42" width="12" height="5" rx="2" fill="var(--text-faint)" />
      <rect x="14" y="35" width="16" height="2" rx="1" fill="#fff" fillOpacity="0.25" />
    </svg>
  );
}
