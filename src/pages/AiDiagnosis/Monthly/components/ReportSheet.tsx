import dayjs from 'dayjs';
import { FAULT_CODES, getFaultCode } from '@/mocks/faultCodes';
import { formatDelta, formatNumber } from '@/utils/format';
import type { DiagnosisFaultCode } from '@/interface/equipment';
import type { FieldReport } from '@/interface/fieldReport';
import type { MonthlyReport } from '@/mocks/reports';
import { ReportPage } from '@/components/report/ReportPage';
import styles from '@/components/report/Report.module.scss';
import { DiagnosisChart, InverterHoursChart, StringEfficiencyChart, TrendChart } from './ReportCharts';

/*
  보고서 지면 조립 (SFR-019, SFR-020).

  장 수는 인버터 대수를 따른다 — 1장 개요, 2장 월간 발전 요약,
  3장부터 인버터마다 세부 진단 한 장, 그다음 조치방안, 마지막이 고장코드 원인·조치 표다.
  인버터가 4대면 8장이 된다.
*/

/** 인버터 세부 진단을 뺀 고정 장 수 (개요·요약·조치방안·현장 조치내역·고장코드표) */
const FIXED_PAGES = 5;

/** 세부 진단이 시작되는 쪽번호 */
const DETAIL_FROM = 3;

/** 고장 분류를 한눈에 보이게 하는 코드별 색 */
const CODE_COLOR: Record<DiagnosisFaultCode, string> = {
  0: '#1f9d55',
  1: '#0b57a4',
  2: '#7c3aed',
  3: '#d97706',
  4: '#0891b2',
  5: '#db2777',
  6: '#65a30d',
  7: '#334155',
};

/** 아직 진단이 돌지 않은 날 */
const IDLE_COLOR = '#eef2f8';

/*
  차트 높이는 장마다 다르다. 지면이 A4 로 고정이라 남는 자리를 실측해 나눠 담았다 —
  요약 장은 차트 둘이 크게 들어가고, 세부 진단 장은 표·히트맵과 자리를 나눈다.
*/
const SUMMARY_CHART = 430;
const DETAIL_CHART = 380;

export function pageCountOf(report: MonthlyReport): number {
  return FIXED_PAGES + report.inverterDiagnosis.length;
}

interface ReportSheetProps {
  report: MonthlyReport;
  /** 이 달에 이 발전소에서 올라온 현장보고서 (SFR-019-07, SFR-021-20) */
  fieldReports: FieldReport[];
}

export function ReportSheet({ report, fieldReports }: ReportSheetProps) {
  const total = pageCountOf(report);
  const title = `${report.schoolName} 월간 발전 보고서`;
  const period = `${report.year}년 ${report.month + 1}월`;
  const delta = report.previousKwh > 0 ? report.totalKwh / report.previousKwh - 1 : 0;
  const days = report.dailyCompare.length;
  const cursor = dayjs(new Date(report.year, report.month, 1));
  const span = `${cursor.format('YYYY년 MM월 DD일')} ~ ${cursor.endOf('month').format('YYYY년 MM월 DD일')}`;
  const plantHours = report.inverterHours.length > 0
    ? report.inverterHours.reduce((sum, item) => sum + item.hours, 0) / report.inverterHours.length
    : 0;

  const faultDays = report.faultByDay.reduce(
    (sum, item) => sum + item.codes.filter((code) => code > 0).length,
    0,
  );

  /* 어떤 고장이 어느 설비에서 며칠 잡혔는지 한 표로 모은다 — 장마다 흩어진 것을 마지막에 되짚는다. */
  const faultSummary = [...report.faultByDay
    .flatMap((item) => item.codes
      .filter((code) => code > 0)
      .map((code) => ({ code, name: item.name })))
    .reduce((map, item) => {
      const found = map.get(item.code) ?? { code: item.code, days: 0, names: new Set<string>() };

      found.days += 1;
      found.names.add(item.name);

      return map.set(item.code, found);
    }, new Map<DiagnosisFaultCode, { code: DiagnosisFaultCode; days: number; names: Set<string> }>())
    .values()]
    .map((item) => ({ ...item, names: [...item.names] }))
    .sort((a, b) => a.code - b.code);

  /* 이상으로 잡힌 점검 항목만 한 줄씩 편다 — 조치내역 표 아래에 근거로 붙는다. */
  const fieldAbnormal = fieldReports.flatMap((item) => item.checklist
    .filter((check) => check.result === 'abnormal')
    .map((check) => ({
      key: `${item.id}-${check.id}`,
      date: item.date,
      label: check.label,
      note: check.note,
    })));

  const page = { title, period, total };

  return (
    <>
      {/* 1장 — 개요 (SFR-019-01) */}
      <ReportPage {...page} page={1} heading="1. 개요">
        <Section no={1} title="발전소 정보">
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">발전소 이름</th>
                <td>{report.plantSummary.plantName}</td>
              </tr>
              <tr>
                <th scope="row">주소</th>
                <td>{report.plantSummary.address}</td>
              </tr>
              <tr>
                <th scope="row">담당 기관</th>
                <td>충청남도교육청 · {report.schoolName}</td>
              </tr>
              <tr>
                <th scope="row">비고</th>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section no={2} title="발전소 주요 구성">
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">인버터 모델명</th>
                <td>{report.plantSummary.inverterModel}</td>
              </tr>
              <tr>
                <th scope="row">인버터 개수</th>
                <td>{formatNumber(report.inverterHours.length)}대</td>
              </tr>
              <tr>
                <th scope="row">모듈 모델명</th>
                <td>{report.plantSummary.moduleModel}</td>
              </tr>
              <tr>
                <th scope="row">모듈 구성</th>
                <td>{report.plantSummary.moduleStructure}</td>
              </tr>
              <tr>
                <th scope="row">발전소 용량</th>
                <td>{formatNumber(report.plantSummary.capacityKw, 2)} kW</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section no={3} title="이번 달 한눈에">
          <div className={styles.summary}>
            <Metric label="금월 발전량" value={formatNumber(report.totalKwh)} unit="kWh" />
            <Metric label="전월 대비" value={formatDelta(delta)} unit="" />
            <Metric label="평균 발전시간" value={formatNumber(plantHours, 1)} unit="시간" />
            <Metric label="고장 분류 일수" value={formatNumber(faultDays)} unit="일" />
          </div>
        </Section>

        <Section no={4} title="진단 설명">
          <p className={styles.block__text}>
            이 보고서는 일사량과 모듈 온도를 바탕으로 산출한 기대 발전량과 실제 측정값을 비교해서,
            발전 성능과 저하 원인을 분석한 결과입니다. 인버터마다 한 장씩 진단 결과를 실었고,
            검출된 고장 분류는 마지막 장의 원인·조치방안 표에서 찾아볼 수 있습니다.
          </p>

          <div className={styles.notice}>
            <p className={styles.notice__head}>특이사항</p>
            <div className={styles.notice__list}>
              {NOTICES.map((item) => (
                <p key={item} className={styles.notice__item}>{item}</p>
              ))}
            </div>
          </div>
        </Section>
      </ReportPage>

      {/* 2장 — 월간 발전 요약 (SFR-019-02/03/04) */}
      <ReportPage {...page} page={2} heading="2. 월간 발전 요약">
        <Section no={1} title="발전 기간">
          <p className={styles.block__text}>{span}</p>
        </Section>

        <Section no={2} title="발전 정보">
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">발전소 월 발전량</th>
                <td>{formatNumber(report.totalKwh)} kWh</td>
              </tr>
              <tr>
                <th scope="row">발전소 평균 발전시간</th>
                <td>{formatNumber(plantHours, 1)} 시간</td>
              </tr>
              <tr>
                <th scope="row">전월 대비</th>
                <td>{formatDelta(delta)} (전월 {formatNumber(report.previousKwh)} kWh)</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section no={3} title="발전소 발전량 추이">
          <TrendChart report={report} height={SUMMARY_CHART} />
        </Section>

        <Section no={4} title="인버터별 발전시간">
          <InverterHoursChart report={report} height={SUMMARY_CHART} />
          <p className={styles.block__note}>
            참고사항: 다른 인버터와 발전시간 편차가 큰 인버터는 이상이 있을 수 있으므로 주의 깊은 점검이 필요합니다.
          </p>
        </Section>
      </ReportPage>

      {/* 3장부터 — 인버터 한 대에 한 장 (SFR-020-01/02/03) */}
      {report.inverterDiagnosis.map((diagnosis, index) => {
        const units = report.unitDiagnosis.filter((unit) => unit.parentId === diagnosis.id);
        const hours = report.inverterHours.find((item) => item.id === diagnosis.id);
        const faults = report.faultByDay.find((item) => item.id === diagnosis.id);
        const codes = faults?.codes ?? [];
        const gap = plantHours > 0 ? ((hours?.hours ?? 0) - plantHours) / plantHours : 0;

        return (
          <ReportPage
            key={diagnosis.id}
            {...page}
            page={DETAIL_FROM + index}
            heading="3. 세부 진단 결과"
            badge={diagnosis.name}
          >
            <Section no={1} title="진단 기간">
              <p className={styles.block__text}>{span}</p>
            </Section>

            <div className={styles.pair}>
              <Section no={2} title="인버터 정보">
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <th scope="row">구성</th>
                      <td>{units.length > 0 ? `${units.length}회로` : '회로 정보 없음'}</td>
                    </tr>
                    <tr>
                      <th scope="row">월 발전량</th>
                      <td>{formatNumber(hours?.kwh ?? 0)} kWh</td>
                    </tr>
                    <tr>
                      <th scope="row">인버터 이름</th>
                      <td>{diagnosis.name}</td>
                    </tr>
                  </tbody>
                </table>
              </Section>

              <Section no={3} title="발전 정보">
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <th scope="row">발전소 평균 발전시간</th>
                      <td>{formatNumber(plantHours, 1)} 시간</td>
                    </tr>
                    <tr>
                      <th scope="row">인버터 발전시간</th>
                      <td>{formatNumber(hours?.hours ?? 0, 1)} 시간</td>
                    </tr>
                    <tr>
                      <th scope="row">발전시간 편차</th>
                      <td>{formatDelta(gap)}</td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            </div>

            <Section no={4} title="발전 진단 그래프">
              <DiagnosisChart diagnosis={diagnosis} height={DETAIL_CHART} />
              {units.length > 0
                ? <StringEfficiencyChart units={units} days={days} height={DETAIL_CHART} />
                : null}
            </Section>

            <Section no={5} title="고장진단 결과">
              <FaultHeatmap codes={codes} span={span} />
            </Section>
          </ReportPage>
        );
      })}

      {/* 조치방안과 점검 안내 (SFR-019-06/07, SFR-020-04) */}
      <ReportPage {...page} page={total - 2} heading="4. 조치방안과 점검 안내">
        <Section no={1} title="조치방안 제안">
          <ol className={styles.list}>
            {report.recommendations.map((item) => (
              <li key={item} className={styles.list__item}>{item}</li>
            ))}
          </ol>
        </Section>

        <Section no={2} title="일상 점검 안내">
          <ol className={styles.list}>
            {report.routineGuides.map((item) => (
              <li key={item} className={styles.list__item}>{item}</li>
            ))}
          </ol>
        </Section>

        <Section no={3} title="검출된 고장 분류">
          {faultSummary.length === 0 ? (
            <p className={styles.block__text}>이번 달에 검출된 고장 분류가 없습니다.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">고장분류</th>
                  <th scope="col">증상</th>
                  <th scope="col">검출 설비</th>
                  <th scope="col">발생 일수</th>
                </tr>
              </thead>
              <tbody>
                {faultSummary.map((item) => (
                  <tr key={item.code}>
                    <td>{getFaultCode(item.code)?.label ?? `코드 ${item.code}`}</td>
                    <td>{getFaultCode(item.code)?.summary ?? '—'}</td>
                    <td>{item.names.join(', ')}</td>
                    <td>{formatNumber(item.days)}일</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section no={4} title="이번 달 진단 요약">
          <table className={`${styles.table} ${styles['table--right']}`}>
            <thead>
              <tr>
                <th scope="col">인버터</th>
                <th scope="col">정상 범위(kWh)</th>
                <th scope="col">측정값(kWh)</th>
                <th scope="col">고장 일수</th>
              </tr>
            </thead>
            <tbody>
              {report.inverterDiagnosis.map((item) => {
                const faults = report.faultByDay.find((fault) => fault.id === item.id);

                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{formatNumber(item.normalLow)} ~ {formatNumber(item.normalHigh)}</td>
                    <td>{formatNumber(item.actual)}</td>
                    <td>{formatNumber((faults?.codes ?? []).filter((code) => code > 0).length)}일</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      </ReportPage>

      {/*
        현장에서 실제로 무엇을 했는지 (SFR-019-07, SFR-021-20).
        위 4장이 "무엇을 하면 좋겠다"는 제안이라면, 이 장은 현장보고서에 적힌 "무엇을 했다"의 기록이다.
      */}
      <ReportPage {...page} page={total - 1} heading="5. 현장 조치내역" spread>
        <Section no={1} title="이번 달 현장 점검 조치">
          {fieldReports.length === 0 ? (
            <p className={styles.block__text}>
              이번 달에 확정된 현장보고서가 없습니다. 현장보고서를 제출하면 조치 내용이 여기에 함께 실립니다.
            </p>
          ) : (
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: '104px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '90px' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">점검일</th>
                  <th scope="col">점검 대상</th>
                  <th scope="col">이상</th>
                  <th scope="col">조치 내용</th>
                </tr>
              </thead>
              <tbody>
                {fieldReports.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.targetType}</td>
                    <td>{item.checklist.filter((check) => check.result === 'abnormal').length}건</td>
                    <td>{item.actionNote || '별도 조치 없음'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section no={2} title="이상으로 확인된 점검 항목">
          {fieldAbnormal.length === 0 ? (
            <p className={styles.block__text}>이상으로 확인된 점검 항목이 없습니다.</p>
          ) : (
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: '104px' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">점검일</th>
                  <th scope="col">항목 · 확인 내용</th>
                </tr>
              </thead>
              <tbody>
                {fieldAbnormal.map((item) => (
                  <tr key={item.key}>
                    <td>{item.date}</td>
                    <td>{item.label}{item.note ? ` — ${item.note}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </ReportPage>

      {/* 마지막 장 — 고장코드별 원인과 조치방안 (SFR-013-06, SFR-020-04) */}
      <ReportPage {...page} page={total} heading="6. 전력진단 고장코드의 원인과 조치방안" spread>
        <table className={styles.faultTable}>
          <colgroup>
            <col style={{ width: '88px' }} />
            <col />
            <col style={{ width: '116px' }} />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">판정</th>
              <th scope="col">주요 원인</th>
              <th scope="col">원인 사진</th>
              <th scope="col">조치방안</th>
            </tr>
          </thead>
          <tbody>
            {FAULT_CODES.map((fault) => (
              <tr key={fault.code}>
                <td className={styles.faultTable__verdict}>{fault.label}</td>
                <td>
                  <span className={styles.faultTable__list}>
                    {fault.description.map((line) => (
                      <span key={line} className={styles.faultTable__item}>{line}</span>
                    ))}
                  </span>
                </td>
                <td className={styles.faultTable__photo}>
                  {fault.images[0] ? (
                    <img className={styles.faultTable__image} src={fault.images[0]} alt="" />
                  ) : '—'}
                </td>
                <td>
                  <span className={styles.faultTable__list}>
                    {fault.plan.map((line) => (
                      <span key={line} className={styles.faultTable__item}>{line}</span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPage>
    </>
  );
}

/** 진단 결과를 읽을 때 함께 알아야 할 것들 */
const NOTICES = [
  '일사량계의 설치 각도나 등급에 따라 기대 발전량과 오차가 생길 수 있습니다.',
  '모듈 온도 센서의 설치 위치에 따라 온도 값이 어레이 전체를 대표하지 못할 수 있습니다.',
  '어레이에 수목·구조물 그림자가 지면 기대 발전량과 오차가 생길 수 있습니다.',
  '이 보고서는 고장이 의심되는 부분을 알려 주는 참고 자료입니다. 실제 고장 여부는 현장 점검으로 확인하세요.',
];

interface MetricProps {
  label: string;
  value: string;
  unit: string;
}

/** 지면 위쪽에 놓는 요약 지표 한 칸 */
function Metric({ label, value, unit }: MetricProps) {
  return (
    <div className={styles.metric}>
      <span className={styles.metric__label}>{label}</span>
      <span className={styles.metric__value}>
        {value}
        {unit ? <span className={styles.metric__unit}>{unit}</span> : null}
      </span>
    </div>
  );
}

interface SectionProps {
  no: number;
  title: string;
  children: React.ReactNode;
}

/** "1) 발전기간" 처럼 번호를 단 소제목 묶음 */
function Section({ no, title, children }: SectionProps) {
  return (
    <div className={styles.block}>
      <p className={styles.block__head}>{no}) {title}</p>
      {children}
    </div>
  );
}

interface FaultHeatmapProps {
  codes: DiagnosisFaultCode[];
  span: string;
}

/**
 * 일 단위 고장 분류 (SFR-020-03).
 * 하루를 한 칸으로 두고 색으로 분류를 알린다 — 며칠에 몰렸는지가 표보다 빨리 읽힌다.
 */
function FaultHeatmap({ codes, span }: FaultHeatmapProps) {
  const used = [...new Set(codes)].sort((a, b) => a - b) as DiagnosisFaultCode[];

  return (
    <div className={styles.heatmap}>
      <div className={styles.heatmap__legend}>
        {(used.length > 0 ? used : ([0] as DiagnosisFaultCode[])).map((code) => (
          <span key={code} className={styles.heatmap__key}>
            <span className={styles.heatmap__dot} style={{ backgroundColor: CODE_COLOR[code] ?? IDLE_COLOR }} />
            {getFaultCode(code)?.label ?? `코드 ${code}`}
          </span>
        ))}
      </div>

      <div className={styles.heatmap__days}>
        {codes.map((code, index) => (
          <span
            // 날짜 칸은 순서가 곧 날짜라 위치를 열쇠로 삼는다
            key={`${index + 1}일`}
            className={styles.heatmap__cell}
            style={{ backgroundColor: CODE_COLOR[code] ?? IDLE_COLOR }}
            title={`${index + 1}일 · ${getFaultCode(code)?.summary ?? '정상'}`}
          />
        ))}
      </div>

      <p className={styles.heatmap__scale}>
        <span>{span.split(' ~ ')[0]}</span>
        <span>{span.split(' ~ ')[1]}</span>
      </p>
    </div>
  );
}
