import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { History, ScanSearch } from 'lucide-react'
import { scanAPI, scanKeys } from '@api/scan'
import { toRecentScan } from '@utils/to-recent-scan'
import { Skeleton } from '@shared/ui/skeleton'
import { RecentScanList } from '@modules/scan/ui/recent-scan-list'
import { ScanOwnerActions } from '@modules/scan/ui/scan-owner-actions'

const recentScanCount = 5

export const RecentScans: React.FC = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: [...scanKeys.list({}), 'recent'],
    queryFn: () => scanAPI.getAll(recentScanCount, '', {}),
  })
  const summaries = data?.data ?? []
  const scans = summaries.map(toRecentScan)

  return (
    <section aria-labelledby='recent-scans' className='grid gap-3'>
      <div className='flex items-center justify-between gap-4'>
        <h2
          id='recent-scans'
          className='flex items-center gap-2 text-lg font-semibold'
        >
          <History className='size-5 text-muted-foreground' aria-hidden />
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

      {isPending && <Skeleton className='h-72 w-full rounded-lg' />}
      {isError && (
        <p role='alert' className='text-sm text-destructive'>
          {error.message}
        </p>
      )}

      {!isPending && !isError && scans.length === 0 && (
        <div className='flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center'>
          <ScanSearch className='size-8 text-muted-foreground' aria-hidden />
          <p className='font-semibold'>No scans yet</p>
          <p className='max-w-sm text-sm text-muted-foreground'>
            Enter a page's address to see it the way an AI agent does.
          </p>
        </div>
      )}

      {scans.length > 0 && (
        <RecentScanList
          scans={scans}
          reportPath='/u/scans'
          renderActions={(scan) => {
            const summary = summaries.find(({ id }) => id === scan.id)
            return (
              summary && (
                <ScanOwnerActions
                  scan={summary}
                  label={`Actions for scan of ${scan.target}`}
                  variant='ghost'
                />
              )
            )
          }}
        />
      )}
    </section>
  )
}
