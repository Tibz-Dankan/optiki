import type {
  TMultiplePageScanStatus,
  TPageCounts,
  TScanStatus,
} from '@typings/scan'

export function summarizeFindings(
  status: TScanStatus | TMultiplePageScanStatus,
  counts: TPageCounts
): { text: string; detail?: string; tone?: string } {
  if (status === 'RUNNING' || status === 'QUEUED') return { text: 'Scanning…' }
  if (status === 'FAILED') return { text: '—' }

  const { findings, critical, serious } = counts
  if (findings === 0) return { text: 'No findings' }
  const severe = [
    critical > 0 && `${critical} critical`,
    serious > 0 && `${serious} serious`,
  ].filter(Boolean)
  return {
    text: `${findings} ${findings === 1 ? 'finding' : 'findings'}`,
    detail: severe.length > 0 ? severe.join(' · ') : 'Moderate or minor only',
    tone:
      critical > 0
        ? 'text-destructive'
        : serious > 0
          ? 'text-foreground dark:text-warning'
          : 'text-muted-foreground',
  }
}
