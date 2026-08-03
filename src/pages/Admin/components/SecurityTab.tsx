import { useMemo } from 'react';
import { ACCESS_LOGS, getLoginTrend, SECURITY_EVENTS } from '@/mocks/security';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { AccessLog } from '@/interface/security';
import type { Column } from '@/components/common/Table';
import styles from '../Admin.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Pretendard Variable, sans-serif' };

/** 보안 관제 (SER-001-19) — 접속 현황과 이상 징후를 한 화면에서 본다. */
export function SecurityTab() {
  const palette = useChartPalette();
  const trend = useMemo(() => getLoginTrend(14), []);

  const failTotal = trend.reduce((sum, point) => sum + point.fail, 0);
  const openEvents = SECURITY_EVENTS.filter((event) => !event.handled);

  const failOption: EChartsOption = {
    grid: { top: 10, right: 16, bottom: 24, left: 34 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: trend.map((point) => point.date.slice(5)),
      axisLabel: { color: palette.textMuted, ...AXIS_FONT },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: palette.textMuted, ...AXIS_FONT },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    series: [
      {
        name: '로그인 실패',
        type: 'bar',
        barWidth: 10,
        itemStyle: { borderRadius: [3, 3, 0, 0], color: palette.critical },
        data: trend.map((point) => point.fail),
      },
    ],
  };

  const columns: Column<AccessLog>[] = [
    { key: 'at', header: '시각', width: '140px', render: (row) => row.at },
    {
      key: 'user',
      header: '사용자',
      width: '160px',
      render: (row) => (
        <>
          <strong>{row.userName}</strong>
          <span className={styles.toolbar__note}> · {row.userId}</span>
        </>
      ),
    },
    { key: 'ip', header: '접속 IP', width: '130px', hideOnTablet: true, render: (row) => row.ip },
    { key: 'menu', header: '화면', render: (row) => row.menu },
    {
      key: 'action',
      header: '행위',
      width: '100px',
      render: (row) => (
        <Badge tone={row.action === '내려받기' || row.action === '수정' ? 'caution' : 'neutral'}>{row.action}</Badge>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <Reveal>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          <StatCard label="14일 로그인 실패" value={failTotal} unit="회" />
          <StatCard label="미조치 보안 이벤트" value={openEvents.length} unit="건" />
          <StatCard label="접속 기록" value={ACCESS_LOGS.length} unit="건" />
        </div>
      </Reveal>

      <div className={styles.grid2}>
        <Reveal delay={0.05}>
          <Card
            eyebrow="Events"
            title="보안 이벤트"
            description="탐지 규칙에 걸린 순서대로 쌓입니다. 미조치 건부터 확인하세요."
          >
            <div className={styles.history}>
              {SECURITY_EVENTS.map((event) => (
                <div key={event.id} className={`${styles.event} ${styles[`event--${event.severity}`]}`}>
                  <div className={styles.event__body}>
                    <p className={styles.event__head}>
                      <Badge tone={SEVERITY_TONE[event.severity]} withDot>
                        {SEVERITY_LABEL[event.severity]}
                      </Badge>
                      <span className={styles.event__title}>{event.title}</span>
                      <span className={styles.event__at}>{event.at}</span>
                      {event.handled ? <Badge tone="ok">조치됨</Badge> : <Badge tone="critical">미조치</Badge>}
                    </p>
                    <p className={styles.event__detail}>{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card eyebrow="Fail" title="일별 로그인 실패" description="갑자기 튀는 날은 계정 공격을 의심합니다.">
            <EChart
              option={failOption}
              height={300}
              summary={`최근 14일 로그인 실패 합계 ${formatNumber(failTotal)}회.`}
            />
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Card
          eyebrow="Access"
          title="접속 로그"
          description="내려받기·수정처럼 민감한 행위는 색으로 구분합니다."
        >
          <Table caption="사용자 접속 로그" columns={columns} rows={ACCESS_LOGS.slice(0, 20)} getRowKey={(row) => row.id} />
        </Card>
      </Reveal>
    </div>
  );
}
