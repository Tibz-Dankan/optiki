import type { TFixReport } from '@typings/scan'

export function isFixReportActive(report: TFixReport | null | undefined) {
  return report?.status === 'QUEUED' || report?.status === 'RUNNING'
}
