import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, History, Layers } from 'lucide-react'
import { scanAPI, scanKeys } from '@api/scan'
import { cn } from '@utils/classname'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { describeScanHeading } from '@utils/describe-scan-heading'
import { formatAddress } from '@utils/format-address'
import { useScanReport } from '@hooks/use-scan-report'

const crumbClassName =
  'inline-flex h-8 max-w-full items-center gap-1.5 rounded-md px-2 hover:bg-accent'

const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <li
    aria-hidden
    className={cn('flex shrink-0 text-muted-foreground/60', className)}
  >
    <ChevronRight className='size-4' />
  </li>
)

type ScanReportBreadcrumbProps = {
  id: string
}

export const ScanReportBreadcrumb: React.FC<ScanReportBreadcrumbProps> = ({
  id,
}) => {
  const { data } = useScanReport(id)
  const scan = data?.data
  const multiplePageScanID = scan?.isOwner ? scan.multiplePageScanID : null
  const { data: multiple } = useQuery({
    queryKey: scanKeys.multipleDetail(multiplePageScanID ?? ''),
    queryFn: () => scanAPI.getOneMultiplePage(multiplePageScanID ?? ''),
    enabled: !!multiplePageScanID,
  })

  return (
    <nav aria-label='Breadcrumb' className='min-w-0 flex-1'>
      <ol className='flex min-w-0 items-center gap-1 text-sm'>
        <li className='shrink-0'>
          <Link to='/u/scans' className={`${crumbClassName} font-medium`}>
            <History className='size-4' aria-hidden />
            Scans
          </Link>
        </li>
        {multiplePageScanID && (
          <>
            <Separator />
            <li className='min-w-0 shrink'>
              <Link
                to={`/u/scans/multiple/${multiplePageScanID}`}
                className={crumbClassName}
              >
                <Layers className='size-4 shrink-0' aria-hidden />
                <span className='truncate'>
                  {multiple
                    ? formatAddress(describeMultiplePageScan(multiple.data))
                    : 'Multiple-page scan'}
                </span>
              </Link>
            </li>
          </>
        )}
        {scan && (
          <>
            <Separator className='hidden sm:flex' />
            <li className='hidden min-w-0 truncate px-2 text-muted-foreground sm:block'>
              <span aria-current='page'>{describeScanHeading(scan).title}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}
