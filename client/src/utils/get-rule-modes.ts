import type { TRule, TRuleModes } from '@typings/rules'

export function getRuleModes(rule: TRule): TRuleModes {
  if (!rule.modes.includes('RENDERED')) return 'STATIC_ONLY'
  if (!rule.modes.includes('STATIC')) return 'RENDERED_ONLY'
  return 'STATIC_AND_RENDERED'
}
