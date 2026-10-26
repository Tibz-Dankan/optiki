import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  multiplePageScanPollInterval,
  multiplePageScanStatusLabels,
  triggeredByLabels,
} from '@constants/scan'
import type { TMultiplePageScanSummary } from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { scanAPI, scanKeys } from '@api/scan'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { formatDateTime } from '@utils/format-date-time'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { Skeleton } from '@shared/ui/skeleton'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { NotFoundError } from '@shared/pages/not-found-error'
import { DeleteMultiplePageScanDialog } from '@modules/scan/ui/delete-multiple-page-scan-dialog'
import { MultiplePageRuleSummary } from '@modules/scan/ui/multiple-page-rule-summary'
import { MultiplePageScanPages } from '@modules/scan/ui/multiple-page-scan-pages'
import { MultiplePageScanProgress } from '@modules/scan/ui/multiple-page-scan-progress'
import { MultiplePageScanSkipped } from '@modules/scan/ui/multiple-page-scan-skipped'
import { ScoreSummary } from '@modules/scan/ui/score-summary'

export const MultiplePageScanReport: React.FC = () => {
  const { id = '' } = useParams()
  const [scanToDelete, setScanToDelete] =
    useState<TMultiplePageScanSummary | null>(null)

  const { data, isPending, isError, error } = useQuery({
    queryKey: scanKeys.multipleDetail(id),
    queryFn: () => scanAPI.getOneMultiplePage(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const scan = query.state.data?.data
      return scan && isMultiplePageScanActive(scan)
        ? multiplePageScanPollInterval
        : false
    },
  })

  if (isError && isHttpError(error) && [400, 404].includes(error.status)) {
    return <NotFoundError />
  }

  const scan = data?.data
  const isActive = scan ? isMultiplePageScanActive(scan) : false

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
        <div className='mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6'>
          {isPending && (
            <div className='grid gap-4'>
              <Skeleton className='h-10 w-2/3' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-96 w-full' />
            </div>
          )}

          {isError && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {scan && (
            <>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <h1 className='text-2xl font-bold tracking-tight break-all md:text-3xl'>
                    {describeMultiplePageScan(scan)}
                  </h1>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Multiple pages · {triggeredByLabels[scan.triggeredBy]} ·{' '}
                    {formatDateTime(scan.createdAt)}
                  </p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <Badge variant='outline'>
                      {multiplePageScanStatusLabels[scan.status]}
                    </Badge>
                    <Badge variant='secondary'>
                      {scan.mode === 'RENDERED' ? 'Rendered' : 'Static'}
                    </Badge>
                    <Badge variant='secondary'>
                      {scan.ruleSet === 'FULL'
                        ? 'All 17 rules'
                        : '9 core rules'}
                    </Badge>
                    <Badge variant='outline'>Private</Badge>
                  </div>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <Button asChild size='sm'>
                    <Link to='/u/scan'>Scan another page</Link>
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={isActive}
                    onClick={() => setScanToDelete(scan)}
                  >
                    Delete multiple-page scan
                  </Button>
                </div>
              </div>

              <MultiplePageScanProgress scan={scan} />

              {scan.status === 'COMPLETED' && (
                <div className='grid gap-2'>
                  <ScoreSummary scores={scan.scores} rules={[]} />
                  <p className='text-sm text-muted-foreground'>
                    Scores are the average across the{' '}
                    {scan.progress.pagesScanned} scanned{' '}
                    {scan.progress.pagesScanned === 1 ? 'page' : 'pages'}.
                  </p>
                </div>
              )}

              <MultiplePageRuleSummary rules={scan.rules} />
              <MultiplePageScanPages
                pages={scan.pages}
                worstFirst={scan.status === 'COMPLETED'}
              />
              <MultiplePageScanSkipped skipped={scan.skipped} />
            </>
          )}
        </div>

        <DeleteMultiplePageScanDialog
          scan={scanToDelete}
          onOpenChange={(open) => !open && setScanToDelete(null)}
          redirectTo='/u/scans'
        />
      </Main>
    </>
  )
}
