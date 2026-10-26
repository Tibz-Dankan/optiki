import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { FileText, Loader2, ScanSearch } from 'lucide-react'
import { scanPageSize } from '@constants/scan'
import type { TScanListFilters } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { Button } from '@shared/ui/button'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { Skeleton } from '@shared/ui/skeleton'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { MultiplePageScanList } from '@modules/scan/ui/multiple-page-scan-list'
import { ScanFilterGroup } from '@modules/scan/ui/scan-filter-group'
import { SinglePageScanTable } from '@modules/scan/ui/single-page-scan-table'

const allValue = 'ALL'

const statusOptions = [
  { value: allValue, label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
]

const sourceOptions = [
  { value: allValue, label: 'All' },
  { value: 'USER', label: 'Browser' },
  { value: 'API_TOKEN', label: 'API' },
]

export const Scans: React.FC = () => {
  const [filters, setFilters] = useState<TScanListFilters>({})
  const isFiltered = Boolean(filters.status || filters.triggeredBy)

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
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Scans
            </h1>
            <p className='text-muted-foreground'>
              Every scan you ran, from the browser or with an API token.
            </p>
          </div>
          <Button asChild size='lg'>
            <Link to='/u/scan'>
              <ScanSearch aria-hidden />
              Scan a page
            </Link>
          </Button>
        </div>

        <MultiplePageScanList />

        <section
          aria-labelledby='single-page-scans-heading'
          className='mt-12 grid gap-3.5'
        >
          <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
            <h2
              id='single-page-scans-heading'
              className='flex items-center gap-2 text-base font-semibold'
            >
              <FileText
                className='size-4.5 text-muted-foreground'
                aria-hidden
              />
              Single-page scans
              {!isPending && (
                <span className='inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium'>
                  {scans.length}
                  {hasNextPage && '+'}
                </span>
              )}
            </h2>
            <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
              <ScanFilterGroup
                id='status-filter-label'
                label='Status'
                value={filters.status ?? allValue}
                options={statusOptions}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    status:
                      value === allValue
                        ? undefined
                        : (value as TScanListFilters['status']),
                  }))
                }
              />
              <ScanFilterGroup
                id='source-filter-label'
                label='Source'
                value={filters.triggeredBy ?? allValue}
                options={sourceOptions}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    triggeredBy:
                      value === allValue
                        ? undefined
                        : (value as TScanListFilters['triggeredBy']),
                  }))
                }
              />
            </div>
          </div>

          {isPending && <Skeleton className='h-96 w-full rounded-lg' />}

          {isError && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {!isPending && !isError && scans.length > 0 && (
            <>
              <SinglePageScanTable scans={scans} />
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <p className='text-[13px] text-muted-foreground'>
                  Showing {scans.length} {scans.length === 1 ? 'scan' : 'scans'}
                </p>
                {hasNextPage && (
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
                )}
              </div>
            </>
          )}

          {!isPending && !isError && scans.length === 0 && (
            <div className='flex flex-col items-center gap-2.5 rounded-lg border border-border px-6 py-12 text-center'>
              {isFiltered ? (
                <>
                  <p className='font-semibold'>No scans match these filters</p>
                  <p className='text-sm text-muted-foreground'>
                    Try another status or source.
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setFilters({})}
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No scans yet.{' '}
                  <Link to='/u/scan' className='font-medium underline'>
                    Scan a page
                  </Link>{' '}
                  to see it here.
                </p>
              )}
            </div>
          )}
        </section>
      </Main>
    </>
  )
}
