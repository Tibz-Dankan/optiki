import type { TRule, TRuleFilters } from '@typings/rules'

export function filterRules(rules: TRule[], filters: TRuleFilters): TRule[] {
  const needle = filters.query
    .trim()
    .toLowerCase()
    .replace(/^opt-?/, '')

  return rules.filter((rule) => {
    if (filters.ruleSet === 'CORE' && !rule.ruleSets.includes('CORE')) {
      return false
    }
    if (filters.severity !== 'ALL' && rule.severity !== filters.severity) {
      return false
    }
    if (!needle) return true
    return [rule.id, rule.name, rule.summary, rule.wcag]
      .join(' ')
      .toLowerCase()
      .includes(needle)
  })
}
