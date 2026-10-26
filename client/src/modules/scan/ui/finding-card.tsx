import { ChevronRight } from 'lucide-react'
import type { TRule } from '@typings/rules'
import type { TScanFinding } from '@typings/scan'
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
      className='grid gap-2.5 rounded-lg border border-border bg-background p-3.5'
    >
      <p className='text-sm leading-normal'>{finding.message}</p>
      {finding.accessibleName && (
        <p className='text-xs text-muted-foreground'>
          Accessible name: “{finding.accessibleName}”
        </p>
      )}
      <code className='font-mono text-xs break-all text-muted-foreground'>
        {finding.selectorPath}
      </code>
      <CodeBlock
        title='Snippet · html'
        language='html'
        code={finding.snippet}
        copyLabel={`Copy snippet of ${findingLabel}`}
      />
      {rule && (
        <details className='group text-sm'>
          <summary className='inline-flex cursor-pointer list-none items-center gap-1.5 font-medium text-primary [&::-webkit-details-marker]:hidden'>
            <ChevronRight
              className='size-3.5 transition-transform group-open:rotate-90'
              aria-hidden
            />
            How to fix {finding.ruleID}
          </summary>
          <div className='mt-2.5 grid gap-2.5'>
            <p className='text-muted-foreground'>{rule.fix}</p>
            <div className='grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
              <CodeBlock
                title='Current'
                language={getCodeLanguage(rule.fixBefore)}
                code={rule.fixBefore}
                copyLabel={`Copy current example for ${findingLabel}`}
                className='border-destructive/30'
              />
              <CodeBlock
                title='Expected'
                language={getCodeLanguage(rule.fixAfter)}
                code={rule.fixAfter}
                copyLabel={`Copy expected example for ${findingLabel}`}
                className='border-success/30'
              />
            </div>
          </div>
        </details>
      )}
    </article>
  )
}
