import type {
  TAPITokenExpiry,
  TAPITokenPermission,
  TAPITokenStatus,
} from '@typings/api-token'

export const apiTokenPageSize = 25
export const apiTokenMaxNameLength = 64
export const apiTokenExpiringSoonDays = 7

export const defaultAPITokenPermissions: TAPITokenPermission[] = [
  'scan:create:own',
  'scan:view:own',
]

export const apiTokenPermissionLabels: Record<TAPITokenPermission, string> = {
  'scan:create:own': 'Create scans',
  'scan:view:own': 'View scans',
  'scan:edit:own': 'Edit scans',
  'scan:delete:own': 'Delete scans',
}

export const apiTokenExpiryOptions: {
  value: TAPITokenExpiry
  label: string
}[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
  { value: 'none', label: 'No expiry' },
]

export const apiTokenStatusLabels: Record<
  TAPITokenStatus | 'EXPIRING',
  string
> = {
  ACTIVE: 'Active',
  EXPIRING: 'Expiring soon',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
}
