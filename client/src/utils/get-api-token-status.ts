import { apiTokenExpiringSoonDays } from '@constants/api-token'
import type { TAPIToken, TAPITokenStatus } from '@typings/api-token'

export function getAPITokenStatus(
  token: TAPIToken
): TAPITokenStatus | 'EXPIRING' {
  if (token.status !== 'ACTIVE' || !token.expiresAt) return token.status
  const daysLeft = (Date.parse(token.expiresAt) - Date.now()) / 86_400_000
  return daysLeft <= apiTokenExpiringSoonDays ? 'EXPIRING' : 'ACTIVE'
}
