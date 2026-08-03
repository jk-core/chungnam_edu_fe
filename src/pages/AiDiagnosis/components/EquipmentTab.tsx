import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/common/Badge';
import { countOperation, isAbnormal, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE, RTU_LABEL, RTU_ORDER, RTU_TONE } from '@/mocks/status';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOLS } from '@/mocks/schools';
import { Sparkline } from '@/components/common/Sparkline';
import { cn } from '@/utils/cn';
import {
  countInverterStatus,
  countRtuStatus,
  DIAG_EFFICIENCY_WARN,
  getDiagEfficiencySeries,
  getDiagnosisUnits,
  getFaultCode,
  getInverters,
  INVERTER_TYPE_LABEL,
} from '@/mocks/equipment';
import { formatNumber } from '@/utils/format';
import { TODAY } from '@/mocks/today';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { FaultCode, Inverter } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisFilter } from './AnalysisFilter';
import { FaultCodeModal } from './FaultCodeModal';

/** 이 아래로 떨어진 발전시간은 짚어 준다 (h) */
const LOW_HOURS = 3;

const schoolNameOf = (schoolId: string) => SCHOOLS.find((school) => school.id === schoolId)?.name ?? '';

/** 인버터 타입에 따라 최말단 판정 단위 이름이 달라진다. */
function unitLabelOf(inverters: Inverter[]): string {
  const types = new Set(inverters.map((inverter) => inverter.type));

  if (types.size !== 1) return '하위 설비';

  return types.has('central') ? '접속반' : '스트링';
}

function countDiagnosisUnits(inverters: Inverter[]): Record<OperationStatus, number> {
  return countOperation(inverters.flatMap(getDiagnosisUnits));
}

export function EquipmentTab() {
  const { plant, inverter: focused, target, promoted, label } = useDiagnosisScope();
  const [openFault, setOpenFault] = useState<{ fault: FaultCode; device: string } | null>(null);

  // 인버터 한 대(또는 그 아래 접속반·스트링)까지 좁혀 놓았으면 그 인버터만 본다.
  const inverters = useMemo(
    () => (focused ? [focused] : getInverters(plant?.id ?? null)),
    [plant?.id, focused],
  );
  const inverterCount = countInverterStatus(inverters);
  const unitCount = countDiagnosisUnits(inverters);
  const rtuCount = countRtuStatus(inverters);
  const unitLabel = unitLabelOf(inverters);
  const abnormal = inverters.filter((inverter) => isAbnormal(inverter.status));

  // 진단 효율 표의 행. 인버터 한 대로 좁혔으면 그 아래 판정 단위까지 내려간다.
  const matrixRows = useMemo(() => {
    const rows = focused
      ? getDiagnosisUnits(focused).map((unit) => ({ id: unit.id, name: unit.name, sub: focused.name, status: unit.status }))
      : inverters.map((inverter) => ({
        id: inverter.id,
        name: inverter.name,
        sub: schoolNameOf(inverter.schoolId),
        status: inverter.status,
      }));

    return rows.map((row) => ({ ...row, series: getDiagEfficiencySeries(row.id, row.status) }));
  }, [focused, inverters]);

  // 최근 7일 진단효율 표에 쓸 날짜 라벨
  const dayLabels = Array.from({ length: 7 }, (_, index) => TODAY.subtract(6 - index, 'day').format('M/D'));

  return (
    <div className={styles.tab}>
      <AnalysisFilter
        trailing={<p className={styles.toolbar__count}>인버터 {inverters.length}대</p>}
      />

      <Reveal>
        <Card
          eyebrow="Equipment"
          title="설비별 진단 현황"
          description={
            focused
              ? `${focused.name} 한 대만 보고 있습니다. ${INVERTER_TYPE_LABEL[focused.type]}이라 ${unitLabel}까지 판정합니다.`
              : plant
                ? `${label}에 설치된 인버터 ${inverters.length}대의 상태입니다.`
                : `이상이 있는 인버터를 앞세워 ${inverters.length}대를 보여 줍니다.`
          }
        >
          <div className={styles.statusChips}>
            <div className={styles.statusChips__group}>
              <p className={styles.statusChips__label}>인버터</p>
              <ul className={styles.statusChips__list}>
                {OPERATION_ORDER.map((status) => (
                  <li key={status}>
                    <Badge tone={OPERATION_TONE[status]} withDot>
                      {OPERATION_LABEL[status]} {inverterCount[status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.statusChips__group}>
              <p className={styles.statusChips__label}>{unitLabel}</p>
              <ul className={styles.statusChips__list}>
                {OPERATION_ORDER.map((status) => (
                  <li key={status}>
                    <Badge tone={OPERATION_TONE[status]} withDot>
                      {OPERATION_LABEL[status]} {unitCount[status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
            {/* 통신 문제는 설비 고장과 원인이 달라 따로 센다. */}
            <div className={styles.statusChips__group}>
              <p className={styles.statusChips__label}>수집장치</p>
              <ul className={styles.statusChips__list}>
                {RTU_ORDER.map((status) => (
                  <li key={status}>
                    <Badge tone={RTU_TONE[status]} withDot>
                      {RTU_LABEL[status]} {rtuCount[status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {promoted ? (
            <p className={styles.statusChips__note}>
              채널은 계측값 조회용이라 판정 대상이 아닙니다. 상위 {target.name} 기준으로 진단합니다.
            </p>
          ) : null}

          {abnormal.length === 0 ? (
            <p className={styles.statusChips__note}>이상이 검출된 인버터가 없습니다.</p>
          ) : (
            <p className={styles.statusChips__note}>
              {abnormal.length}대에서 이상이 검출되었습니다 — {abnormal.slice(0, 3).map((inverter) => `${schoolNameOf(inverter.schoolId)} ${inverter.name}`).join(', ')}
              {abnormal.length > 3 ? ` 외 ${abnormal.length - 3}대` : ''}
            </p>
          )}
        </Card>
      </Reveal>

      {inverters.length === 0 ? (
        <Card padding="none">
          <EmptyState title="등록된 인버터가 없습니다" description={`${label}에는 인버터 정보가 없습니다.`} />
        </Card>
      ) : (
        <div className={styles.inverterGrid}>
          {inverters.map((inverter, index) => {
            const fault = getFaultCode(inverter.faultCode);
            const units = getDiagnosisUnits(inverter);
            const todayHours = inverter.hoursTrend[inverter.hoursTrend.length - 1] ?? 0;

            return (
              <motion.article
                key={inverter.id}
                className={cn(styles.inverter, { [styles['inverter--abnormal']]: isAbnormal(inverter.status) })}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.34, delay: Math.min(index, 8) * 0.04 }}
              >
                <header className={styles.inverter__head}>
                  {/* 전체를 볼 때는 학교가 구분자라 앞세우고, 발전소를 고른 뒤에는 인버터 번호를 앞세운다. */}
                  <div className={styles.inverter__title}>
                    <p className={styles.inverter__name}>
                      {plant ? inverter.name : schoolNameOf(inverter.schoolId)}
                    </p>
                    <p className={styles.inverter__school}>
                      {plant ? `${INVERTER_TYPE_LABEL[inverter.type]} · ${formatNumber(units.length)}개 ${unitLabelOf([inverter])}` : inverter.name}
                    </p>
                  </div>
                  <div className={styles.inverter__badges}>
                    <Badge tone="neutral">{INVERTER_TYPE_LABEL[inverter.type]}</Badge>
                    <Badge tone={OPERATION_TONE[inverter.status]} withDot>
                      {OPERATION_LABEL[inverter.status]}
                    </Badge>
                  </div>
                </header>

                {fault ? (
                  <button
                    type="button"
                    className={styles.inverter__fault}
                    onClick={() => setOpenFault({ fault, device: `${schoolNameOf(inverter.schoolId)} · ${inverter.name}` })}
                  >
                    <span className={styles.inverter__faultCode}>{fault.code}</span>
                    {fault.label}
                    <span className={styles.inverter__faultMore}>원인·조치 보기</span>
                  </button>
                ) : null}

                <Sparkline
                  values={inverter.hoursTrend}
                  tone={isAbnormal(inverter.status) ? 'critical' : 'brand'}
                  width={240}
                  height={40}
                  className={styles.inverter__spark}
                />

                <dl className={styles.inverter__metrics}>
                  <div>
                    <dt>용량</dt>
                    <dd>{formatNumber(inverter.capacityKw, 1)} kW</dd>
                  </div>
                  <div>
                    <dt>발전시간</dt>
                    <dd className={todayHours < LOW_HOURS ? styles.deltaDown : undefined}>
                      {formatNumber(todayHours, 1)} h
                    </dd>
                  </div>
                  <div>
                    <dt>내부온도</dt>
                    <dd className={inverter.temperature > 62 ? styles.deltaDown : undefined}>
                      {formatNumber(inverter.temperature, 1)} ℃
                    </dd>
                  </div>
                </dl>

                <ul className={styles.inverter__strings}>
                  {units.map((unit) => (
                    <li
                      key={unit.id}
                      className={cn(styles.stringPill, styles[`stringPill--${unit.status}`], {
                        [styles['stringPill--selected']]: unit.id === target.id,
                      })}
                      title={`${unit.name} · ${formatNumber(unit.capacityKw, 1)}kW · ${OPERATION_LABEL[unit.status]}`}
                    >
                      <span className={styles.stringPill__dot} />
                      {unit.name}
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      )}

      <Reveal delay={0.08}>
        <Card
          eyebrow="Daily"
          title={`${focused ? unitLabel : '인버터'} 일자별 진단효율`}
          description={`진단효율은 실측 출력을 모델 예측 출력으로 나눈 값입니다. ${DIAG_EFFICIENCY_WARN}% 아래로 떨어진 날은 붉게 표시했습니다.`}
          padding="none"
        >
          <div className={styles.matrixWrap}>
            <table className={styles.matrix}>
              <caption>{focused ? `${focused.name} 하위 ${unitLabel}` : '인버터'}별 최근 7일 진단효율 표</caption>
              <thead>
                <tr>
                  <th scope="col">설비</th>
                  {dayLabels.map((day) => (
                    <th key={day} scope="col">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      <span className={styles.matrix__name}>{row.name}</span>
                      <span className={styles.matrix__school}>{row.sub}</span>
                    </th>
                    {row.series.map((value, dayIndex) => (
                      <td
                        key={dayLabels[dayIndex]}
                        className={cn(styles.matrix__cell, {
                          [styles['matrix__cell--low']]: value < DIAG_EFFICIENCY_WARN,
                          [styles['matrix__cell--none']]: value <= 0,
                        })}
                      >
                        {value <= 0 ? '—' : `${formatNumber(value, 1)}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>

      <FaultCodeModal
        fault={openFault?.fault ?? null}
        deviceLabel={openFault?.device}
        onClose={() => setOpenFault(null)}
      />
    </div>
  );
}
