import type { TMultiplePageScanPage } from '@typings/scan'
import { useScanReport } from '@hooks/use-scan-report'
import { ScanScreenshot } from '@modules/scan/ui/scan-screenshot'

type MultiplePageStartScreenshotProps = {
  page?: TMultiplePageScanPage
  title: string
  className?: string
}

export const MultiplePageStartScreenshot: React.FC<
  MultiplePageStartScreenshotProps
> = ({ page, title, className }) => {
  const { data } = useScanReport(page?.status === 'COMPLETED' ? page.id : '')
  const screenshot = data?.data.screenshot

  if (!page || !screenshot) return null

  return (
    <ScanScreenshot
      screenshot={screenshot}
      label={`the ${title} start page`}
      path={page.route}
      heading='Start page'
      note='Every scanned page has its own screenshot in its report.'
      className={className}
    />
  )
}
