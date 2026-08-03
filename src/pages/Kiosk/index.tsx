import { useParams } from 'react-router-dom';
import { CountUp } from '@/components/common/CountUp';
import { EcoConversion } from '@/components/kiosk/EcoConversion';
import { GrowingTree } from '@/components/kiosk/GrowingTree';
import { KIOSK_TIPS } from '@/mocks/kiosk';
import { KioskLayout } from '@/layouts/KioskLayout';
import { KioskRotator } from '@/components/kiosk/KioskRotator';
import { NOW_HOUR, TODAY } from '@/mocks/today';
import { getOutputAt, PEAK_OUTPUT, SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { REGION_TOTAL } from '@/mocks/regions';
import { SunScene } from '@/components/kiosk/SunScene';
import { getDayWeather, WEATHER_META } from '@/mocks/weather';
import { WeatherIcon } from '@/components/common/DataCalendar/WeatherIcon';
import { formatNumber } from '@/utils/format';
import { getSchoolById } from '@/mocks/schools';
import { growthStage } from '@/utils/eco';
import { isProducing } from '@/mocks/status';
import { kwhToTrees } from '@/utils/eco';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import styles from './Kiosk.module.scss';

/** 데이터 자동 갱신 주기 (SFR-005-09) */
const REFRESH_MS = 60_000;

/**
 * 교육청 산하기관 교육용 대시보드 (SFR-005).
 * `/kiosk/:orgId` 로 들어오면 그 학교 기준, 그냥 `/kiosk` 면 도 전체 기준으로 보여 준다.
 */
function KioskPage() {
  const { orgId } = useParams<{ orgId: string }>();
  // 갱신 신호. 실제로는 여기서 최신 수집값을 다시 읽는다.
  const tick = useAutoRefresh(REFRESH_MS);
  const tipIndex = tick % KIOSK_TIPS.length;

  const school = getSchoolById(orgId ?? null);
  const weather = getDayWeather(school?.id ?? null, TODAY.toDate());
  const capacityKw = school ? school.capacityKw : REGION_TOTAL.capacityKw;

  // 통신이 끊겼으면 마지막 정상 값을 그대로 두고 안내를 띄운다 (SFR-005-10).
  const isLive = !school || isProducing(school.status);
  const intensity = PEAK_OUTPUT.kw > 0 ? getOutputAt(NOW_HOUR) / PEAK_OUTPUT.kw : 0;
  const generationKwh = weather.generationKwh;
  const trees = kwhToTrees(generationKwh);
  // 하루 최대 5시간을 만점으로 삼아 나무 성장 단계를 정한다.
  const stage = growthStage(weather.generationHours / 5);

  return (
    <KioskLayout
      title={school ? `${school.name}가 만든 햇빛 전기` : '충남 학교들이 만든 햇빛 전기'}
      lead="지붕 위 태양광이 오늘 얼마나 일했는지 함께 봅니다."
    >
      <div className={styles.page}>
        {!isLive ? (
          <p className={styles.offline} role="status">
            지금 계측값이 들어오지 않아 마지막으로 받은 값을 보여 주고 있어요.
          </p>
        ) : null}

        <div className={styles.top}>
          <SunScene weather={weather.kind} intensity={isLive ? intensity : 0} />

          <div className={styles.today}>
            <p className={styles.today__label}>오늘 만든 전기</p>
            <p className={styles.today__value}>
              <CountUp value={generationKwh} startOnView={false} />
              <span className={styles.today__unit}>kWh</span>
            </p>
            <p className={styles.today__weather}>
              <WeatherIcon kind={weather.kind} size={22} />
              {WEATHER_META[weather.kind].label} · 햇빛을 {weather.generationHours.toFixed(1)}시간 모았어요
            </p>
          </div>
        </div>

        <EcoConversion generationKwh={generationKwh} />

        <div className={styles.bottom}>
          <div className={styles.treeWrap}>
            <GrowingTree stage={stage} trees={trees} />
            <p className={styles.treeWrap__caption}>
              오늘 만든 전기는 나무 {formatNumber(trees)}그루를 심은 것과 같아요.
              <br />
              해가 셀수록 나무가 더 자랍니다.
            </p>
          </div>

          <KioskRotator />
        </div>

        <p className={styles.tip} role="status">
          <WeatherIcon kind="clear" size={22} />
          {KIOSK_TIPS[tipIndex]}
        </p>

        <p className={styles.treeWrap__caption}>
          설비용량 {formatNumber(capacityKw, 1)}kW · 해는 {SUNRISE_HOUR.toFixed(1)}시에 떠서{' '}
          {SUNSET_HOUR.toFixed(1)}시에 집니다 · 1분마다 스스로 새로 읽어 옵니다
        </p>
      </div>
    </KioskLayout>
  );
}

export default KioskPage;
