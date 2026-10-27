import type { TRuleCategory, TScanRuleSet, TSeverity } from '@typings/scan'
import type { TServerResponseStatus } from '@typings/server-response'

export type TRule = {
  id: string
  name: string
  category: TRuleCategory
  severity: TSeverity
  priority: 'P0' | 'P1' | 'P2'
  weight: number
  modes: ('STATIC' | 'RENDERED')[]
  renderedOnly: boolean
  ruleSets: TScanRuleSet[]
  summary: string
  why: string
  fix: string
  fixBefore: string
  fixAfter: string
  wcag: string
  origin: string
}

export type TRuleModes = 'STATIC_AND_RENDERED' | 'STATIC_ONLY' | 'RENDERED_ONLY'

export type TRuleSetFilter = 'ALL' | 'CORE'

export type TRuleFilters = {
  query: string
  ruleSet: TRuleSetFilter
  severity: 'ALL' | TSeverity
}

export type TRulesResponse = TServerResponseStatus & { data: TRule[] }

export type TRuleResponse = TServerResponseStatus & { data: TRule }
