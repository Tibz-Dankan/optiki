import type { TScanSummary } from '@typings/scan'

export function describeScanTarget(scan: TScanSummary): string {
  if (scan.title) return scan.title
  if (scan.target.url) return scan.target.url
  if (scan.target.gymPageID) return `Gym: ${scan.target.gymPageID}`
  return scan.target.pageTitle
    ? `HTML: ${scan.target.pageTitle}`
    : 'Pasted HTML'
}
