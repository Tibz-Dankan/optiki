import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { inputTypeLabels, triggeredByLabels } from '@constants/scan'
import { isHttpError } from '@api/http-error'
import { rulesAPI, rulesKeys } from '@api/rules'
import { scanAPI, scanKeys } from '@api/scan'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatDateTime } from '@utils/format-date-time'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'
import { NotFoundError } from '@shared/pages/not-found-error'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { RuleResults } from '@modules/scan/ui/rule-results'
import { RuleSetBanner } from '@modules/scan/ui/rule-set-banner'
import { ScanOwnerActions } from '@modules/scan/ui/scan-owner-actions'
import { ScanScreenshot } from '@modules/scan/ui/scan-screenshot'
import { ScoreSummary } from '@modules/scan/ui/score-summary'

// Screenshot links are signed for 30 minutes; refetching sooner keeps an open report's image alive.
const screenshotRefresh = 25 * 60 * 1000

export const ScanReport: React.FC = () => {
  const { id = '' } = useParams()

  const { data, isPending, isError, error } = useQuery({
    queryKey: scanKeys.detail(id),
    queryFn: () => scanAPI.getOne(id),
    enabled: !!id,
    staleTime: screenshotRefresh,
    refetchInterval: screenshotRefresh,
  })
  const { data: catalog } = useQuery({
    queryKey: rulesKeys.list(),
    queryFn: rulesAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })

  if (isError && isHttpError(error) && [400, 404].includes(error.status)) {
    return <NotFoundError />
  }

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-6 py-12'>
        {isPending && (
          <div className='grid gap-4'>
            <Skeleton className='h-10 w-2/3' />
            <Skeleton className='h-48 w-full' />
            <Skeleton className='h-96 w-full' />
          </div>
        )}

        {isError && (
          <p role='alert' className='text-sm text-destructive'>
            {error.message}
          </p>
        )}

        {data && (
          <>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='min-w-0'>
                <h1 className='text-2xl font-bold tracking-tight break-all md:text-3xl'>
                  {describeScanTarget(data.data)}
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {inputTypeLabels[data.data.inputType]} ·{' '}
                  {triggeredByLabels[data.data.triggeredBy]} ·{' '}
                  {formatDateTime(data.data.createdAt)}
                </p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  <Badge variant='secondary'>
                    {data.data.mode === 'RENDERED' ? 'Rendered' : 'Static'}
                  </Badge>
                  <Badge variant='secondary'>
                    {data.data.ruleSet === 'FULL'
                      ? 'All 17 rules'
                      : '9 core rules'}
                  </Badge>
                  <Badge variant='outline'>
                    {data.data.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {data.data.isOwner && <ScanOwnerActions scan={data.data} />}
                <Button asChild size='sm'>
                  <Link to='/scan'>Scan another page</Link>
                </Button>
              </div>
            </div>

            <RuleSetBanner scan={data.data} />

            {data.data.status === 'FAILED' ? (
              <p
                role='alert'
                className='rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'
              >
                This scan failed: {data.data.error?.message}
              </p>
            ) : (
              <>
                <ScoreSummary
                  scores={data.data.scores}
                  rules={data.data.rules}
                />
                {data.data.screenshot && (
                  <ScanScreenshot
                    screenshot={data.data.screenshot}
                    label={describeScanTarget(data.data)}
                  />
                )}
                <RuleResults
                  rules={data.data.rules}
                  findings={data.data.findings}
                  catalog={catalog?.data ?? []}
                />
                {data.data.counts.findingsTruncated && (
                  <p className='text-sm text-muted-foreground'>
                    Showing the first 500 of {data.data.counts.findings}{' '}
                    findings.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </HomeLayout>
  )
}
