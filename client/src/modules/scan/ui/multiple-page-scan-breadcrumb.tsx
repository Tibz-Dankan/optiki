import { Link } from 'react-router-dom'
import { ChevronRight, History } from 'lucide-react'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { formatAddress } from '@utils/format-address'
import { useMultiplePageScanReport } from '@hooks/use-multiple-page-scan-report'

type MultiplePageScanBreadcrumbProps = {
  id: string
}

export const MultiplePageScanBreadcrumb: React.FC<
  MultiplePageScanBreadcrumbProps
> = ({ id }) => {
  const { data } = useMultiplePageScanReport(id)
  const scan = data?.data

  return (
    <nav aria-label='Breadcrumb' className='min-w-0 flex-1'>
      <ol className='flex min-w-0 items-center gap-1 text-sm'>
        <li className='shrink-0'>
          <Link
            to='/u/scans'
            className='inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-accent'
          >
            <History className='size-4' aria-hidden />
            Scans
          </Link>
        </li>
        {scan && (
          <>
            <li aria-hidden className='flex shrink-0 text-muted-foreground/60'>
              <ChevronRight className='size-4' />
            </li>
            <li className='min-w-0 truncate px-2 text-muted-foreground'>
              <span aria-current='page'>
                {formatAddress(describeMultiplePageScan(scan))}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}
