import type { TMultiplePageScanSummary } from '@typings/scan'

export function isMultiplePageScanActive(
  scan: TMultiplePageScanSummary
): boolean {
  return scan.status === 'QUEUED' || scan.status === 'RUNNING'
}
