import type { TRuleCategory, TScanScores } from '@typings/scan'

export function getCategoryScore(
  scores: TScanScores,
  category: TRuleCategory
): number | null {
  switch (category) {
    case 'OPERABLE':
      return scores.operable
    case 'PERCEIVABLE':
      return scores.perceivable
    case 'STABLE':
      return scores.stable
    case 'DISCOVERABLE':
      return scores.discoverable
  }
}
