import type {
  TRuleCategory,
  TRuleResult,
  TScanInputType,
  TScanStatus,
  TScanTriggeredBy,
  TSeverity,
} from '@typings/scan'
import type { TServerErrorName } from '@typings/server-response'

export const scanPageSize = 20

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

export const scanErrorMessages: Partial<Record<TServerErrorName, string>> = {
  SSRF_BLOCKED: "This address isn't allowed",
  TOO_LARGE: 'That page is over 2 MB',
  NOT_HTML: "That address didn't return an HTML page",
  FETCH_TIMEOUT: 'That page took too long to load',
  RENDER_TIMEOUT: 'That page took too long to load',
  RENDERER_BUSY: 'Too many scans are rendering — try again in a few seconds',
  TOO_MANY_REQUESTS: 'Slow down — too many scans. Try again in a minute',
}
