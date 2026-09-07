import { formatNumber, scaleSi } from '@/utils/format';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import type { PictureContent } from '@/mocks/eduPicture';
import type { EduStats } from '@/mocks/solarEdu';
import { PictureFlow, PictureGiftArt, PictureGoodArt, PictureSchool, PictureSun, PictureWord } from './art/PictureArt';
import styles from './ElementaryClock.module.scss';

/*
  해가 도는 길의 좌표계.

  반지름을 정할 때 해의 후광까지 세어야 한다 — 후광은 반지름의 1.6배까지 퍼지므로, 해가 길의
  왼쪽 끝(지평선)에 섰을 때 후광 아래쪽이 뷰박스를 넘지 않아야 한다. 정오에는 반대로 위쪽이 넘는다.
*/
const VIEW = { w: 900, h: 420 };

/** 지평선 높이 */
const HORIZON = 348;

/*
  길이 도는 중심 높이.

  지평선과 같게 두었더니 해가 길의 양 끝(해 뜰 때·질 때)에 섰을 때 아래 절반이 땅에 묻혔다.
  중심을 지평선보다 해 반지름만큼 위로 올려, 길의 끝에서도 해가 온전히 땅 위에 서게 한다.
*/
const ARC_CY = HORIZON - 64;

const TRACK = 244;

/** 해의 크기. 길의 꼭대기에서 학교 옥상과 부딪히지 않는 선까지만 키운다 */
const SUN_R = 44;

/** 길 아래 우리 학교가 서는 자리 */
const SCHOOL = { x: 360, y: 252, w: 180, h: 96 };

/**
 * 햇빛이 내려앉는 곳 — 옥상 판의 위쪽.
 *
 * 해가 시각을 따라 움직이므로 빛줄기의 **출발점은 매번 달라지지만 닿는 곳은 늘 여기**다.
 * 아침에는 비스듬히 길게 들어오고 한낮에는 거의 곧게 내려온다 — 입사각이 그림에서 그대로 보인다.
 */
const LANDING = { x: SCHOOL.x + SCHOOL.w * 0.34, y: SCHOOL.y - SCHOOL.h * 0.2 - 12 };

/** 하루의 어디쯤인지 */
const TIME_WORD = [
  { until: 10, word: '아침', line: '햇님이 이제 막 올라왔어요' },
  { until: 15, word: '낮', line: '햇님이 가장 높이 떠 있어요' },
  { until: 24, word: '저녁', line: '햇님이 내려가고 있어요' },
];

interface ElementaryClockProps {
  stats: EduStats;
  content: PictureContent;
  nowHour: number;
}

/**
 * 시각을 길 위의 각도로. 해 뜨는 때가 왼쪽 지평선, 지는 때가 오른쪽 지평선이다.
 * 0도가 오른쪽이고 위로 갈수록 커지는 수학 좌표를 쓰므로, 180도에서 시작해 0도로 내려간다.
 */
function angleOf(hour: number): number {
  const ratio = Math.min(1, Math.max(0, (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)));

  return 180 - ratio * 180;
}

/** 각도 하나를 길 위의 좌표로. SVG 는 y 가 아래로 자라므로 사인을 빼서 올린다 */
function pointAt(angle: number) {
  const rad = (angle * Math.PI) / 180;

  return {
    x: VIEW.w / 2 + Math.cos(rad) * TRACK,
    y: ARC_CY - Math.sin(rad) * TRACK,
  };
}

/**
 * 초등 시안 b — 하루 한 바퀴 (SFR-005-01/02/03/04/05/06/07/08).
 *
 * 시안 a 는 이야기를 걸음으로 나눠 차례로 보여 준다. 잘 읽히지만 기다려야 한다 —
 * 아이가 복도에서 화면 앞에 머무는 시간은 몇 초이고, 그 몇 초에 걸린 걸음 하나만 보고 지나간다.
 *
 * 이 시안은 기다리게 하지 않는다. 왼쪽에 하루 한 바퀴를 길로 그려 햇님을 지금 자리에 세우고,
 * 오른쪽과 아래에 「무엇이 좋아졌나」 와 「왜 좋은가」 를 처음부터 펼쳐 둔다. 언제 와서 봐도
 * 화면이 말하려는 것 전부가 거기 있다.
 *
 * 아침에 본 것과 하교할 때 본 것이 다르다는 사실 자체가 이 나이에게는 배움이 된다 —
 * 해가 움직인다는 것을 화면이 증명해 준다. 지나온 길에는 빛이 남고, 남은 길은 아직 비어 있다.
 */
export function ElementaryClock({ stats, content, nowHour }: ElementaryClockProps) {
  // 도 전체를 합치면 kW 로는 다섯 자리를 넘긴다 — 자릿수가 커지면 MW·GW 로 올려 적는다.
  const output = scaleSi(stats.outputKw, 'W');
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;
  const angle = angleOf(nowHour);
  const sunAt = pointAt(angle);
  const start = pointAt(180);
  const end = pointAt(0);
  const track = `M${start.x} ${start.y} A ${TRACK} ${TRACK} 0 0 1 ${end.x} ${end.y}`;

  /*
    해에서 옥상으로 내려오는 빛줄기.

    해 한가운데에서 그으면 줄기가 해 얼굴을 뚫고 나온다. 닿는 곳을 향한 방향으로 반지름만큼
    걸어 나가 **해의 가장자리**에서 시작해야 빛이 해에서 뻗어 나오는 것으로 보인다.
  */
  const toRoof = { x: LANDING.x - sunAt.x, y: LANDING.y - sunAt.y };
  const reach = Math.hypot(toRoof.x, toRoof.y) || 1;
  const rayFrom = {
    x: sunAt.x + (toRoof.x / reach) * (SUN_R + 10),
    y: sunAt.y + (toRoof.y / reach) * (SUN_R + 10),
  };

  const time = TIME_WORD.find((item) => nowHour < item.until) ?? TIME_WORD[TIME_WORD.length - 1];
  const word = isDay ? time.word : '쿨쿨';
  const line = isDay ? time.line : '햇님이 자는 동안에는 전기를 만들지 않아요';

  return (
    <div className={styles.board}>
      <div className={styles.top}>
        {/* 왼쪽 — 햇님이 지금 어디 있나 */}
        <section className={styles.clock}>
          <div className={styles.headRow}>
            <p className={styles.head}>햇님이 어디 있나요</p>

            {/*
              지금 얼마나 만들고 있는지 (SFR-005-01).

              전에는 화면 맨 아래에 전구 열 칸을 두고 그중 몇 칸이 켜졌는지로 말했다. 세어서 알
              수 있으니 이 나이에 맞는 방식이라 보았는데, 실제로 걸어 보니 **무엇을 세고 있는 건지**가
              전해지지 않았다 — 열 칸이 설비 최대라는 약속이 그림 어디에도 없어서, 전구는 그저
              화면 아래 놓인 장식이 됐다.

              이 판은 위쪽 수치 띠를 달지 않으므로, 이 한 줄이 그것을 말하는 유일한 자리다.
              세 시안이 모두 같은 자리에 같은 모양으로 둔다.
            */}
            <p className={styles.now}>
              지금 만들고 있어요
              <strong>{formatNumber(output.amount, output.fractionDigits)}{output.unit}</strong>
            </p>
          </div>

          <div className={styles.clock__canvas}>
            <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} fill="none" role="img" aria-label={`${word}. ${line}`} preserveAspectRatio="xMidYMid meet">
              {/*
                해가 하루 동안 지나는 길.

                세 겹으로 긋는다 — 테두리, 아직 가지 않은 흰 길, 그리고 지나온 노란 길.
                테두리가 있어야 흰 길이 하늘 위에서 형태를 갖는다. 하늘색이 시각마다 바뀌는 화면이라
                테두리 없이 흰 선만 두면 아침에는 보이고 저녁에는 사라진다.

                지나온 쪽과 아직인 쪽을 **채움 여부**로만 가른다. 점선이나 옅은 색으로 가르면
                둘 다 「선」 으로 보여 어디까지 왔는지가 읽히지 않는다.
              */}
              <path d={track} stroke="var(--brand-contrast)" strokeWidth="30" strokeLinecap="round" strokeOpacity="0.18" />
              <path d={track} stroke="var(--surface)" strokeWidth="24" strokeLinecap="round" />

              {isDay ? (
                <path
                  className={styles.trail}
                  d={`M${start.x} ${start.y} A ${TRACK} ${TRACK} 0 0 1 ${sunAt.x} ${sunAt.y}`}
                  stroke="var(--solar)"
                  strokeWidth="24"
                  strokeLinecap="round"
                />
              ) : null}

              <path d={`M0 ${HORIZON}h${VIEW.w}`} stroke="var(--brand-contrast)" strokeWidth="6" strokeLinecap="round" />

              {/*
                길 아래 우리 학교 — 이 하루가 어디의 하루인지 그림이 말한다.
                옥상 판이 길과 부딪히지 않을 만큼만 키운다. 주인공은 햇님이고 학교는 그 아래 무대다.
              */}
              <PictureSchool {...SCHOOL} lit={stats.loadRatio > 0 || !isDay} />

              {/*
                햇님이 하는 일.

                해가 길 위 어디쯤에 있는지만 보이고 **그것이 무엇을 하는지**는 보이지 않는 화면이었다 —
                시계는 시각을 말할 뿐이라, 해가 지붕에 빛을 내려 주고 그 빛이 전기가 되어 교실로
                내려간다는 이 화면의 본론이 그림에서 빠져 있었다.

                빛줄기는 해가 움직이면 따라 기울고, 전선은 옥상에서 벽을 타고 창 아래로 들어간다.
                해가 자는 동안에는 둘 다 두지 않는다 — 밤에도 알갱이가 굴러가면 거짓말이 된다.
              */}
              {isDay ? (
                <g>
                  <PictureFlow
                    d={`M${rayFrom.x.toFixed(1)} ${rayFrom.y.toFixed(1)} L ${LANDING.x} ${LANDING.y}`}
                    color="var(--solar)"
                    dots={4}
                  />
                  <PictureFlow
                    d={`M${SCHOOL.x - 8} ${SCHOOL.y - 12} L ${SCHOOL.x - 32} ${SCHOOL.y - 12} L ${SCHOOL.x - 32} ${SCHOOL.y + SCHOOL.h * 0.88} L ${SCHOOL.x + SCHOOL.w * 0.1} ${SCHOOL.y + SCHOOL.h * 0.88}`}
                    color="var(--ok)"
                    dots={3}
                  />
                </g>
              ) : null}

              {/*
                햇님.
                해가 진 뒤에는 길에서 내려 지평선 오른쪽 끝에 눕혀 재운다. 길 위 어딘가에 어정쩡하게
                남겨 두면 「아직 낮인가?」 로 읽히고, 아예 지우면 화면에서 주인공이 사라진다.
              */}
              <PictureSun
                cx={isDay ? sunAt.x : end.x}
                cy={isDay ? sunAt.y : HORIZON - SUN_R * 0.4}
                r={SUN_R}
                asleep={!isDay}
              />
            </svg>
          </div>

          <PictureWord word={word} line={line} />
        </section>

        {/* 오른쪽 — 그래서 무엇이 좋아졌나 */}
        <section className={styles.gifts}>
          <p className={styles.head}>{content.chapters[1].label}</p>

          <ul className={styles.gifts__list}>
            {content.gifts.map((gift) => (
              <li key={gift.id} className={styles.gift}>
                <span className={styles.gift__art}>
                  <PictureGiftArt id={gift.id} />
                </span>

                <span className={styles.gift__text}>
                  <span className={styles.gift__name}>{gift.name}</span>
                  {/* 수는 굴려 올리지 않는다 — 무인 화면에서 첫 프레임이 늦으면 「0」 이 굳는다 */}
                  <strong className={styles.gift__value}>
                    {formatNumber(gift.value(stats).amount, gift.value(stats).fractionDigits)}
                    {gift.value(stats).countSuffix}
                    <span className={styles.gift__unit}>{gift.value(stats).unit}</span>
                  </strong>
                  <span className={styles.gift__line}>{gift.line}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 아래를 가로지르는 좋은 점 넷 — 어느 시안에서도 원리와 이유가 화면을 떠나지 않는다 */}
      <section className={styles.goods}>
        <p className={styles.head}>{content.chapters[2].label}</p>

        <ul className={styles.goods__list}>
          {content.goods.map((good) => (
            <li key={good.id} className={styles.good}>
              <span className={styles.good__art}>
                <PictureGoodArt id={good.id} />
              </span>

              {/*
                이름 아래에 까닭 한 줄 (2026-09-07 지시).
                이름만 세워 두면 「조용해요」 가 표어로 읽히고 만다 — 왜 그런지가 붙어야 아이가
                가져갈 것이 생긴다.
              */}
              <span className={styles.good__text}>
                <strong className={styles.good__name}>{good.name}</strong>
                <span className={styles.good__why}>{good.line}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
