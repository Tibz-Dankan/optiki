import type {
  TMultiplePageScanSkipReason,
  TMultiplePageScanStatus,
  TRuleCategory,
  TRuleResult,
  TScanInputType,
  TScanStatus,
  TScanTriggeredBy,
  TSeverity,
} from '@typings/scan'
import type { TServerErrorName } from '@typings/server-response'

export const scanPageSize = 20

export const guestScanLimit = 3

export const categoryOrder: TRuleCategory[] = [
  'OPERABLE',
  'PERCEIVABLE',
  'STABLE',
  'DISCOVERABLE',
]

export const categoryLabels: Record<TRuleCategory, string> = {
  OPERABLE: 'Operable',
  PERCEIVABLE: 'Perceivable',
  STABLE: 'Stable',
  DISCOVERABLE: 'Discoverable',
}

export const categoryQuestions: Record<TRuleCategory, string> = {
  OPERABLE: 'Can an agent act?',
  PERCEIVABLE: 'Can an agent read it?',
  STABLE: 'Does it hold still long enough?',
  DISCOVERABLE: 'Can an agent orient itself?',
}

export const severityLabels: Record<TSeverity, string> = {
  CRITICAL: 'Critical',
  SERIOUS: 'Serious',
  MODERATE: 'Moderate',
  MINOR: 'Minor',
}

export const severityTones: Record<TSeverity, string> = {
  CRITICAL: 'border-destructive/40 bg-destructive/10 text-destructive',
  SERIOUS: 'border-warning/50 bg-warning/15 text-foreground',
  MODERATE: 'border-border bg-muted text-foreground',
  MINOR: 'border-border bg-background text-muted-foreground',
}

export const ruleResultLabels: Record<TRuleResult, string> = {
  PASS: 'Pass',
  FAIL: 'Fail',
  NOT_APPLICABLE: 'Not applicable',
  NEEDS_RENDERED: 'Needs rendered scan',
}

export const inputTypeLabels: Record<TScanInputType, string> = {
  HTML: 'Pasted HTML',
  URL: 'URL',
  GYM: 'Gym page',
}

export const statusLabels: Record<TScanStatus, string> = {
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

export const triggeredByLabels: Record<TScanTriggeredBy, string> = {
  ANONYMOUS: 'Anonymous',
  USER: 'You',
  API_TOKEN: 'API token',
}

export const fixReportPollInterval = 3000

export const scanErrorMessages: Partial<Record<TServerErrorName, string>> = {
  SSRF_BLOCKED: "This address isn't allowed",
  TOO_LARGE: 'That page is over 2 MB',
  NOT_HTML: "That address didn't return an HTML page",
  FETCH_TIMEOUT: 'That page took too long to load',
  RENDER_TIMEOUT: 'That page took too long to load',
  RENDERER_BUSY: 'Too many scans are rendering — try again in a few seconds',
  TOO_MANY_REQUESTS: 'Slow down — too many scans. Try again in a minute',
  ANONYMOUS_SCAN_LIMIT:
    "You've used your 3 free scans. Sign in to scan more pages",
  SCAN_QUEUE_FULL:
    'Too many multiple-page scans are waiting — try again in a minute',
  FIX_REPORTS_UNAVAILABLE: "Fix reports aren't available right now",
  FIX_REPORT_QUEUE_FULL:
    'Too many fix reports are being generated — try again in a minute',
}

export const multiplePageScanMaxPages = 25

export const multiplePageScanPollInterval = 2000

export const multiplePageScanStatusLabels: Record<
  TMultiplePageScanStatus,
  string
> = {
  QUEUED: 'Queued',
  RUNNING: 'Scanning',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

export const skipReasonLabels: Record<TMultiplePageScanSkipReason, string> = {
  NOT_PUBLIC: 'Needs a sign-in or redirects off the site',
  NOT_FOUND: 'Not found',
  HTTP_ERROR: 'The server answered with an error',
  NOT_HTML: 'Not an HTML page',
  BLOCKED: "This address isn't allowed",
  TIMEOUT: 'Took too long to load',
  FAILED: 'Could not be loaded',
  DUPLICATE: 'Redirects to a page already scanned',
}
