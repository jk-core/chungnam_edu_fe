import { useAutoPager } from '@/hooks/useAutoPager';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { formatNumber } from '@/utils/format';
import type { MiddleContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { CastShadow, SceneDefs } from '../../scene-art/SceneDefs';
import { SolarPanel, Sun } from '../../scene-art/SceneParts';
import styles from './MiddleQuiz.module.scss';

/** 그림 하나가 앉는 자리 */
const ART = { width: 240, height: 108 };

/**
 * 한 물음이 도드라져 있는 시간.
 *
 * 여섯이 늘 똑같이 서 있으면 어디부터 읽어야 할지 정하는 일이 지나가는 사람 몫이 되고, 대개는
 * 아무것도 안 읽고 지나간다. 하나씩 돌아가며 앞으로 나오면 눈이 거기에 얹히고, 그래도 나머지
 * 다섯은 그대로 있어 다른 것을 먼저 읽어도 된다 — 순서를 버린다는 이 시안의 전제는 지켜진다.
 */
const SPOTLIGHT_MS = 7_000;

type QuizArtId = 'noon' | 'angle' | 'efficiency' | 'area' | 'cloud' | 'hours';

interface Question {
  id: QuizArtId;
  ask: string;
  /** 한 줄로 끊어 답한다 — 타일이 작아 두 문장이 들어가면 아무도 안 읽는다 */
  answer: string;
  /** 답을 뒷받침하는 오늘의 값 */
  evidence: { label: string; value: string };
  tone: 'solar' | 'brand' | 'ok';
}

interface MiddleQuizProps {
  stats: EduStats;
  content: MiddleContent;
}

/**
 * 중등 판 · 시안 C — 질문 타일 (SFR-005-02/03).
 *
 * 현행 시안은 원리를 순서대로 설명한다. 순서가 있는 설명은 처음부터 읽어야 하고, 처음부터 읽는
 * 사람은 걸어 두는 화면 앞에 거의 없다.
 *
 * 이 시안은 순서를 버리고 **물음** 을 세운다. 여섯 개의 물음이 한 화면에 깔려 있어 어느 것부터
 * 읽어도 되고, 하나만 읽고 지나가도 하나는 남는다. 물음마다 오늘 이 학교의 실제 값이 근거로 붙어,
 * 답이 교과서 문장이 아니라 지금 지붕 위에서 확인된 사실이 된다.
 */
export function MiddleQuiz({ stats, content }: MiddleQuizProps) {
  // 여섯을 한 쪽에 하나씩 담으면 곧 하나씩 도드라지는 순환이 된다.
  const spotlight = useAutoPager({ total: 6, perPage: 1, intervalMs: SPOTLIGHT_MS });
  const sunKw = (stats.irradianceNow * stats.moduleArea) / 1000;
  const efficiency = sunKw > 0 ? (stats.outputKw / sunKw) * 100 : 0;
  const peakHour = stats.hourly.indexOf(Math.max(...stats.hourly));
  const daylight = SUNSET_HOUR - SUNRISE_HOUR;

  const questions: Question[] = [
    {
      id: 'noon',
      ask: '왜 정오에 가장 많이 만들까?',
      answer: '해가 높이 뜰수록 햇빛이 판에 똑바로 내리쬐어, 같은 넓이가 더 센 빛을 받아요.',
      evidence: { label: '가장 많이 만든 시각', value: `${peakHour}시` },
      tone: 'solar',
    },
    {
      id: 'angle',
      ask: '아침 햇빛은 왜 약할까?',
      answer: '비스듬히 들어와 같은 빛다발이 더 넓게 퍼지고, 지나야 할 공기도 두꺼워요.',
      evidence: { label: '지금 햇빛 세기', value: `${Math.round((stats.irradianceNow / FULL_SUN_WM2) * 100)}점` },
      tone: 'solar',
    },
    {
      id: 'efficiency',
      ask: '받은 빛이 전부 전기가 될까?',
      answer: '아니요. 대부분은 열이 되어 흩어지고, 전기가 되는 몫은 일부예요.',
      evidence: { label: '지금 전기가 되는 몫', value: `${formatNumber(efficiency, 1)}%` },
      tone: 'brand',
    },
    {
      id: 'area',
      ask: '판이 넓으면 무조건 많을까?',
      answer: '넓이는 그릇의 크기일 뿐이에요. 얼마나 담기는지는 그날 햇빛이 정해요.',
      evidence: { label: '햇빛 받는 넓이', value: `${formatNumber(stats.moduleArea)}m²` },
      tone: 'brand',
    },
    {
      id: 'cloud',
      ask: '구름이 지나가면 어떻게 될까?',
      answer: '그 시간만 뚝 떨어졌다가 곧 돌아와요. 곡선이 움푹 팬 자리예요.',
      evidence: { label: '오늘 만든 전기', value: `${formatNumber(stats.todayKwh, 0)}kWh` },
      tone: 'ok',
    },
    {
      id: 'hours',
      ask: '해가 떠 있는 내내 만들까?',
      answer: '만들긴 하지만 세기가 달라요. 가장 셀 때로만 쳐서 세면 훨씬 짧아요.',
      evidence: { label: '해를 모은 시간', value: `${formatNumber(stats.equivalentHours, 1)}시간` },
      tone: 'ok',
    },
  ];

  return (
    <div className={styles.board}>
      <header className={styles.head}>
        <h2 className={styles.head__title}>지붕 위에서 벌어지는 일, 여섯 가지 물음</h2>
        <p className={styles.head__note}>{content.headline.mainNote(stats)}</p>
      </header>

      <div className={styles.tiles}>
        {questions.map((question, index) => (
          <article
            key={question.id}
            className={styles.tile}
            data-tone={question.tone}
            data-on={index === spotlight.page ? '' : undefined}
          >
            <header className={styles.tile__head}>
              <span className={styles.tile__no}>Q{index + 1}</span>
              <h3 className={styles.tile__ask}>{question.ask}</h3>
            </header>

            <div className={styles.tile__art}>
              <svg viewBox={`0 0 ${ART.width} ${ART.height}`} fill="none" role="presentation" preserveAspectRatio="xMidYMid meet">
                <SceneDefs />
                <QuizArt
                  id={question.id}
                  stats={stats}
                  efficiency={efficiency}
                  daylight={daylight}
                  peakHour={peakHour}
                />
              </svg>
            </div>

            <p className={styles.tile__answer}>{question.answer}</p>

            <p className={styles.tile__evidence}>
              {question.evidence.label}
              <strong>{question.evidence.value}</strong>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * 물음마다 붙는 그림.
 *
 * 그림 하나가 답 한 줄을 눈으로 보인다. 축도 눈금도 두지 않는 것은 값을 읽으라는 그림이 아니라
 * **모양을 보라는** 그림이기 때문이다 — 정확한 값은 아래 근거 줄에 있다.
 */
function QuizArt({
  id,
  stats,
  efficiency,
  daylight,
  peakHour,
}: {
  id: QuizArtId;
  stats: EduStats;
  efficiency: number;
  daylight: number;
  peakHour: number;
}) {
  if (id === 'noon' || id === 'cloud') {
    const peak = Math.max(...stats.hourly, 1);
    const points = stats.hourly.map((kwh, hour) => `${(hour / 23) * ART.width},${96 - (kwh / peak) * 76}`);
    const line = points.join(' ');
    // 햇빛은 남았는데 발전만 꺾인 시각 — 구름이 지난 자리다.
    const dip = stats.hourly.reduce((best, kwh, hour) => {
      if (hour < 9 || hour > 16) return best;
      const drop = (stats.irradianceSeries[hour] / Math.max(...stats.irradianceSeries, 0.001))
        - kwh / peak;

      return drop > best.drop ? { hour, drop } : best;
    }, { hour: 13, drop: -1 });
    const markHour = id === 'noon' ? peakHour : dip.hour;
    const markX = (markHour / 23) * ART.width;
    const markY = 96 - (stats.hourly[markHour] / peak) * 76;

    return (
      <g>
        <polygon points={`0,96 ${line} ${ART.width},96`} fill="var(--solar)" fillOpacity="0.18" />
        <polyline points={line} stroke="var(--solar)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <path d={`M0 96h${ART.width}`} stroke="var(--border-subtle)" strokeWidth="2" />

        {id === 'noon' ? (
          <g>
            {/* 봉우리 위에 해를 얹어, 가장 높이 뜬 때가 곧 봉우리라는 것을 겹쳐 보인다 */}
            <line x1={markX} y1={markY} x2={markX} y2="96" stroke="var(--solar-deep)" strokeWidth="2" strokeDasharray="4 4" />
            <Sun cx={markX} cy={26} r={15} />
          </g>
        ) : (
          <g>
            {/* 팬 자리 위에 구름을 얹는다 — 왜 팼는지를 그림이 답한다 */}
            <line x1={markX} y1={markY} x2={markX} y2="96" stroke="var(--text-faint)" strokeWidth="2" strokeDasharray="4 4" />
            <g transform={`translate(${markX - 34} 8)`}>
              <path
                d="M14 30a13 13 0 0 1 3-19 17 17 0 0 1 30 3 12 12 0 0 1 6 16Z"
                fill="var(--surface)"
              />
              <path
                d="M14 30a13 13 0 0 1 3-19 17 17 0 0 1 30 3 12 12 0 0 1 6 16Z"
                fill="url(#edu-shade)"
              />
              <path
                d="M14 30a13 13 0 0 1 3-19 17 17 0 0 1 30 3 12 12 0 0 1 6 16Z"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="1.6"
              />
            </g>
          </g>
        )}
      </g>
    );
  }

  if (id === 'angle') {
    /*
      같은 굵기의 빛다발이 비스듬히 들어오면 판 위에 더 넓게 퍼진다.
      두 판을 나란히 놓고 빛이 닿는 폭을 달리 그려, 1m² 가 받는 힘이 달라지는 까닭을 보인다.

      자리를 잡을 때 판이 실제로 차지하는 높이를 세어야 한다 — `SolarPanel` 은 윗면(86)뿐 아니라
      두께·지지대·바닥 그림자까지 121 만큼 아래로 뻗는다. 윗면만 보고 자리를 잡으면 지지대가
      땅금과 이름표를 뚫고 내려간다.
    */
    return (
      <g>
        {/* 한낮 — 곧게 내려와 좁게 모인다 */}
        <Sun cx={54} cy={16} r={9} />
        <path d="M45 25 63 25 78 58H30Z" fill="var(--solar)" fillOpacity="0.26" />
        <g transform="translate(22 50) scale(0.32)">
          <SolarPanel x={0} y={0} glow={0.38} />
        </g>

        {/* 아침 — 비스듬히 들어와 같은 빛이 더 넓게 퍼진다 */}
        <Sun cx={214} cy={26} r={9} />
        <path d="M206 34 221 34 196 66H108Z" fill="var(--solar)" fillOpacity="0.13" />
        <g transform="translate(132 50) scale(0.32)">
          <SolarPanel x={0} y={0} glow={0.08} />
        </g>

        <path d="M8 90h224" stroke="var(--border-subtle)" strokeWidth="2" strokeLinecap="round" />
        <text className={styles.artLabel} x="54" y="103" textAnchor="middle">한낮</text>
        <text className={styles.artLabel} x="164" y="103" textAnchor="middle">아침 · 더 넓게 퍼져요</text>
      </g>
    );
  }

  if (id === 'efficiency') {
    // 받은 빛을 통째로 두고 전기가 된 몫만 잘라 보인다 — 나머지가 열이라는 것이 넓이로 읽힌다.
    const share = Math.min(100, Math.max(2, efficiency));
    const cut = (share / 100) * ART.width;

    return (
      <g>
        <rect x="0" y="26" width={ART.width} height="46" rx="8" fill="var(--surface-sunken)" />
        <rect x="0" y="26" width={ART.width} height="46" rx="8" fill="url(#edu-shade)" />
        <rect x="0" y="26" width={Math.max(16, cut)} height="46" rx="8" fill="var(--brand)" />
        <rect x="0" y="26" width={Math.max(16, cut)} height="46" rx="8" fill="url(#edu-shine)" />

        <text className={styles.artLabel} x={Math.max(16, cut) / 2} y="98" textAnchor="middle">전기</text>
        <text className={styles.artLabel} x={(cut + ART.width) / 2} y="98" textAnchor="middle">열이 되어 흩어져요</text>
        <text className={styles.artCap} x={ART.width / 2} y="18" textAnchor="middle">판이 받은 빛 전부</text>
      </g>
    );
  }

  if (id === 'area') {
    // 넓이는 그릇의 크기일 뿐 — 같은 그릇도 담기는 양은 그날 햇빛이 정한다.
    const fill = Math.min(1, Math.max(0.05, stats.irradianceNow / FULL_SUN_WM2));

    return (
      <g>
        <CastShadow cx={120} cy={98} rx={82} ry={7} />
        <rect x="38" y="14" width="164" height="78" rx="8" fill="none" stroke="var(--border-strong)" strokeWidth="2.5" strokeDasharray="6 5" />
        <rect x={38} y={14 + 78 * (1 - fill)} width="164" height={78 * fill} rx="8" fill="var(--solar)" fillOpacity="0.6" />
        <rect x={38} y={14 + 78 * (1 - fill)} width="164" height={Math.min(78 * fill, 10)} rx="5" fill="var(--solar-deep)" fillOpacity="0.5" />
        <text className={styles.artCap} x="120" y="8" textAnchor="middle">판이 담을 수 있는 그릇</text>
      </g>
    );
  }

  // hours — 해가 떠 있는 긴 시간과, 가장 셀 때로만 친 짧은 시간
  const ratio = daylight > 0 ? Math.min(1, stats.equivalentHours / daylight) : 0;

  return (
    <g>
      <rect x="0" y="20" width={ART.width} height="26" rx="8" fill="var(--solar)" fillOpacity="0.24" />
      <text className={styles.artLabel} x="8" y="38">해가 떠 있는 시간</text>

      <rect x="0" y="60" width={Math.max(20, ART.width * ratio)} height="26" rx="8" fill="var(--solar-deep)" />
      <rect x="0" y="60" width={Math.max(20, ART.width * ratio)} height="26" rx="8" fill="url(#edu-shine)" />
      <text className={styles.artOn} x="10" y="78">가장 셀 때로만</text>
    </g>
  );
}
