import { Link } from 'react-router-dom';
import { AlertIcon, ArrowUpRightIcon, ChartIcon, PulseIcon, SunIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import { Reveal } from '@/components/common/Reveal';
import styles from './QuickLinks.module.scss';
import type { ReactNode } from 'react';

interface QuickLink {
  path: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const LINKS: QuickLink[] = [
  {
    path: PATH.STATISTICS_OVERVIEW,
    label: '발전통계',
    description: '일·월·연 단위로 발전량과 일사량을 견주어 봅니다.',
    icon: <ChartIcon />,
  },
  {
    path: PATH.COLLECTION_TREND,
    label: '수집데이터',
    description: '15분 주기로 들어온 계측값을 그대로 살펴봅니다.',
    icon: <SunIcon />,
  },
  {
    path: PATH.AI_DIAGNOSIS_SUMMARY,
    label: 'AI진단',
    description: '발전시간과 고장코드로 이상 설비를 짚어 냅니다.',
    icon: <PulseIcon />,
  },
  {
    path: PATH.ALERTS_LIST,
    label: '알림이력',
    description: '발생한 알림과 조치 결과를 조회합니다.',
    icon: <AlertIcon />,
  },
];

export function QuickLinks() {
  return (
    <section className={styles.quick} aria-label="바로가기">
      <div className={styles.quick__inner}>
        {LINKS.map((link, index) => (
          <Reveal key={link.path} delay={index * 0.06}>
            <Link to={link.path} className={styles.quick__card}>
              <span className={styles.quick__icon}>{link.icon}</span>
              <span className={styles.quick__body}>
                <span className={styles.quick__label}>{link.label}</span>
                <span className={styles.quick__description}>{link.description}</span>
              </span>
              <ArrowUpRightIcon className={styles.quick__arrow} />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
