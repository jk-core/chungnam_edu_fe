import type { ManageRtuEnterpriseAddParams } from '@/service/rtuEnterprise/type';
import type { RtuEnterprise } from '@/interface/deviceMaster';

export const EMPTY_VALUES: ManageRtuEnterpriseAddParams = {
  rtuEnterpriseName: '',
  rtuEnterpriseEmail: '',
  rtuEnterprisePhone: '',
};

export function toFormValues(target: RtuEnterprise): ManageRtuEnterpriseAddParams {
  return {
    rtuEnterpriseName: target.name,
    rtuEnterpriseEmail: target.email,
    rtuEnterprisePhone: target.phone,
  };
}
