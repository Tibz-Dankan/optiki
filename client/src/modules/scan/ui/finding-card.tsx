import { severityLabels, severityTones } from '@constants/scan'
import type { TRule } from '@typings/rules'
import type { TScanFinding } from '@typings/scan'
import { cn } from '@utils/classname'
import { getCodeLanguage } from '@utils/get-code-language'
import { CodeBlock } from '@shared/ui/code-block'

type FindingCardProps = {
  finding: TScanFinding
  rule?: TRule
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, rule }) => {
  const findingLabel = `${finding.ruleID} finding at ${finding.selectorPath}`

  return (
    <article
      aria-label={findingLabel}
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
      <CodeBlock
        title='Snippet'
        language='html'
        code={finding.snippet}
        copyLabel={`Copy snippet of ${findingLabel}`}
        className='mt-3'
      />
      {rule && (
        <details className='mt-3 text-sm'>
          <summary className='cursor-pointer font-medium'>
            How to fix {finding.ruleID}
          </summary>
          <p className='mt-2 text-muted-foreground'>{rule.fix}</p>
          <div className='mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            <CodeBlock
              title='Before'
              language={getCodeLanguage(rule.fixBefore)}
              code={rule.fixBefore}
              copyLabel={`Copy before example for ${findingLabel}`}
            />
            <CodeBlock
              title='After'
              language={getCodeLanguage(rule.fixAfter)}
              code={rule.fixAfter}
              copyLabel={`Copy after example for ${findingLabel}`}
            />
          </div>
        </details>
      )}
    </article>
  )
}
