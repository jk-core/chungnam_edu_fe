import { AIRCON_WATT } from '@/mocks/eduElementary';
import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber } from '@/utils/format';
import type { ElementaryContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { SceneDefs } from '../../scene-art/SceneDefs';
import { Sun } from '../../scene-art/SceneParts';
import { PrincipleStrip } from '../shared/PrincipleStrip';
import styles from './ElementaryCount.module.scss';
import type { CSSProperties } from 'react';
import type { ImpactArtId } from '../../scene-art/ImpactArt';

/**
 * 한 줄에 늘어놓을 그림의 최대 개수.
 *
 * 만 개를 만 개로 그릴 수는 없다. 그렇다고 숫자만 적으면 "10,020" 이 큰지 작은지 아이는 모른다.
 * 그래서 그림 하나가 몇을 뜻하는지 정해 두고 그 배수만큼 늘어놓는다 — 큰 수를 세는 법 자체가 배움이다.
 */
const MAX_ICONS = 26;

/** 그림 하나가 뜻하는 몫을 1·2·5·10·20… 꼴로 고른다 — 아이가 읽을 수 있는 수여야 한다 */
function niceStep(total: number): number {
  if (total <= MAX_ICONS) return 1;

  const rough = total / MAX_ICONS;
  const scale = 10 ** Math.floor(Math.log10(rough));

  return [1, 2, 5, 10].map((step) => step * scale).find((step) => total / step <= MAX_ICONS) ?? scale * 10;
}

interface CountRow {
  id: string;
  label: string;
  /** 그림 줄이 무엇을 뜻하는지 한 줄로 */
  line: string;
  total: number;
  unit: string;
  art: ImpactArtId;
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

      {/*
        큰 수가 어디서 왔는지.
        이 화면은 수를 세어 보이는 것이 일인데, 정작 그 수가 **어떻게 만들어졌는지** 가 빠지면
        아이는 숫자만 외우고 지나간다. 세기 전에 어디서 온 수인지를 먼저 보여 준다.
      */}
      <PrincipleStrip stats={stats} level="elementary" heading="이 전기는 이렇게 만들어졌어요" />

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
              <ImpactArt id={row.art} />
            </li>
          ))}
        </ul>

        {/*
          그림 하나가 몇을 뜻하는지 반드시 적는다.
          적지 않으면 나무 서른 그루로 읽혀, 세어 보이려던 것이 오히려 수를 줄여 말하게 된다.
        */}
        <p className={styles.key}>
          <span className={styles.key__chip} aria-hidden="true">
            <ImpactArt id={row.art} />
          </span>
          = {formatNumber(step)}{row.unit}
        </p>
      </div>
    </section>
  );
}
