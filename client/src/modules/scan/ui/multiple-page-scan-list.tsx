import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  multiplePageScanPollInterval,
  multiplePageScanStatusLabels,
  scanPageSize,
} from '@constants/scan'
import type { TMultiplePageScanSummary } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { formatDateTime } from '@utils/format-date-time'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { Button } from '@shared/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { DeleteMultiplePageScanDialog } from '@modules/scan/ui/delete-multiple-page-scan-dialog'

export const MultiplePageScanList: React.FC = () => {
  const [scanToDelete, setScanToDelete] =
    useState<TMultiplePageScanSummary | null>(null)

  const {
    data,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: scanKeys.multipleList(),
    queryFn: ({ pageParam }) =>
      scanAPI.getAllMultiplePage(scanPageSize, pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextItems
        ? lastPage.pagination.nextCursor
        : undefined,
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) =>
        page.data.some(isMultiplePageScanActive)
      )
        ? multiplePageScanPollInterval
        : false,
  })

  const scans = data?.pages.flatMap((page) => page.data) ?? []

  if (isError) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {error.message}
      </p>
    )
  }
  if (scans.length === 0) return null

  return (
    <section aria-labelledby='multiple-page-scans-heading' className='mt-6'>
      <h2
        id='multiple-page-scans-heading'
        className='text-lg font-semibold tracking-tight'
      >
        Multiple-page scans
      </h2>
      <Table className='mt-2'>
        <TableHeader>
          <TableRow>
            <TableHead>Start page</TableHead>
            <TableHead>Pages</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((scan) => {
            const target = describeMultiplePageScan(scan)
            return (
              <TableRow key={scan.id}>
                <TableCell className='max-w-xs truncate font-medium'>
                  <Link
                    to={`/u/scans/multiple/${scan.id}`}
                    className='underline-offset-4 hover:underline'
                  >
                    <span className='sr-only'>Open multiple-page scan of </span>
                    {target}
                  </Link>
                </TableCell>
                <TableCell>{scan.progress.pagesScanned}</TableCell>
                <TableCell>{scan.scores.overall ?? '—'}</TableCell>
                <TableCell className='text-muted-foreground'>
                  {multiplePageScanStatusLabels[scan.status]}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {formatDateTime(scan.createdAt)}
                </TableCell>
                <TableCell className='text-right'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    disabled={isMultiplePageScanActive(scan)}
                    onClick={() => setScanToDelete(scan)}
                  >
                    Delete
                    <span className='sr-only'>
                      {' '}
                      multiple-page scan of {target}
                    </span>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className='mt-4 flex justify-center'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more multiple-page scans
            {isFetchingNextPage && <Loader2 className='animate-spin' />}
          </Button>
        </div>
      )}

      <DeleteMultiplePageScanDialog
        scan={scanToDelete}
        onOpenChange={(open) => !open && setScanToDelete(null)}
      />
    </section>
  )
}
