import { useParams } from 'react-router-dom'
import type {
  TMultiplePageScan,
  TMultiplePageScanPage,
  TPageCounts,
} from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { formatAddress } from '@utils/format-address'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { useMultiplePageScanReport } from '@hooks/use-multiple-page-scan-report'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { Skeleton } from '@shared/ui/skeleton'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { NotFoundError } from '@shared/pages/not-found-error'
import { FixReportSection } from '@modules/scan/ui/fix-report-section'
import { MultiplePageRuleSummary } from '@modules/scan/ui/multiple-page-rule-summary'
import { MultiplePageScanBreadcrumb } from '@modules/scan/ui/multiple-page-scan-breadcrumb'
import { MultiplePageScanHeader } from '@modules/scan/ui/multiple-page-scan-header'
import { MultiplePageScanPages } from '@modules/scan/ui/multiple-page-scan-pages'
import { MultiplePageScanProgress } from '@modules/scan/ui/multiple-page-scan-progress'
import { MultiplePageScanSkipped } from '@modules/scan/ui/multiple-page-scan-skipped'
import { MultiplePageStartScreenshot } from '@modules/scan/ui/multiple-page-start-screenshot'
import { ScoreSummary } from '@modules/scan/ui/score-summary'

const sumCompletedPageCounts = (pages: TMultiplePageScanPage[]): TPageCounts =>
  pages
    .filter((page) => page.status === 'COMPLETED')
    .reduce(
      (sum, { counts }) => ({
        findings: sum.findings + counts.findings,
        critical: sum.critical + counts.critical,
        serious: sum.serious + counts.serious,
        moderate: sum.moderate + counts.moderate,
        minor: sum.minor + counts.minor,
      }),
      { findings: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }
    )

const MultiplePageScores: React.FC<{
  scan: TMultiplePageScan
  className: string
}> = ({ scan, className }) => {
  const isActive = isMultiplePageScanActive(scan)
  const { pagesScanned } = scan.progress
  const rulesFailed = scan.rules.filter((rule) => rule.pagesFailed > 0).length

  if (scan.status === 'FAILED' && scan.scores.overall === null) return null

  return (
    <ScoreSummary
      scores={scan.scores}
      counts={isActive ? sumCompletedPageCounts(scan.pages) : scan.counts}
      note={
        isActive
          ? 'Scan in progress'
          : `Average across ${pagesScanned} scanned ${pagesScanned === 1 ? 'page' : 'pages'}`
      }
      findingsNote={`${rulesFailed} ${rulesFailed === 1 ? 'rule' : 'rules'} failed on at least one page`}
      pendingText={
        isActive
          ? 'Scores appear when every page is scanned. Each finished page is already listed below with its own score.'
          : undefined
      }
      className={className}
    />
  )
}

export const MultiplePageScanReport: React.FC = () => {
  const { id = '' } = useParams()
  const { data, isPending, isError, error } = useMultiplePageScanReport(id)

  if (isError && isHttpError(error) && [400, 404].includes(error.status)) {
    return <NotFoundError />
  }

  const scan = data?.data

  return (
    <>
      <Header>
        <MultiplePageScanBreadcrumb id={id} />
        <div className='ms-auto flex shrink-0 items-center gap-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6'>
          {isPending && (
            <div className='grid gap-4'>
              <Skeleton className='h-24 w-2/3' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-80 w-full' />
            </div>
          )}

          {isError && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {scan && (
            <>
              <MultiplePageScanHeader scan={scan} />
              <MultiplePageScanProgress scan={scan} />

              <div className='flex flex-wrap items-stretch gap-4 empty:hidden'>
                <MultiplePageScores
                  scan={scan}
                  className='min-w-0 flex-[999_1_560px]'
                />
                <MultiplePageStartScreenshot
                  page={scan.pages[0]}
                  title={formatAddress(describeMultiplePageScan(scan))}
                  className='min-w-0 flex-[1_1_320px]'
                />
              </div>

              {scan.status === 'COMPLETED' && (
                <FixReportSection
                  scanID={scan.id}
                  multiplePage
                  canGenerate
                  hasFindings={scan.counts.findings > 0}
                />
              )}

              <MultiplePageRuleSummary rules={scan.rules} />
              <MultiplePageScanPages
                pages={scan.pages}
                worstFirst={scan.status === 'COMPLETED'}
                isActive={isMultiplePageScanActive(scan)}
              />
              <MultiplePageScanSkipped skipped={scan.skipped} />
            </>
          )}
        </div>
      </Main>
    </>
  )
}
