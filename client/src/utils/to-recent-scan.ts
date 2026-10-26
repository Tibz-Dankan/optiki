import type { TRecentScan, TScanSummary } from '@typings/scan'
import { describeScanTarget } from '@utils/describe-scan-target'

export function toRecentScan(scan: TScanSummary): TRecentScan {
  return {
    id: scan.id,
    target: describeScanTarget(scan),
    overallScore: scan.scores.overall,
    createdAt: scan.createdAt,
  }
}
