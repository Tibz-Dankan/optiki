import type { TPagination } from '@typings/auth'
import type { TServerResponseStatus } from '@typings/server-response'

export type TAPITokenPermission =
  'scan:create:own' | 'scan:view:own' | 'scan:edit:own' | 'scan:delete:own'

export type TAPITokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'

export type TAPIToken = {
  id: string
  name: string
  prefix: string
  permissions: TAPITokenPermission[]
  status: TAPITokenStatus
  expiresAt: string | null
  lastUsedAt: string | null
  lastUsedIP: string | null
  isRevoked: boolean
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TCreatedAPIToken = TAPIToken & { token: string }

export type TAPITokenPermissionOption = {
  name: TAPITokenPermission
  description: string
}

export type TAPITokenExpiry = '30d' | '90d' | '1y' | 'none'

export type TCreateAPITokenInput = {
  name: string
  permissions: TAPITokenPermission[]
  expiresAt: string | null
}

export type TUpdateAPITokenInput = {
  id: string
  name?: string
  permissions?: TAPITokenPermission[]
}

export type TCreateAPITokenResponse = TServerResponseStatus & {
  data: TCreatedAPIToken
}

export type TAPITokenResponse = TServerResponseStatus & { data: TAPIToken }

export type TAPITokenListResponse = TServerResponseStatus & {
  data: TAPIToken[]
  pagination: TPagination
}

export type TAPITokenPermissionsResponse = TServerResponseStatus & {
  data: TAPITokenPermissionOption[]
}

export type TDeleteAPITokenResponse = TServerResponseStatus & {
  data: { id: string }
}
