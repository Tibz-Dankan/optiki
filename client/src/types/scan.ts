import type { TPagination } from '@typings/auth'
import type { TServerResponseStatus } from '@typings/server-response'

export type TScanRuleSet = 'CORE' | 'FULL'
export type TScanMode = 'STATIC' | 'RENDERED'
export type TScanStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'
export type TScanInputType = 'HTML' | 'URL' | 'GYM'
export type TScanTriggeredBy = 'ANONYMOUS' | 'USER' | 'API_TOKEN'
export type TScanVisibility = 'PRIVATE' | 'PUBLIC'
export type TSeverity = 'CRITICAL' | 'SERIOUS' | 'MODERATE' | 'MINOR'
export type TRuleCategory =
  'OPERABLE' | 'PERCEIVABLE' | 'STABLE' | 'DISCOVERABLE'
export type TRuleResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'NEEDS_RENDERED'

export type TScanScores = {
  overall: number | null
  operable: number | null
  perceivable: number | null
  stable: number | null
  discoverable: number | null
}

export type TScanCounts = {
  findings: number
  critical: number
  serious: number
  moderate: number
  minor: number
  rulesPassed: number
  rulesFailed: number
  rulesNotApplicable: number
  rulesNeedRendered: number
  findingsTruncated: boolean
}

export type TScanScreenshot = {
  id: string
  url: string
  expiresAt: string
  contentType: string
  size: number
  width: number | null
  height: number | null
}

export type TScanSummary = {
  id: string
  multiplePageScan: false
  multiplePageScanID: string | null
  title: string | null
  visibility: TScanVisibility
  status: TScanStatus
  triggeredBy: TScanTriggeredBy
  inputType: TScanInputType
  mode: TScanMode
  ruleSet: TScanRuleSet
  isOwner: boolean
  target: {
    url: string | null
    finalURL: string | null
    gymPageID: string | null
    route: string
    httpStatus: number | null
    pageTitle: string | null
    pageLang: string | null
  }
  scores: TScanScores
  counts: TScanCounts
  engine: {
    engineVersion: string
    rulesetHash: string
    reportHash: string | null
    viewport: { width: number; height: number } | null
  }
  timing: {
    startedAt: string
    completedAt: string | null
    durationMs: number | null
  }
  error: { code: string; message: string } | null
  screenshot: TScanScreenshot | null
  createdAt: string
  updatedAt: string
}

export type TScanRuleResult = {
  ruleID: string
  name: string
  position: number
  category: TRuleCategory
  priority: 'P0' | 'P1' | 'P2'
  severity: TSeverity
  weight: number
  result: TRuleResult
  findingsCount: number
}

export type TScanFinding = {
  id: string
  ruleID: string
  category: TRuleCategory
  severity: TSeverity
  fingerprint: string
  position: number
  selectorPath: string
  tag: string
  role: string | null
  accessibleName: string | null
  nameFrom: string | null
  snippet: string
  message: string
  evidence: Record<string, unknown>
}

export type TScanReport = TScanSummary & {
  rules: TScanRuleResult[]
  findings: TScanFinding[]
}

export type TCreateScanInput = {
  url: string
  title?: string
  anonymousID?: string
  multiplePageScan?: boolean
}

export type TRecentScan = {
  id: string
  target: string
  overallScore: number | null
  createdAt: string
}

export type TUpdateScanInput = {
  id: string
  title?: string
  visibility?: TScanVisibility
}

export type TScanListFilters = {
  status?: TScanStatus
  inputType?: TScanInputType
  triggeredBy?: Exclude<TScanTriggeredBy, 'ANONYMOUS'>
}

export type TScanReportResponse = TServerResponseStatus & { data: TScanReport }

export type TScanSummaryResponse = TServerResponseStatus & {
  data: TScanSummary
}

export type TScanListResponse = TServerResponseStatus & {
  data: TScanSummary[]
  pagination: TPagination
}

export type TDeleteScanResponse = TServerResponseStatus & {
  data: { id: string }
}

export type TMultiplePageScanStatus =
  'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export type TMultiplePageScanSkipReason =
  | 'NOT_PUBLIC'
  | 'NOT_FOUND'
  | 'HTTP_ERROR'
  | 'NOT_HTML'
  | 'BLOCKED'
  | 'TIMEOUT'
  | 'FAILED'
  | 'DUPLICATE'

export type TPageCounts = Pick<
  TScanCounts,
  'findings' | 'critical' | 'serious' | 'moderate' | 'minor'
>

export type TMultiplePageScanSummary = {
  id: string
  multiplePageScan: true
  title: string | null
  status: TMultiplePageScanStatus
  triggeredBy: Exclude<TScanTriggeredBy, 'ANONYMOUS'>
  mode: TScanMode
  ruleSet: TScanRuleSet
  maxPages: number
  target: { startURL: string; origin: string | null }
  progress: {
    pagesDiscovered: number
    pagesScanned: number
    pagesSkipped: number
    limitReached: boolean
  }
  scores: TScanScores
  counts: TPageCounts
  engine: { engineVersion: string; rulesetHash: string }
  timing: {
    startedAt: string | null
    completedAt: string | null
    durationMs: number | null
  }
  error: { code: string; message: string } | null
  createdAt: string
  updatedAt: string
}

export type TMultiplePageScanPage = {
  id: string
  route: string
  url: string | null
  pageTitle: string | null
  status: TScanStatus
  scores: TScanScores
  counts: TPageCounts
  error: { code: string; message: string } | null
}

export type TMultiplePageScanRule = {
  ruleID: string
  name: string
  position: number
  category: TRuleCategory
  priority: 'P0' | 'P1' | 'P2'
  severity: TSeverity
  pagesFailed: number
  pagesChecked: number
  findings: number
}

export type TMultiplePageScanSkippedPage = {
  url: string
  reason: TMultiplePageScanSkipReason
  httpStatus: number | null
}

export type TMultiplePageScan = TMultiplePageScanSummary & {
  pages: TMultiplePageScanPage[]
  rules: TMultiplePageScanRule[]
  skipped: TMultiplePageScanSkippedPage[]
}

export type TMultiplePageScanResponse = TServerResponseStatus & {
  data: TMultiplePageScan
}

export type TMultiplePageScanSummaryResponse = TServerResponseStatus & {
  data: TMultiplePageScanSummary
}

export type TMultiplePageScanListResponse = TServerResponseStatus & {
  data: TMultiplePageScanSummary[]
  pagination: TPagination
}

export type TFixReportStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export type TFixReportTriggeredBy = 'SCAN_COMPLETION' | 'USER' | 'API_TOKEN'

export type TFixReport = {
  id: string
  scanID: string | null
  multiplePageScanID: string | null
  status: TFixReportStatus
  triggeredBy: TFixReportTriggeredBy
  model: string | null
  content: string | null
  findingsCovered: number
  error: { code: string; message: string } | null
  timing: {
    startedAt: string | null
    completedAt: string | null
    durationMs: number | null
  }
  createdAt: string
  updatedAt: string
}

export type TFixReportResponse = TServerResponseStatus & {
  data: TFixReport | null
}

export type TCreateFixReportResponse = TServerResponseStatus & {
  data: TFixReport
}
