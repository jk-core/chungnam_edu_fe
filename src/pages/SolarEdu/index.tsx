import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SolarEduLayout } from '@/layouts/SolarEduLayout';
import { DayCurvePanel } from '@/components/solar-edu/DayCurvePanel';
import { HeadlineStrip } from '@/components/solar-edu/HeadlineStrip';
import { ImpactPanel } from '@/components/solar-edu/ImpactPanel';
import { JourneyPanel } from '@/components/solar-edu/JourneyPanel';
import { SunPathPanel } from '@/components/solar-edu/SunPathPanel';
import { buildEduStats, EDU_FACTS } from '@/mocks/solarEdu';
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
  // 한 줄씩 넘기는 것도 쪽 넘김이라, 관제 화면과 같은 장치를 쓴다 — 눌러서 되돌려 볼 수 있다.
  const fact = useAutoPager({ total: EDU_FACTS.length, perPage: 1, intervalMs: FACT_MS });
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
          onChange={(event) => navigate(event.target.value ? buildPath.solarEdu(event.target.value) : PATH.SOLAR_EDU)}
        >
          <option value="">충청남도 전체</option>
          {SCHOOLS.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      )}
      weather={weather}
      isLive={stats.isLive}
      clock={timeFormat.format(now)}
      date={dateFormat.format(now)}
      headline={<HeadlineStrip stats={stats} />}
      facts={EDU_FACTS}
      factIndex={fact.page}
      onSelectFact={fact.goTo}
    >
      <div className={styles.grid}>
        <div className={styles.main}>
          <SunPathPanel stats={stats} />
          <DayCurvePanel stats={stats} />
          <ImpactPanel scopeLabel={node.fullName} stats={stats} />
        </div>

        <JourneyPanel stats={stats} />
      </div>
    </SolarEduLayout>
  );
}

export default SolarEduPage;
