import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SolarEduLayout } from '@/layouts/SolarEduLayout';
import { CurveScene } from '@/components/solar-edu/CurveScene';
import { HeadlineStrip } from '@/components/solar-edu/HeadlineStrip';
import { MeaningScene } from '@/components/solar-edu/MeaningScene';
import { PrincipleScene } from '@/components/solar-edu/PrincipleScene';
import { buildEduStats, EDU_FACTS, SCENES } from '@/mocks/solarEdu';
import { getDayWeather } from '@/mocks/weather';
import { getNode } from '@/mocks/tree';
import { TODAY } from '@/mocks/today';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import sceneStyles from '@/components/solar-edu/SolarEdu.module.scss';
import styles from './SolarEdu.module.scss';

/** 한 씬이 머무는 시간. 읽고 이해할 여유는 주되 지루해지기 전에 넘긴다. */
const SCENE_MS = 18_000;

/** 계측값을 다시 읽는 주기 (SFR-005-09) */
const REFRESH_MS = 60_000;

/** 티커 문구를 바꾸는 주기 */
const FACT_MS = 11_000;

const TIME_ZONE = 'Asia/Seoul';

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

/**
 * 학생 교육용 태양광 대시보드 (SFR-005).
 *
 * 복도·강당 모니터에 걸어 두고 아무도 조작하지 않는 화면이라 스스로 돌아간다.
 * 위쪽은 고정으로 지금 이 순간의 수치를 물고 있고, 중앙부터 아래만 씬이 갈린다.
 * 로그인 없이 들어오므로 조회 대상은 URL 의 `orgId` 로만 정한다 — 없으면 도 전체다.
 */
function SolarEduPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [sceneIndex, setSceneIndex] = useState(0);
  // 손으로 고를 때마다 올라가는 값. 순환 타이머를 처음부터 다시 돌리는 열쇠로 쓴다.
  const [restartKey, setRestartKey] = useState(0);
  const factIndex = useAutoRefresh(FACT_MS, EDU_FACTS.length);
  // 화면을 주기적으로 되그린다. 실제 API 로 바뀌면 이 틱이 재조회 시점이 된다 (SFR-005-09).
  useAutoRefresh(REFRESH_MS);

  const node = useMemo(() => getNode(orgId), [orgId]);
  const stats = useMemo(() => buildEduStats(node), [node]);
  const weather = useMemo(() => getDayWeather(node.plantId, TODAY.toDate()).kind, [node]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);

    return () => window.clearInterval(timer);
  }, []);

  // 씬 순환. restartKey 가 바뀌면 타이머를 새로 걸어, 손으로 고른 씬이 곧바로 넘어가지 않는다.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((prev) => (prev + 1) % SCENES.length);
    }, SCENE_MS);

    return () => window.clearInterval(timer);
  }, [restartKey]);

  const selectScene = useCallback((index: number) => {
    setSceneIndex(index);
    setRestartKey((prev) => prev + 1);
  }, []);

  const scene = SCENES[sceneIndex];

  return (
    <SolarEduLayout
      scopeLabel={node.fullName}
      scenes={SCENES}
      sceneIndex={sceneIndex}
      sceneMs={SCENE_MS}
      weather={weather}
      isLive={stats.isLive}
      clock={timeFormat.format(now)}
      date={dateFormat.format(now)}
      headline={<HeadlineStrip stats={stats} />}
      onSelectScene={selectScene}
      progressKey={restartKey * SCENES.length + sceneIndex}
      fact={EDU_FACTS[factIndex]}
    >
      {/*
        제목과 본문이 한 덩어리로 미끄러져 들어온다. 따로 두면 제목만 먼저 바뀐다.

        전환을 CSS 애니메이션으로 두는 데는 이유가 있다. AnimatePresence 로 나가는 씬을
        기다리게 하면, 문서가 가려져 rAF 가 멈춘 사이 exit 이 끝나지 않아 다음 씬이 영영
        들어오지 못하고 무대가 빈 채로 굳는다. 여기서는 앞 씬이 곧바로 빠지고
        새 씬만 미끄러져 들어오므로 화면이 비는 순간이 없다.
      */}
      <div
        key={scene.key}
        className={styles.slot}
      >
        <p className={sceneStyles.sceneHead}>
          <span className={sceneStyles.sceneHead__title}>{scene.title}</span>
          <span className={sceneStyles.sceneHead__question}>{scene.question}</span>
        </p>

        {scene.key === 'principle' ? <PrincipleScene stats={stats} /> : null}
        {scene.key === 'curve' ? <CurveScene stats={stats} /> : null}
        {scene.key === 'meaning' ? <MeaningScene scopeLabel={node.fullName} stats={stats} /> : null}
      </div>
    </SolarEduLayout>
  );
}

export default SolarEduPage;
