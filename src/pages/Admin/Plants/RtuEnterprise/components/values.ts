import type { ManageRtuEnterpriseDetail } from '@/service/rtuEnterprise/type';
import type { RtuEnterpriseFormValues } from './form';

export const EMPTY_VALUES: RtuEnterpriseFormValues = {
  rtuEnterpriseName: '',
  rtuEnterpriseEmail: '',
  rtuEnterprisePhone: '',
};

export function toFormValues(target: ManageRtuEnterpriseDetail): RtuEnterpriseFormValues {
  return {
    rtuEnterpriseName: target.rtuEnterpriseName,
    rtuEnterpriseEmail: target.rtuEnterpriseEmail,
    rtuEnterprisePhone: target.rtuEnterprisePhone,
  };
}
