import type { EduVariant } from '@/components/solar-edu/variants/EduBoard';
import { SolarEduScreen } from './components/SolarEduScreen';

interface SolarEduPageProps {
  /**
   * 어느 시안으로 보여 줄지.
   *
   * 눈높이(초·중·고)와는 다른 축이다 — 눈높이는 **무엇을 말할지**, 시안은 **어떻게 늘어놓을지**를
   * 가른다. 그래서 둘이 곱해져 아홉 가지 화면이 나오고, 어느 시안을 골라도 눈높이는 그대로 따라온다.
   */
  variant: EduVariant;
}

/**
 * 학생 교육용 태양광 대시보드 (SFR-005).
 *
 * 복도·강당 모니터에 걸어 두고 아무도 조작하지 않는 화면이라, 페이지를 넘기지 않고
 * 한 화면에 담았다. 운영 지표 대신 "지금 얼마나 만들고 있고, 그게 무슨 뜻인지" 만 남긴다.
 */
function SolarEduPage({ variant }: SolarEduPageProps) {
  return <SolarEduScreen variant={variant} />;
}

export default SolarEduPage;
