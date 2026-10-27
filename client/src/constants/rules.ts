import type { TRuleModes } from '@typings/rules'
import type { TRuleCategory, TSeverity } from '@typings/scan'

export const categoryBlurbs: Record<TRuleCategory, string> = {
  OPERABLE:
    'Controls an agent can find, name and press, and fields it can fill in.',
  PERCEIVABLE: 'Names, images and text that say what people see on screen.',
  STABLE:
    'Controls are ready at first look, and nothing jumps while an agent aims.',
  DISCOVERABLE: 'Titles, headings, landmarks, named dialogs and titled frames.',
}

export const ruleModeLabels: Record<
  TRuleModes,
  { short: string; pill: string; fact: string }
> = {
  STATIC_AND_RENDERED: {
    short: 'Static & rendered',
    pill: 'Static & rendered scans',
    fact: 'Static and rendered scans',
  },
  STATIC_ONLY: {
    short: 'Static only',
    pill: 'Static scans',
    fact: 'Static scans (the served HTML)',
  },
  RENDERED_ONLY: {
    short: 'Rendered only',
    pill: 'Rendered scans only',
    fact: 'Rendered scans only, in Chromium',
  },
}

// Pill text stays foreground in light mode: these hues on a 10% tint miss 4.5:1.
export const severityAccents: Record<
  TSeverity,
  { dot: string; pill: string; border: string; icon: string }
> = {
  CRITICAL: {
    dot: 'bg-destructive',
    pill: 'bg-destructive/10 dark:bg-destructive/15 dark:text-destructive',
    border: 'border-s-destructive',
    icon: 'bg-destructive/10 text-destructive dark:bg-destructive/15',
  },
  SERIOUS: {
    dot: 'bg-warning',
    pill: 'bg-warning/15 dark:text-warning',
    border: 'border-s-warning',
    icon: 'bg-warning/15 text-warning',
  },
  MODERATE: {
    dot: 'bg-info',
    pill: 'bg-info/10 dark:bg-info/15 dark:text-info',
    border: 'border-s-info',
    icon: 'bg-info/10 text-info dark:bg-info/15',
  },
  MINOR: {
    dot: 'bg-muted-foreground',
    pill: 'bg-muted-foreground/10 dark:bg-muted-foreground/15 dark:text-muted-foreground',
    border: 'border-s-muted-foreground',
    icon: 'bg-muted-foreground/10 text-muted-foreground dark:bg-muted-foreground/15',
  },
}
