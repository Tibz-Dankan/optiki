import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { fixReportPollInterval, scanErrorMessages } from '@constants/scan'
import type { TFixReportResponse } from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { scanAPI, scanKeys } from '@api/scan'
import { formatDateTime } from '@utils/format-date-time'
import { isFixReportActive } from '@utils/is-fix-report-active'
import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'
import { FixReportMarkdown } from '@modules/scan/ui/fix-report-markdown'

type FixReportSectionProps = {
  scanID: string
  multiplePage?: boolean
  canGenerate: boolean
  hasFindings: boolean
}

const downloadMarkdown = (content: string, fileName: string) => {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/markdown;charset=utf-8' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const FixReportSection: React.FC<FixReportSectionProps> = ({
  scanID,
  multiplePage = false,
  canGenerate,
  hasFindings,
}) => {
  const queryClient = useQueryClient()
  const { copied, copy } = useCopyToClipboard()
  const queryKey = multiplePage
    ? scanKeys.multipleFixReport(scanID)
    : scanKeys.fixReport(scanID)

  const { data, isPending, isError } = useQuery({
    queryKey,
    queryFn: () =>
      multiplePage
        ? scanAPI.getMultiplePageFixReport(scanID)
        : scanAPI.getFixReport(scanID),
    enabled: !!scanID,
    refetchInterval: (query) =>
      isFixReportActive(query.state.data?.data) ? fixReportPollInterval : false,
  })

  const generate = useMutation({
    mutationFn: multiplePage
      ? scanAPI.createMultiplePageFixReport
      : scanAPI.createFixReport,
    onSuccess: (response) => {
      queryClient.setQueryData<TFixReportResponse>(queryKey, response)
    },
    onError: (error) => {
      toast.error(
        (isHttpError(error) && scanErrorMessages[error.error]) || error.message
      )
      if (isHttpError(error) && error.status === 409) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  if (isPending) return <Skeleton className='h-32 w-full' />
  if (isError) return null

  const report = data.data
  if (!report && (!hasFindings || !canGenerate)) return null

  const generateButton = (label: string) => (
    <Button
      type='button'
      size='sm'
      variant={report ? 'outline' : 'default'}
      disabled={generate.isPending}
      onClick={() => generate.mutate({ id: scanID })}
    >
      {generate.isPending ? (
        <Loader2 className='animate-spin' aria-hidden />
      ) : report ? (
        <RefreshCw aria-hidden />
      ) : (
        <Sparkles aria-hidden />
      )}
      {label}
    </Button>
  )

  return (
    <section
      aria-labelledby='fix-report-heading'
      className='grid gap-4 rounded-lg border border-border p-6'
    >
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h2 id='fix-report-heading' className='text-lg font-semibold'>
            Fix report
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            A detailed prompt that tells your coding agent (Claude Code, Codex,
            Cursor, Antigravity or any other) exactly what to fix and how. Copy
            it and paste it in.
          </p>
        </div>

        {report?.status === 'COMPLETED' && report.content && (
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              size='sm'
              onClick={() => copy(report.content ?? '')}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? 'Copied' : 'Copy prompt'}
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() =>
                downloadMarkdown(
                  report.content ?? '',
                  `optiki-fix-report-${scanID.slice(0, 8)}.md`
                )
              }
            >
              <Download aria-hidden />
              Download .md
            </Button>
          </div>
        )}
        {!report && generateButton('Generate report')}
      </div>

      {isFixReportActive(report) && (
        <p
          role='status'
          className='flex items-center gap-2 text-sm text-muted-foreground'
        >
          <Loader2 className='size-4 animate-spin' aria-hidden />
          Generating your fix report with Gemini. This usually takes under a
          minute.
        </p>
      )}

      {report?.status === 'FAILED' && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4'>
          <p className='text-sm text-destructive'>
            {report.error?.message ?? 'The fix report could not be generated.'}
          </p>
          {canGenerate && generateButton('Try again')}
        </div>
      )}

      {report?.status === 'COMPLETED' && report.content && (
        <>
          <div
            role='region'
            aria-label='Fix prompt'
            tabIndex={0}
            className='max-h-160 overflow-auto rounded-md border border-border bg-background p-4 sm:p-5'
          >
            <FixReportMarkdown content={report.content} />
          </div>
          <p className='text-xs text-muted-foreground'>
            {report.timing.completedAt
              ? `${formatDateTime(report.timing.completedAt)} · covers`
              : 'Covers'}{' '}
            {report.findingsCovered}{' '}
            {report.findingsCovered === 1 ? 'finding' : 'findings'}. It quotes
            markup from the scanned page, so read it before you run it.
          </p>
        </>
      )}
    </section>
  )
}
