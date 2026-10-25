import type { TScanRuleSet } from '@typings/scan'
import type { TServerResponseStatus } from '@typings/server-response'

export type TGymPair = {
  id: string
  ruleID: string
  ruleName: string
  ruleSets: TScanRuleSet[]
  scene: string
  broken: string
  fixed: string
  brokenPath: string
  fixedPath: string
  needsRender: boolean
}

export type TGymPage = { id: string; path: string }

export type TGymResponse = TServerResponseStatus & {
  data: { pairs: TGymPair[]; kitchenSink: TGymPage; perfect: TGymPage }
}
