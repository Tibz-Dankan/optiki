import { inputTypeLabels } from '@constants/scan'
import type { TRecentScan, TScanSummary } from '@typings/scan'
import { describeScanTarget } from '@utils/describe-scan-target'

export function toRecentScan(scan: TScanSummary): TRecentScan {
  const { url, gymPageID, pageTitle } = scan.target
  const subtitle =
    scan.inputType === 'URL' && url
      ? url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
      : inputTypeLabels[scan.inputType]
  const title =
    scan.title ||
    (scan.inputType === 'GYM' && gymPageID ? `Gym: ${gymPageID}` : pageTitle) ||
    subtitle

  return {
    id: scan.id,
    target: describeScanTarget(scan),
    title,
    subtitle: title === subtitle ? undefined : subtitle,
    inputType: scan.inputType,
    overallScore: scan.scores.overall,
    createdAt: scan.createdAt,
  }
}
