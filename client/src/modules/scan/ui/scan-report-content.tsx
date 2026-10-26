import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  ExternalLink,
  Layers,
  Lock,
  ScanSearch,
  Users,
} from 'lucide-react'
import { scanSources, statusLabels } from '@constants/scan'
import type { TScanCounts, TScanReport } from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { rulesAPI, rulesKeys } from '@api/rules'
import { describeScanHeading } from '@utils/describe-scan-heading'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatAddress } from '@utils/format-address'
import { formatDateTime } from '@utils/format-date-time'
import { formatDuration } from '@utils/format-duration'
import { formatRelativeTime } from '@utils/format-relative-time'
import { useScanReport } from '@hooks/use-scan-report'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'
import { NotFoundError } from '@shared/pages/not-found-error'
import { FixReportSection } from '@modules/scan/ui/fix-report-section'
import { RuleResults } from '@modules/scan/ui/rule-results'
import { RuleSetBanner } from '@modules/scan/ui/rule-set-banner'
import { ScanInputTypeIcon } from '@modules/scan/ui/scan-input-type-icon'
import { ScanOwnerActions } from '@modules/scan/ui/scan-owner-actions'
import { ScanScreenshot } from '@modules/scan/ui/scan-screenshot'
import { ScanStatusBadge } from '@modules/scan/ui/scan-status-badge'
import { ScoreSummary } from '@modules/scan/ui/score-summary'

const describeRuleCounts = (counts: TScanCounts) =>
  [
    `${counts.rulesFailed} ${counts.rulesFailed === 1 ? 'rule' : 'rules'} failed`,
    `${counts.rulesPassed} passed`,
    `${counts.rulesNotApplicable} not applicable`,
    counts.rulesNeedRendered > 0 &&
      `${counts.rulesNeedRendered} need a rendered scan`,
  ]
    .filter(Boolean)
    .join(' · ')

const Dot: React.FC = () => (
  <span aria-hidden className='text-muted-foreground/60'>
    ·
  </span>
)

const ReportHeader: React.FC<{
  scan: TScanReport
  scanAnotherPath: string
}> = ({ scan, scanAnotherPath }) => {
  const { title, subtitle } = describeScanHeading(scan)
  const source = scanSources[scan.triggeredBy]
  const SourceIcon = source.icon
  const isPublic = scan.visibility === 'PUBLIC'

  return (
    <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-4'>
      <div className='flex min-w-0 flex-[1_1_480px] items-start gap-4'>
        <ScanInputTypeIcon
          inputType={scan.inputType}
          className='size-12 rounded-lg border border-border bg-card text-primary [&_svg]:size-5.5'
        />
        <div className='grid min-w-0 gap-1.5'>
          <h1 className='text-[28px] leading-tight font-bold tracking-tight wrap-anywhere'>
            {title}
          </h1>
          {scan.inputType === 'URL' && scan.target.url ? (
            <a
              href={scan.target.url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 justify-self-start text-sm break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
            >
              {formatAddress(scan.target.url)}
              <ExternalLink className='size-3.25 shrink-0' aria-hidden />
              <span className='sr-only'> (opens in a new tab)</span>
            </a>
          ) : (
            subtitle && (
              <p className='text-sm text-muted-foreground'>{subtitle}</p>
            )
          )}
          <div className='mt-1 flex flex-wrap items-center gap-2'>
            <ScanStatusBadge
              status={scan.status}
              label={statusLabels[scan.status]}
            />
            <Badge variant='secondary' className='rounded-lg'>
              {scan.mode === 'RENDERED' ? 'Rendered' : 'Static'}
            </Badge>
            <Badge variant='secondary' className='rounded-lg'>
              {scan.ruleSet === 'FULL' ? 'All 17 rules' : '9 core rules'}
            </Badge>
            <Badge variant='outline' className='rounded-lg'>
              {isPublic ? <Users aria-hidden /> : <Lock aria-hidden />}
              {isPublic ? 'Public' : 'Private'}
            </Badge>
            <Dot />
            <span className='inline-flex items-center gap-1.5 text-[13px] text-muted-foreground'>
              <SourceIcon className='size-3.5' aria-hidden />
              {source.label}
            </span>
            <Dot />
            <span className='inline-flex items-center gap-1.5 text-[13px] text-muted-foreground'>
              <Clock className='size-3.5' aria-hidden />
              <span>
                Scanned{' '}
                <time
                  dateTime={scan.createdAt}
                  title={formatDateTime(scan.createdAt)}
                >
                  {formatRelativeTime(scan.createdAt)}
                </time>
                {!!scan.timing.durationMs &&
                  ` · took ${formatDuration(scan.timing.durationMs)}`}
              </span>
            </span>
          </div>
          {scan.multiplePageScanID && scan.isOwner && (
            <Link
              to={`/u/scans/multiple/${scan.multiplePageScanID}`}
              className='mt-1 inline-flex items-center gap-2 justify-self-start rounded-lg bg-primary/10 px-2.5 py-1.5 text-[13px] font-medium text-primary hover:bg-primary/15'
            >
              <Layers className='size-3.5' aria-hidden />
              Part of a multiple-page scan · View all scanned pages
            </Link>
          )}
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button asChild variant='outline'>
          <Link to={scanAnotherPath}>
            <ScanSearch aria-hidden />
            Scan another page
          </Link>
        </Button>
        {scan.isOwner && <ScanOwnerActions scan={scan} redirectTo='/u/scans' />}
      </div>
    </div>
  )
}

type ScanReportContentProps = {
  id: string
  scanAnotherPath: string
}

export const ScanReportContent: React.FC<ScanReportContentProps> = ({
  id,
  scanAnotherPath,
}) => {
  const { data, isPending, isError, error } = useScanReport(id)
  const { data: catalog } = useQuery({
    queryKey: rulesKeys.list(),
    queryFn: rulesAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })

  if (isError && isHttpError(error) && [400, 404].includes(error.status)) {
    return <NotFoundError />
  }

  return (
    <>
      {isPending && (
        <div className='grid gap-4'>
          <Skeleton className='h-24 w-2/3' />
          <Skeleton className='h-80 w-full' />
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
          <ReportHeader scan={data.data} scanAnotherPath={scanAnotherPath} />

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
              <div className='flex flex-wrap items-stretch gap-4'>
                <ScoreSummary
                  scores={data.data.scores}
                  rules={data.data.rules}
                  counts={data.data.counts}
                  note={
                    data.data.rules.length > 0
                      ? `${data.data.rules.length} rules on 1 page`
                      : undefined
                  }
                  findingsNote={describeRuleCounts(data.data.counts)}
                  className='min-w-0 flex-[999_1_560px]'
                />
                {data.data.screenshot && (
                  <ScanScreenshot
                    screenshot={data.data.screenshot}
                    label={describeScanTarget(data.data)}
                    path={data.data.target.route}
                    className='min-w-0 flex-[1_1_320px]'
                  />
                )}
              </div>
              <FixReportSection
                scanID={data.data.id}
                canGenerate={data.data.isOwner}
                hasFindings={data.data.counts.findings > 0}
              />
              <RuleResults
                rules={data.data.rules}
                findings={data.data.findings}
                catalog={catalog?.data ?? []}
                scores={data.data.scores}
              />
              {data.data.counts.findingsTruncated && (
                <p className='text-sm text-muted-foreground'>
                  Showing the first 500 of {data.data.counts.findings} findings.
                </p>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
