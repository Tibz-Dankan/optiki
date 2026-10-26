import type { TMultiplePageScanSummary } from '@typings/scan'

export function describeMultiplePageScan(
  scan: TMultiplePageScanSummary
): string {
  return scan.title || scan.target.startURL
}
