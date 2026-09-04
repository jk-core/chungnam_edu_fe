import { AIRCON_WATT } from '@/mocks/eduElementary';
import { kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import { formatNumber, formatSi } from '@/utils/format';
import type { ElementaryContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { BenefitScene } from '../../scene-art/BenefitScene';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { JourneyScene } from '../../scene-art/JourneyScene';
import styles from './HighPoster.module.scss';

/** 값과 단위를 한 덩이로. 도 전체를 합치면 kW·kWh 로는 칸을 넘어 M·G 로 올린다. */
function siText(kilo: number, suffix: 'W' | 'Wh') {
  const { value, unit } = formatSi(kilo, suffix);

  return `${value}${unit}`;
}

/** 걸음을 이 값으로 못 박아 그림의 네 마디를 처음부터 모두 켠다 */
const ALL_STEPS = 3;

interface HighPosterProps {
  stats: EduStats;
  content: ElementaryContent;
  nowHour: number;
}

/**
 * 초등 판 · 시안 D — 한 장 그림 (SFR-005-01/03/05/06).
 *
 * 현행 시안은 한 번에 한 가지만 보여 주고 말풍선으로 이야기한다. 잘 읽히지만 **기다려야** 한다 —
 * 쉬는 시간에 잠깐 서서 보는 아이는 넷 중 한 장면만 보고 지나간다.
 *
 * 이 시안은 기다리게 하지 않는다. 해부터 교실까지, 그리고 태양광이 왜 좋은지까지 전부 한 장에 펼쳐
 * 벽보처럼 세운다. 말풍선이 옮겨 다니지 않으니 아이가 보고 싶은 곳을 먼저 보고, 읽고 싶은 만큼만 읽는다.
 * 그림은 여전히 살아 움직이지만 **순서를 정해 주지 않는** 것이 이 시안이 앞의 것들과 다른 점이다.
 */
export function HighPoster({ stats, content, nowHour }: HighPosterProps) {
  /*
    그림의 네 마디.

    값만 적으면 그림 아래 붙은 숫자표가 된다. 마디마다 **여기서 무슨 일이 일어나는지** 를 한 줄씩
    적어야 벽보가 설명이 된다 — 걸어 두는 화면의 목적이 태양광을 설명하는 것이기 때문이다.
  */
  const IMPACTS = [
    { id: 'tree', art: 'tree' as const, label: '소나무를 심은 효과', unit: '그루', value: (v: typeof stats) => kwhToTrees(v.dayKwh) },
    { id: 'aircon', art: 'aircon' as const, label: '에어컨 가동 시간', unit: '시간', value: (v: typeof stats) => (v.dayKwh * 1000) / AIRCON_WATT },
    { id: 'house', art: 'house' as const, label: '4인 가족이 쓸 수 있는 날', unit: '일', value: (v: typeof stats) => kwhToHouseholdDays(v.dayKwh) },
  ];

  const marks = [
    {
      id: 'sun',
      label: '햇빛',
      value: `${formatNumber((stats.irradianceNow / 1000) * 100)}점`,
      note: '일사강도',
      why: '해가 높이 뜰수록 빛이 패널에 똑바로 닿아 더 많이 만들어요',
    },
    {
      id: 'panel',
      label: '태양전지',
      value: siText(stats.capacityKw, 'W'),
      note: '설비용량',
      why: '햇빛을 받으면 패널 안에서 전기가 한 방향으로 흐르기 시작해요',
    },
    {
      id: 'inverter',
      label: '인버터',
      value: siText(stats.outputKw, 'W'),
      note: '실시간 출력',
      why: '패널이 만든 전기를 교실 콘센트에서 쓸 수 있게 바꿔 줘요',
    },
    {
      id: 'school',
      label: '교실',
      value: siText(stats.todayKwh, 'Wh'),
      note: '금일 발전량',
      why: '우리 학교가 그대로 써서 불을 켜고 선풍기를 돌려요',
    },
  ];

  return (
    <div className={styles.poster}>
      {/* 위 — 전기가 오는 길. 네 마디가 처음부터 전부 켜져 있다 */}
      <section className={styles.stage} aria-label="햇빛이 전기가 되어 교실에 오기까지">
        <h2 className={styles.stage__title}>햇빛이 전기가 되기까지</h2>

        <div className={styles.stage__canvas}>
          <JourneyScene step={ALL_STEPS} nowHour={nowHour} loadRatio={stats.loadRatio} />
        </div>

        {/*
          그림 아래 숫자 띠.
          그림 위에 배지를 얹으면 마디마다 자리가 달라 글씨가 겹치거나 그림을 가린다.
          같은 순서로 아래에 늘어놓으면 눈이 그림과 띠를 오르내리며 짝을 맞춘다.
        */}
        <ul className={styles.marks}>
          {marks.map((mark, index) => (
            <li key={mark.id} className={styles.mark}>
              <span className={styles.mark__no}>{index + 1}</span>
              <span className={styles.mark__label}>{mark.label}</span>
              <strong className={styles.mark__value}>{mark.value}</strong>
              <span className={styles.mark__note}>{mark.note}</span>
              <p className={styles.mark__why}>{mark.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.bottom}>
        {/* 왼쪽 아래 — 그래서 무엇이 좋아졌나 */}
        <section className={styles.numbers} aria-label="금일 발전량으로 할 수 있는 일">
          <h2 className={styles.stage__title}>이만큼 할 수 있어요</h2>

          {/*
            숫자만 늘어놓으면 표가 된다. 그림을 앞에 세우면 무엇에 빗댄 수인지가 읽기 전에
            먼저 들어온다 — 시안 B 의 환산 판이 쓰는 방식을 그대로 가져왔다.
          */}
          <ul className={styles.numbers__list}>
            {IMPACTS.map((item) => (
              <li key={item.id} className={styles.impact}>
                <span className={styles.impact__art}>
                  <ImpactArt id={item.art} />
                </span>
                <span className={styles.impact__text}>
                  <span className={styles.impact__label}>{item.label}</span>
                  <strong className={styles.impact__value}>
                    {formatNumber(item.value(stats))}
                    <span className={styles.impact__unit}>{item.unit}</span>
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 오른쪽 아래 — 태양광이 왜 좋은가. 넷을 한 번에 세우고 이름만 붙인다 */}
        <section className={styles.benefits} aria-label="태양광의 좋은 점">
          <h2 className={styles.stage__title}>태양광이 왜 좋을까요</h2>

          <div className={styles.benefits__canvas}>
            {/*
              어느 하나를 흐리게 두지 않는다.
              말풍선이 없으니 초점을 옮길 이유가 없고, 넷이 똑같이 또렷해야 한 장 그림이 된다.
            */}
            <BenefitScene focus="free" />
          </div>

          <ul className={styles.benefits__list}>
            {content.benefits.map((benefit) => (
              <li key={benefit.id}>
                <strong>{benefit.title}</strong>
                {benefit.line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
