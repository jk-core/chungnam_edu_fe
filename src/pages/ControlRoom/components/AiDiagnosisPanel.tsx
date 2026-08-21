import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { formatDuration, formatNumber, formatPercent } from '@/utils/format';
import { getFaultCode, INVERTERS } from '@/mocks/equipment';
import { Modal } from '@/components/common/Modal';
import { Sparkline } from '@/components/common/Sparkline';
import type { CollectionStatus } from '@/interface/collection';
import type { DiagnosisFaultCode } from '@/interface/equipment';
import type { School } from '@/interface/energy';
import styles from './AiDiagnosisPanel.module.scss';

/** 화면이 한 박자 나아가는 간격(ms) */
const TICK_MS = 700;

/** 알림 한 건을 읽어 볼 시간 — 현상과 조치까지 눈으로 따라갈 만큼 준다 */
const ALERT_TICKS = 12;

/** 지금까지 분석한 계측값 — 박자마다 이만큼씩 늘어난다 */
const ANALYZED_BASE = 1_284_000;
const ANALYZED_STEP = 137;

/** 한 바퀴에 도는 알림 수. 이보다 많으면 한 건도 제대로 못 읽고 지나간다 */
const ALERT_LIMIT = 12;

/** 급한 순서 */
const SEVERITY_RANK = { critical: 0, caution: 1, info: 2 } as const;

/** 현상·조치는 각각 이만큼만 편다 — 판이 들썩이지 않게 줄 수를 붙박아 둔다 */
const LINE_LIMIT = 3;

/** 카드에 거는 참고 이미지 수 */
const SHOT_LIMIT = 2;

interface AiDiagnosisPanelProps {
  plants: School[];
  /** 발전소별 수집 현황 — 마지막 수신 시각이 판정의 근거가 된다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * AI 진단 — 검출된 고장코드 알림을 한 건씩 풀어 준다 (SFR-011-05 / SFR-013-06 / SFR-014-04).
 *
 * 상황판의 다른 판은 「몇 개소가 이상인가」 를 센다. 이 판만은 낱건을 붙잡고 **무엇이,
 * 어떤 계측값 때문에, 왜 그렇게 판정됐고, 무엇을 해야 하는지** 를 끝까지 적는다.
 * 벽에 걸어 두는 화면이라 아무도 누르지 않으므로 알림을 스스로 넘기며 순서대로 보여 준다.
 *
 * 진단이 쉬지 않고 돌고 있다는 것은 분석한 계측값 수와 흐르는 빛으로 말한다 —
 * 진행률처럼 끝나는 자리가 있는 표시는 두지 않는다.
 */
export function AiDiagnosisPanel({ plants, collection }: AiDiagnosisPanelProps) {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  /** 눌러서 크게 본 참고 이미지 — 판은 계속 돌아도 열어 둔 사진은 그대로 둔다 */
  const [zoom, setZoom] = useState<{ src: string; code: DiagnosisFaultCode; summary: string } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  /*
    고장코드가 붙은 인버터가 곧 알림 한 건이다.
    상태(경고·주의)만으로는 무엇이 잘못됐는지 말할 수 없고, 코드가 있어야 현상과 조치가 붙는다.
  */
  const alerts = useMemo(() => {
    const byId = new Map(plants.map((plant) => [plant.id, plant]));
    const found = INVERTERS
      .filter((inverter) => inverter.faultCode !== null && inverter.faultCode !== 0)
      .flatMap((inverter) => {
        const plant = byId.get(inverter.schoolId);
        const fault = getFaultCode(inverter.faultCode);

        return plant && fault ? [{ inverter, plant, fault }] : [];
      })
      .sort((a, b) => SEVERITY_RANK[a.fault.severity] - SEVERITY_RANK[b.fault.severity]
        || b.inverter.capacityKw - a.inverter.capacityKw);

    /*
      코드를 번갈아 세운다.

      급한 순서대로만 늘어놓으면 코드 7(인버터 정지)이 관내에 가장 많아 한 바퀴가 다 돌도록
      같은 화면만 지나간다. 코드별로 한 건씩 돌려 내면 관내에 어떤 고장이 있는지가 보인다.
      코드 안에서는 여전히 급하고 큰 설비가 먼저다.
    */
    const byCode = new Map<number, typeof found>();

    found.forEach((item) => {
      const bucket = byCode.get(item.fault.code) ?? [];

      bucket.push(item);
      byCode.set(item.fault.code, bucket);
    });

    const buckets = [...byCode.values()];
    const ordered: typeof found = [];

    for (let round = 0; ordered.length < ALERT_LIMIT; round += 1) {
      const picked = buckets.flatMap((bucket) => (bucket[round] ? [bucket[round]] : []));

      if (picked.length === 0) break;

      ordered.push(...picked.slice(0, ALERT_LIMIT - ordered.length));
    }

    return ordered;
  }, [plants]);

  const analyzed = ANALYZED_BASE + tick * ANALYZED_STEP;

  if (alerts.length === 0) {
    return (
      <div className={styles.diag}>
        <p className={styles.diag__empty}>검출된 고장코드 알림이 없습니다.</p>
      </div>
    );
  }

  const at = Math.floor(tick / ALERT_TICKS) % alerts.length;
  const { inverter, plant, fault } = alerts[at];
  const seen = collection.get(plant.id);
  const tone = SEVERITY_TONE[fault.severity];
  // 두 장까지만 건다 — 셋을 걸면 한 장이 우표만 해져 무엇을 찍은 사진인지 알아볼 수 없다.
  const shots = fault.images.slice(0, SHOT_LIMIT);

  /*
    판정 근거 — 코드를 그렇게 붙인 계측값을 그대로 적는다.
    「AI 가 그렇게 봤다」 로 끝나면 현장에서 확인할 것이 없다.
  */
  const evidence = [
    { label: '금일 발전량', value: `${formatNumber(inverter.todayKwh, 1)}kWh`, note: `설비 ${formatNumber(inverter.capacityKw, 1)}kW` },
    { label: '이용률', value: formatPercent(inverter.cf, 1), note: `관내 평균 ${formatPercent(plant.utilization, 1)}` },
    { label: '인버터 온도', value: `${formatNumber(inverter.temperature, 1)}℃`, note: fault.code === 7 ? '정상 범위 초과' : '정상 범위' },
    { label: '마지막 수신', value: seen ? `${formatDuration(seen.delayMinutes)} 전` : '수신 없음', note: `수집률 ${seen ? formatPercent(seen.rate, 1) : '—'}` },
  ];

  /*
    줄마다 조금씩 늦게 제자리를 찾아, 판정이 한 줄씩 적히는 것처럼 보이게 한다.

    투명도로 드러내지 않는 것은 벽 화면이 다른 탭에 가려지면 브라우저가 화면 갱신을 멈춰
    등장 애니메이션이 그대로 얼어 버리기 때문이다. 그때 투명도가 0 이면 판이 통째로 비어
    보인다. 자리만 움직이면 얼어도 내용은 그대로 읽힌다.
  */
  const line = (index: number) => (reduceMotion
    ? { duration: 0 }
    : { duration: 0.34, delay: 0.06 * index, ease: [0.22, 0.68, 0.32, 1] as const });

  return (
    <div className={styles.diag} data-tone={tone}>
      {/* 지켜보는 자리 — 빛이 쉬지 않고 가로지르고 분석한 계측값 수가 계속 오른다 */}
      <div className={styles.deck}>
        <span className={styles.deck__sweep} aria-hidden="true" />

        {/*
          계측 신호를 읽는 중임을 파형으로 말한다.
          숫자는 얼마나 읽었는지를, 파형은 지금도 들어오고 있다는 것을 보인다.
        */}
        <svg className={styles.deck__wave} viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true">
          <path
            className={styles.deck__waveLine}
            d="M0 26 L14 26 L20 12 L26 32 L32 20 L40 20 L48 26 L54 26 L60 8 L66 30 L74 22 L84 22 L92 26 L100 26 L106 14 L112 30 L120 24 L132 24 L140 26 L148 26 L154 10 L160 32 L168 20 L180 20 L188 26 L196 26 L202 16 L208 28 L216 22 L240 22"
          />
        </svg>

        <div className={styles.deck__head}>
          <AiOrbit size={34} active />
          <span className={styles.deck__title}>
            <span className={styles.deck__name}>실시간 이상 감지</span>
            <span className={styles.deck__note}>
              계측값 <strong>{formatNumber(analyzed)}</strong>건 분석 중
            </span>
          </span>
          <span className={styles.deck__live}>감시 중</span>
        </div>
      </div>

      <p className={styles.caption}>
        고장코드 알림
        <span className={styles.caption__count}>{at + 1} / {formatNumber(alerts.length)}건</span>
      </p>

      {/* 알림 한 건. 키가 바뀌면 새 카드를 세우고 줄마다 차례로 드러난다 */}
      <motion.article
        key={`${inverter.id}-${fault.code}`}
        className={styles.alert}
        initial={reduceMotion ? false : { y: -10 }}
        animate={{ y: 0 }}
        transition={line(0)}
      >
        <span className={styles.alert__scan} aria-hidden="true" />

        <motion.p className={styles.alert__top} initial={reduceMotion ? false : { y: 8 }} animate={{ y: 0 }} transition={line(1)}>
          <span className={styles.alert__code}>코드 {fault.code}</span>
          <span className={styles.alert__summary}>{fault.summary}</span>
          <Badge tone={tone} withDot>{SEVERITY_LABEL[fault.severity]}</Badge>
        </motion.p>

        <motion.p className={styles.alert__where} initial={reduceMotion ? false : { y: 8 }} animate={{ y: 0 }} transition={line(2)}>
          <span className={styles.alert__plant}>{plant.name}</span>
          <span className={styles.alert__device}>{inverter.name} · {formatNumber(inverter.capacityKw, 1)}kW</span>
          <span className={styles.alert__region}>{plant.regionName}</span>
        </motion.p>

        <motion.div className={styles.evidence} initial={reduceMotion ? false : { y: 10 }} animate={{ y: 0 }} transition={line(3)}>
          <p className={styles.evidence__head}>
            <span className={styles.evidence__title}>판정 근거</span>
            <span className={styles.evidence__trendLabel}>최근 7일 발전시간</span>
            <Sparkline
              values={inverter.hoursTrend}
              width={96}
              height={18}
              tone={fault.severity === 'critical' ? 'critical' : 'caution'}
              animate={false}
            />
          </p>

          <dl className={styles.evidence__grid}>
            {evidence.map((item) => (
              <div key={item.label} className={styles.evidence__item}>
                <dt className={styles.evidence__label}>{item.label}</dt>
                <dd className={styles.evidence__value}>{item.value}</dd>
                <dd className={styles.evidence__note}>{item.note}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div className={styles.detail} initial={reduceMotion ? false : { y: 10 }} animate={{ y: 0 }} transition={line(4)}>
          <p className={styles.detail__title}>현상</p>
          <ul className={styles.detail__list}>
            {/* 첫 줄이 코드 요약과 같은 말이면 빼고 그다음 줄을 편다 — 같은 말을 두 번 적지 않는다 */}
            {fault.description
              .filter((text) => text !== fault.summary)
              .slice(0, LINE_LIMIT)
              .map((text) => <li key={text} title={text}>{text}</li>)}
          </ul>
        </motion.div>

        <motion.div className={styles.detail} initial={reduceMotion ? false : { y: 10 }} animate={{ y: 0 }} transition={line(5)}>
          <p className={styles.detail__title}>권고 조치</p>
          <ul className={styles.detail__list}>
            {fault.plan.slice(0, LINE_LIMIT).map((text) => <li key={text} title={text}>{text}</li>)}
          </ul>
        </motion.div>

        {/*
          고장코드 참고 이미지 — 글로 적힌 현상이 실제로 어떤 모습인지 함께 보인다 (SFR-013-06).
          한 장이면 넓게, 두 장이면 나란히 건다. 비율은 두 경우 모두 같아 판이 들썩이지 않는다.
        */}
        {shots.length > 0 ? (
          <motion.figure
            className={styles.shot}
            data-count={shots.length}
            initial={reduceMotion ? false : { y: 10 }}
            animate={{ y: 0 }}
            transition={line(6)}
          >
            <span className={styles.shot__frames}>
              {shots.map((src) => (
                <button
                  key={src}
                  type="button"
                  className={styles.shot__frame}
                  onClick={() => setZoom({ src, code: fault.code, summary: fault.summary })}
                  aria-label={`고장코드 ${fault.code} 참고 이미지 크게 보기`}
                >
                  <img className={styles.shot__image} src={src} alt="" />
                </button>
              ))}
            </span>
            <figcaption className={styles.shot__caption}>
              고장코드 {fault.code} 참고 이미지 {shots.length}장 · 눌러서 크게 보기
            </figcaption>
          </motion.figure>
        ) : null}
      </motion.article>

      {zoom ? (
        <Modal
          isOpen
          onClose={() => setZoom(null)}
          size="lg"
          title={`고장코드 ${zoom.code} 참고 이미지`}
          description={zoom.summary}
        >
          <img className={styles.zoom} src={zoom.src} alt={`고장코드 ${zoom.code} 참고 이미지`} />
        </Modal>
      ) : null}

      {/* 몇 번째를 보고 있는지 — 순서대로 도는 판이라 자리 표시가 있어야 한다 */}
      <ol className={styles.dots} aria-hidden="true">
        {alerts.map((item, index) => (
          <li
            key={item.inverter.id}
            className={styles.dots__dot}
            data-state={index === at ? 'on' : undefined}
          />
        ))}
      </ol>
    </div>
  );
}
