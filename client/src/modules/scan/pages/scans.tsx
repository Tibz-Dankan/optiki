import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { scanPageSize, statusLabels } from '@constants/scan'
import type { TScanListFilters } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatDateTime } from '@utils/format-date-time'
import { Button } from '@shared/ui/button'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select'
import { Skeleton } from '@shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { MultiplePageScanList } from '@modules/scan/ui/multiple-page-scan-list'
import { ScanOwnerActions } from '@modules/scan/ui/scan-owner-actions'

const anyValue = 'ANY'

export const Scans: React.FC = () => {
  const [filters, setFilters] = useState<TScanListFilters>({})

  const {
    data,
    isPending,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: scanKeys.list(filters),
    queryFn: ({ pageParam }) =>
      scanAPI.getAll(scanPageSize, pageParam, filters),
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextItems
        ? lastPage.pagination.nextCursor
        : undefined,
  })

  const scans = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div className='space-y-0.5'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Scans
            </h1>
            <p className='text-muted-foreground'>
              Every scan you ran, from the browser or with an API token.
            </p>
          </div>
          <Button asChild>
            <Link to='/u/scan'>Scan a page</Link>
          </Button>
        </div>

        <MultiplePageScanList />

        <h2 className='mt-8 text-lg font-semibold tracking-tight'>
          Single-page scans
        </h2>
        <div className='mt-2 flex flex-wrap gap-3'>
          <Select
            value={filters.status ?? anyValue}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                status:
                  value === anyValue
                    ? undefined
                    : (value as TScanListFilters['status']),
              }))
            }
          >
            <SelectTrigger className='w-44' aria-label='Filter by status'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={anyValue}>Any status</SelectItem>
              <SelectItem value='COMPLETED'>Completed</SelectItem>
              <SelectItem value='FAILED'>Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.triggeredBy ?? anyValue}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                triggeredBy:
                  value === anyValue
                    ? undefined
                    : (value as TScanListFilters['triggeredBy']),
              }))
            }
          >
            <SelectTrigger className='w-44' aria-label='Filter by source'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={anyValue}>Any source</SelectItem>
              <SelectItem value='USER'>From the browser</SelectItem>
              <SelectItem value='API_TOKEN'>From an API token</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='mt-4'>
          {isPending && (
            <div className='flex flex-col gap-3'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-10 w-full' />
              ))}
            </div>
          )}

          {isError && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {!isPending && !isError && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((scan) => {
                    const target = describeScanTarget(scan)
                    return (
                      <TableRow key={scan.id}>
                        <TableCell className='max-w-xs truncate font-medium'>
                          <Link
                            to={`/u/scans/${scan.id}`}
                            className='underline-offset-4 hover:underline'
                          >
                            {target}
                          </Link>
                        </TableCell>
                        <TableCell>{scan.scores.overall ?? '—'}</TableCell>
                        <TableCell className='text-muted-foreground'>
                          {scan.mode === 'RENDERED' ? 'Rendered' : 'Static'}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {statusLabels[scan.status]}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {formatDateTime(scan.createdAt)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <ScanOwnerActions
                            scan={scan}
                            label={`Actions for scan of ${target}`}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {scans.length === 0 && (
                <p className='py-6 text-center text-sm text-muted-foreground'>
                  No scans yet.{' '}
                  <Link to='/u/scan' className='font-medium underline'>
                    Scan a page
                  </Link>{' '}
                  to see it here.
                </p>
              )}

              {hasNextPage && (
                <div className='mt-4 flex justify-center'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    Load more scans
                    {isFetchingNextPage && <Loader2 className='animate-spin' />}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Main>
    </>
  )
}
