import { ruleModeLabels } from '@constants/rules'
import {
  categoryLabels,
  categoryWeights,
  severityLabels,
} from '@constants/scan'
import type { TRule } from '@typings/rules'
import { getRuleModes } from '@utils/get-rule-modes'
import { parseWcag } from '@utils/parse-wcag'

type RuleDetailsProps = {
  rule: TRule
}

type TFact = {
  term: string
  lines: { main: string; note?: string }[]
}

export const RuleDetails: React.FC<RuleDetailsProps> = ({ rule }) => {
  const wcag = parseWcag(rule.wcag)
  const facts: TFact[] = [
    {
      term: 'Category',
      lines: [
        {
          main: categoryLabels[rule.category],
          note: `· ${categoryWeights[rule.category]}% of the score`,
        },
      ],
    },
    {
      term: 'Severity',
      lines: [
        {
          main: severityLabels[rule.severity],
          note: `· weight ${rule.weight}`,
        },
      ],
    },
    { term: 'Priority', lines: [{ main: rule.priority }] },
    {
      term: 'Rule sets',
      lines: [
        {
          main: rule.ruleSets.includes('CORE') ? 'Core and Full' : 'Full only',
        },
      ],
    },
    {
      term: 'Runs on',
      lines: [{ main: ruleModeLabels[getRuleModes(rule)].fact }],
    },
    {
      term: 'WCAG',
      lines:
        wcag.length > 0
          ? wcag.map((item) => ({ main: item.criterion, note: item.name }))
          : [{ main: 'No direct criterion' }],
    },
    { term: 'Origin', lines: [{ main: rule.origin }] },
  ]

  return (
    <section
      aria-labelledby='details-heading'
      className='rounded-lg border border-border bg-card p-5'
    >
      <h2 id='details-heading' className='text-[15px] font-semibold'>
        Details
      </h2>
      <dl className='mt-3.5 grid'>
        {facts.map((fact) => (
          <div
            key={fact.term}
            className='grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-t border-border py-2.75 text-sm'
          >
            <dt className='text-muted-foreground'>{fact.term}</dt>
            <dd className='min-w-0'>
              {fact.lines.map((line) => (
                <span key={line.main} className='block'>
                  {line.main}
                  {line.note && (
                    <span className='text-muted-foreground'> {line.note}</span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
