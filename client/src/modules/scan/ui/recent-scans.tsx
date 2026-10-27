import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { History, ScanSearch } from 'lucide-react'
import { multiplePageScanPollInterval } from '@constants/scan'
import type { TScanListItem } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { Skeleton } from '@shared/ui/skeleton'
import { ScanTable } from '@modules/scan/ui/scan-table'

const recentScanCount = 5

export const RecentScans: React.FC = () => {
  const singlePage = useQuery({
    queryKey: [...scanKeys.list({}), 'recent'],
    queryFn: () => scanAPI.getAll(recentScanCount, '', {}),
  })
  const multiplePage = useQuery({
    queryKey: [...scanKeys.multipleList(), 'recent'],
    queryFn: () => scanAPI.getAllMultiplePage(recentScanCount, ''),
    refetchInterval: (query) =>
      query.state.data?.data.some(isMultiplePageScanActive)
        ? multiplePageScanPollInterval
        : false,
  })

  const isPending = singlePage.isPending || multiplePage.isPending
  const error = singlePage.error ?? multiplePage.error
  const scans: TScanListItem[] = [
    ...(singlePage.data?.data ?? []),
    ...(multiplePage.data?.data ?? []),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, recentScanCount)

  return (
    <section aria-labelledby='recent-scans' className='grid gap-3'>
      <div className='flex items-center justify-between gap-4'>
        <h2
          id='recent-scans'
          className='flex items-center gap-2 text-base font-semibold'
        >
          <History className='size-4.5 text-muted-foreground' aria-hidden />
          Recent scans
        </h2>
        {scans.length > 0 && (
          <Link
            to='/u/scans'
            className='text-sm font-medium text-primary underline underline-offset-4'
          >
            See all scans
          </Link>
        )}
      </div>

      {isPending && <Skeleton className='h-80 w-full rounded-lg' />}
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error.message}
        </p>
      )}

      {!isPending && !error && scans.length === 0 && (
        <div className='flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center'>
          <ScanSearch className='size-7 text-muted-foreground' aria-hidden />
          <p className='text-[15px] font-semibold'>No scans yet</p>
          <p className='max-w-sm text-sm text-muted-foreground'>
            Your first scan shows up here, with its score and a link back to the
            report.
          </p>
        </div>
      )}

      {!isPending && scans.length > 0 && (
        <ScanTable scans={scans} isCompact hasTypeColumn />
      )}
    </section>
  )
}
