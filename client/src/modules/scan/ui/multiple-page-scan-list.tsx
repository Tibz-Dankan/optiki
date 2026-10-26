import { useInfiniteQuery } from '@tanstack/react-query'
import { Layers, Loader2 } from 'lucide-react'
import { multiplePageScanPollInterval, scanPageSize } from '@constants/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { Button } from '@shared/ui/button'
import { MultiplePageScanCard } from '@modules/scan/ui/multiple-page-scan-card'

export const MultiplePageScanList: React.FC = () => {
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
    <section
      aria-labelledby='multiple-page-scans-heading'
      className='mt-10 grid gap-3.5'
    >
      <h2
        id='multiple-page-scans-heading'
        className='flex items-center gap-2 text-base font-semibold'
      >
        <Layers className='size-4.5 text-muted-foreground' aria-hidden />
        Multiple-page scans
        <span className='inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium'>
          {scans.length}
          {hasNextPage && '+'}
        </span>
      </h2>
      <div className='grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]'>
        {scans.map((scan) => (
          <MultiplePageScanCard key={scan.id} scan={scan} />
        ))}
      </div>

      {hasNextPage && (
        <div className='flex justify-center'>
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
    </section>
  )
}
