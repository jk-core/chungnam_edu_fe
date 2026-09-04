import InverterIcon from '@/assets/svg/icons/inverter.svg';
import PlantIcon from '@/assets/svg/icons/plant.svg';
import SiteIcon from '@/assets/svg/icons/site.svg';
import StringIcon from '@/assets/svg/icons/string.svg';
import type { NodeKind } from '@/interface/tree';
import type { FunctionComponent, SVGProps } from 'react';

/**
 * 계층마다 정해진 그림.
 *
 * 이름과 상태 점만으로는 목록을 훑을 때 지금 보는 줄이 발전소인지 인버터인지가 들여쓰기로만
 * 구분된다. 그림을 앞에 두면 깊이를 세지 않고도 무엇인지 바로 읽힌다.
 */
const ICON: Record<NodeKind, FunctionComponent<SVGProps<SVGSVGElement>>> = {
  root: SiteIcon,
  plant: PlantIcon,
  inverter: InverterIcon,
  string: StringIcon,
};

interface EquipmentIconProps extends SVGProps<SVGSVGElement> {
  kind: NodeKind;
}

export function EquipmentIcon({ kind, ...props }: EquipmentIconProps) {
  const Icon = ICON[kind];

  return <Icon aria-hidden focusable="false" {...props} />;
}
