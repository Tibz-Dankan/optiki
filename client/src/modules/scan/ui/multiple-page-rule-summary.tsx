import { Link } from 'react-router-dom'
import { TriangleAlert, X } from 'lucide-react'
import { severityLabels, severityTones } from '@constants/scan'
import type { TMultiplePageScanRule } from '@typings/scan'
import { cn } from '@utils/classname'

type MultiplePageRuleSummaryProps = {
  rules: TMultiplePageScanRule[]
}

export const MultiplePageRuleSummary: React.FC<
  MultiplePageRuleSummaryProps
> = ({ rules }) => {
  const failing = rules
    .filter((rule) => rule.pagesFailed > 0)
    .sort(
      (first, second) =>
        second.pagesFailed - first.pagesFailed ||
        first.position - second.position
    )

  return (
    <section aria-labelledby='rollup-heading' className='grid gap-3.5'>
      <h2
        id='rollup-heading'
        className='flex items-center gap-2 text-base font-semibold'
      >
        <TriangleAlert className='size-4.5 text-muted-foreground' aria-hidden />
        Issues across the pages
        <span className='inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium'>
          {failing.length}
        </span>
      </h2>
      {failing.length === 0 ? (
        <p className='rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          {rules.length === 0
            ? 'Rule results appear here as pages finish.'
            : 'No rule failed on any scanned page.'}
        </p>
      ) : (
        <ul className='divide-y divide-border overflow-hidden rounded-lg border border-border'>
          {failing.map((rule) => (
            <li
              key={rule.ruleID}
              className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3'
            >
              <span
                aria-hidden
                className='flex size-5.5 shrink-0 items-center justify-center rounded-sm bg-destructive text-background'
              >
                <X className='size-3.25' strokeWidth={3} />
              </span>
              <Link
                to={`/rules/${rule.ruleID}`}
                className='font-mono text-[13px] font-semibold underline-offset-4 hover:underline'
              >
                {rule.ruleID}
              </Link>
              <span className='text-sm font-medium'>{rule.name}</span>
              <span
                className={cn(
                  'rounded border px-1.75 py-px text-xs font-medium',
                  severityTones[rule.severity]
                )}
              >
                {severityLabels[rule.severity]}
              </span>
              <span className='ms-auto inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]'>
                <span
                  aria-hidden
                  className='h-1 w-16 overflow-hidden rounded-full bg-muted'
                >
                  <span
                    className='block h-full rounded-full bg-destructive'
                    style={{
                      width: `${(rule.pagesFailed / Math.max(rule.pagesChecked, 1)) * 100}%`,
                    }}
                  />
                </span>
                <span>
                  Fails on {rule.pagesFailed} of {rule.pagesChecked}{' '}
                  {rule.pagesChecked === 1 ? 'page' : 'pages'}
                </span>
                <span className='text-muted-foreground'>
                  {rule.findings} {rule.findings === 1 ? 'finding' : 'findings'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
