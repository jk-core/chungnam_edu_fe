import type { RtuEnterprise } from '@/interface/deviceMaster';
import type { RtuEnterpriseFormValues } from './form';

export const EMPTY_VALUES: RtuEnterpriseFormValues = {
  rtuEnterpriseName: '',
  rtuEnterpriseEmail: '',
  rtuEnterprisePhone: '',
};

export function toFormValues(target: RtuEnterprise): RtuEnterpriseFormValues {
  return {
    rtuEnterpriseName: target.name,
    rtuEnterpriseEmail: target.email,
    rtuEnterprisePhone: target.phone,
  };
}
