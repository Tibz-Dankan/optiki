import type { TAPITokenExpiry } from '@typings/api-token'

const expiryDays: Record<Exclude<TAPITokenExpiry, 'none'>, number> = {
  '30d': 30,
  '90d': 90,
  '1y': 365,
}

export function getAPITokenExpiresAt(expiry: TAPITokenExpiry): string | null {
  if (expiry === 'none') return null
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays[expiry])
  return expiresAt.toISOString()
}
