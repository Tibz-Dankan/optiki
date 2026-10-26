import { inputTypeLabels } from '@constants/scan'
import type { TScanSummary } from '@typings/scan'
import { formatAddress } from '@utils/format-address'

export function describeScanHeading(scan: TScanSummary): {
  title: string
  subtitle?: string
} {
  const { url, gymPageID, pageTitle } = scan.target
  const subtitle =
    scan.inputType === 'URL' && url
      ? formatAddress(url)
      : inputTypeLabels[scan.inputType]
  const title =
    scan.title ||
    (scan.inputType === 'GYM' && gymPageID ? `Gym: ${gymPageID}` : pageTitle) ||
    subtitle

  return { title, subtitle: title === subtitle ? undefined : subtitle }
}
