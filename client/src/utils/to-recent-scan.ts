import type { TRecentScan, TScanSummary } from '@typings/scan'
import { describeScanHeading } from '@utils/describe-scan-heading'
import { describeScanTarget } from '@utils/describe-scan-target'

export function toRecentScan(scan: TScanSummary): TRecentScan {
  return {
    id: scan.id,
    target: describeScanTarget(scan),
    ...describeScanHeading(scan),
    inputType: scan.inputType,
    overallScore: scan.scores.overall,
    createdAt: scan.createdAt,
  }
}
