import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SolarEduLayout } from '@/layouts/SolarEduLayout';
import { DayCurvePanel } from '@/components/solar-edu/DayCurvePanel';
import { EDU_LEVEL_LABEL, EDU_LEVELS, getEduContent, resolveEduLevel } from '@/mocks/eduContent';
import { ElementaryBoard } from '@/components/solar-edu/ElementaryBoard';
import { HeadlineStrip } from '@/components/solar-edu/HeadlineStrip';
import { ImpactPanel } from '@/components/solar-edu/ImpactPanel';
import { JourneyPanel } from '@/components/solar-edu/JourneyPanel';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SkyBackdrop } from '@/components/solar-edu/SkyBackdrop';
import { SunPathPanel } from '@/components/solar-edu/SunPathPanel';
import { buildEduStats } from '@/mocks/solarEdu';
import { getDayWeather } from '@/mocks/weather';
import { getNode } from '@/mocks/tree';
import { getSchoolById, SCHOOLS } from '@/mocks/schools';
import { buildPath } from '@/routes/buildPath';
import { PATH } from '@/routes/routes';
import { formatNumber } from '@/utils/format';
import { TODAY } from '@/mocks/today';
import { useAutoPager } from '@/hooks/useAutoPager';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import styles from './SolarEdu.module.scss';

/** 계측값을 다시 읽는 주기 (SFR-005-09) */
const REFRESH_MS = 60_000;

/** 티커 문구를 바꾸는 주기 */
const FACT_MS = 11_000;

const TIME_ZONE = 'Asia/Seoul';

/** 눈높이를 학교급에 맡기는 값 — 세그먼트에서 고르면 `?level=` 이 붙는다. */
const AUTO = 'auto';

const LEVEL_OPTIONS = [
  { value: AUTO, label: '자동' },
  ...EDU_LEVELS.map((level) => ({ value: level, label: EDU_LEVEL_LABEL[level] })),
];

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

const hourFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * 한국 시각을 소수 시간으로 바꾼다 (14시 15분 → 14.25).
 * 화면의 "지금" 표시가 벽시계를 따라가려면 이 값이 있어야 한다 — 보는 사람이 어느 시간대에
 * 있든 한국 기준이어야 하므로 `getHours()` 대신 서식기로 뽑는다.
 */
function kstHourOf(date: Date): number {
  const parts = hourFormat.formatToParts(date);
  const read = (type: 'hour' | 'minute') => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return read('hour') + read('minute') / 60;
}

/**
 * 학생 교육용 태양광 대시보드 (SFR-005).
 *
 * 복도·강당 모니터에 걸어 두고 아무도 조작하지 않는 화면이라, 페이지를 넘기지 않고
 * 한 화면에 담았다. 운영 지표 대신 "지금 얼마나 만들고 있고, 그게 무슨 뜻인지" 만 남기고,
 * 전기가 되는 과정만 오른쪽에서 한 단계씩 스스로 넘어간다.
 *
 * 로그인 없이 들어오므로 조회 대상은 URL 의 `orgId` 로만 정한다 — 없으면 도 전체다.
 */
function SolarEduPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  // 수동으로 고른 눈높이는 URL 에 남긴다 — 모니터에 걸어 두는 화면이라 새로고침에도 살아 있어야 한다.
  const [searchParams, setSearchParams] = useSearchParams();
  const levelParam = searchParams.get('level');
  // 화면을 주기적으로 되그린다. 실제 API 로 바뀌면 이 틱이 재조회 시점이 된다 (SFR-005-09).
  useAutoRefresh(REFRESH_MS);

  // 시계도 "지금" 표시도 이 값 하나를 본다. 30초마다 갱신해 벽시계와 어긋나지 않게 한다.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const node = useMemo(() => getNode(orgId), [orgId]);
  const nowHour = kstHourOf(now);
  const stats = useMemo(() => buildEduStats(node, nowHour), [node, nowHour]);
  const weather = useMemo(() => getDayWeather(node.plantId, TODAY.toDate()).kind, [node]);

  // 상황판은 학교마다 걸린다 — 어느 학교를 띄울지 여기서 고른다 (회의 결정).
  const plant = node.plantId ? getSchoolById(node.plantId) : null;
  // 학교급이 곧 눈높이다. 화면에서 고른 값이 있으면 그쪽이 이긴다 (SFR-005-04).
  const level = resolveEduLevel(plant, levelParam);
  const content = getEduContent(level);
  // 초등 판은 패널을 줄여 다시 짠 자리라, 본문 구성 자체가 갈린다.
  const isKid = level === 'elementary';
  const large = content.emphasis === 'large';

  // 한 줄씩 넘기는 것도 쪽 넘김이라, 관제 화면과 같은 장치를 쓴다 — 눌러서 되돌려 볼 수 있다.
  // 문구 수가 눈높이마다 달라, 총 수를 여기에 매어 둬야 인덱스가 범위를 벗어나지 않는다.
  const fact = useAutoPager({ total: content.facts.length, perPage: 1, intervalMs: FACT_MS });
  const scopeInfo = plant
    ? `설비용량 ${formatNumber(plant.capacityKw, 1)}kW · 인버터 ${plant.inverterCount}대 · ${plant.installedAt} 설치`
    : `관내 ${formatNumber(SCHOOLS.length)}개 학교를 합쳐서 봅니다`;

  return (
    <SolarEduLayout
      scopeLabel={node.fullName}
      scopeInfo={scopeInfo}
      scopePicker={(
        <select
          className={styles.schoolPicker}
          value={node.plantId ?? ''}
          aria-label="학교 고르기"
          onChange={(event) => {
            const base = event.target.value ? buildPath.solarEdu(event.target.value) : PATH.SOLAR_EDU;

            // 고정해 둔 눈높이는 학교를 옮겨도 따라간다.
            navigate(levelParam ? `${base}?level=${levelParam}` : base);
          }}
        >
          <option value="">충청남도 전체</option>
          {SCHOOLS.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      )}
      backdrop={isKid ? <SkyBackdrop nowHour={nowHour} /> : undefined}
      levelPicker={(
        <SegmentedControl
          value={levelParam ?? AUTO}
          onChange={(value) => {
            // 자동은 쿼리를 지워 학교급 매핑으로 되돌린다.
            setSearchParams(value === AUTO ? {} : { level: value }, { replace: true });
          }}
          options={LEVEL_OPTIONS}
          label="눈높이 고르기"
          size="sm"
        />
      )}
      weather={weather}
      isLive={stats.isLive}
      clock={timeFormat.format(now)}
      date={dateFormat.format(now)}
      headline={<HeadlineStrip stats={stats} content={content.headline} large={large} />}
      facts={content.facts}
      factIndex={fact.page}
      onSelectFact={fact.goTo}
    >
      {isKid ? (
        <ElementaryBoard scopeLabel={node.fullName} stats={stats} content={content} />
      ) : (
        <div className={styles.grid}>
          <div className={styles.main}>
            <SunPathPanel stats={stats} content={content.sunPath} large={large} />
            <DayCurvePanel stats={stats} content={content.day} large={large} />
            <ImpactPanel scopeLabel={node.fullName} stats={stats} content={content.impact} large={large} />
          </div>

          <JourneyPanel stats={stats} content={content.journey} />
        </div>
      )}
    </SolarEduLayout>
  );
}

export default SolarEduPage;
