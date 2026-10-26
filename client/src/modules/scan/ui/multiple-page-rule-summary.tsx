import { Link } from 'react-router-dom'
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
    <section aria-labelledby='rollup-heading' className='grid gap-3'>
      <h2 id='rollup-heading' className='text-xl font-semibold'>
        Issues across the pages
      </h2>
      {failing.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {rules.length === 0
            ? 'Rule results appear here as pages finish.'
            : 'No rule failed on any scanned page.'}
        </p>
      ) : (
        <ul className='grid gap-2'>
          {failing.map((rule) => (
            <li
              key={rule.ruleID}
              className='flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-sm'
            >
              <Link
                to={`/rules/${rule.ruleID}`}
                className='font-medium underline-offset-4 hover:underline'
              >
                {rule.ruleID} {rule.name}
              </Link>
              <span
                className={cn(
                  'rounded-md border px-1.5 py-0.5 text-xs font-medium',
                  severityTones[rule.severity]
                )}
              >
                {severityLabels[rule.severity]}
              </span>
              <span className='ms-auto text-muted-foreground'>
                Fails on {rule.pagesFailed} of {rule.pagesChecked}{' '}
                {rule.pagesChecked === 1 ? 'page' : 'pages'} · {rule.findings}{' '}
                {rule.findings === 1 ? 'finding' : 'findings'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
