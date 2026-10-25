import { severityLabels, severityTones } from '@constants/scan'
import type { TRule } from '@typings/rules'
import type { TScanFinding } from '@typings/scan'
import { cn } from '@utils/classname'

type FindingCardProps = {
  finding: TScanFinding
  rule?: TRule
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, rule }) => {
  return (
    <article
      aria-label={`${finding.ruleID} finding at ${finding.selectorPath}`}
      className='rounded-md border border-border bg-card p-4'
    >
      <div className='flex flex-wrap items-center gap-2'>
        <span
          className={cn(
            'rounded border px-2 py-0.5 text-xs font-medium',
            severityTones[finding.severity]
          )}
        >
          {severityLabels[finding.severity]}
        </span>
        <code className='text-xs break-all text-muted-foreground'>
          {finding.selectorPath}
        </code>
      </div>
      <p className='mt-2 text-sm'>{finding.message}</p>
      {finding.accessibleName && (
        <p className='mt-1 text-xs text-muted-foreground'>
          Accessible name: “{finding.accessibleName}”
        </p>
      )}
      <pre className='mt-3 overflow-x-auto rounded bg-muted p-3 text-xs'>
        <code>{finding.snippet}</code>
      </pre>
      {rule && (
        <details className='mt-3 text-sm'>
          <summary className='cursor-pointer font-medium'>
            How to fix {finding.ruleID}
          </summary>
          <p className='mt-2 text-muted-foreground'>{rule.fix}</p>
          <div className='mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            <div>
              <p className='text-xs font-medium text-muted-foreground'>
                Before
              </p>
              <pre className='mt-1 overflow-x-auto rounded bg-muted p-3 text-xs'>
                <code>{rule.fixBefore}</code>
              </pre>
            </div>
            <div>
              <p className='text-xs font-medium text-muted-foreground'>After</p>
              <pre className='mt-1 overflow-x-auto rounded bg-muted p-3 text-xs'>
                <code>{rule.fixAfter}</code>
              </pre>
            </div>
          </div>
        </details>
      )}
    </article>
  )
}
