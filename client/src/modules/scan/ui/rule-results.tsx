import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ListChecks, Minus, Monitor, X } from 'lucide-react'
import {
  categoryLabels,
  categoryOrder,
  categoryQuestions,
  ruleResultLabels,
  severityLabels,
  severityTones,
} from '@constants/scan'
import type { TRule } from '@typings/rules'
import type { TScanFinding, TScanRuleResult, TScanScores } from '@typings/scan'
import { cn } from '@utils/classname'
import { getCategoryScore } from '@utils/get-category-score'
import { getScoreTone } from '@utils/get-score-tone'
import { FindingCard } from '@modules/scan/ui/finding-card'
import { ScanFilterGroup } from '@modules/scan/ui/scan-filter-group'

type RuleResultsProps = {
  rules: TScanRuleResult[]
  findings: TScanFinding[]
  catalog: TRule[]
  scores: TScanScores
}

type TRuleFilter = 'ALL' | 'FAIL' | 'PASS'

const resultTones: Record<TScanRuleResult['result'], string> = {
  PASS: 'text-success',
  FAIL: 'text-destructive',
  NOT_APPLICABLE: 'text-muted-foreground',
  NEEDS_RENDERED: 'text-muted-foreground',
}

const resultIcons: Record<
  TScanRuleResult['result'],
  { icon: React.ElementType; className: string }
> = {
  PASS: { icon: Check, className: 'bg-success text-background' },
  FAIL: { icon: X, className: 'bg-destructive text-background' },
  NOT_APPLICABLE: { icon: Minus, className: 'bg-muted text-muted-foreground' },
  NEEDS_RENDERED: {
    icon: Monitor,
    className: 'bg-muted text-muted-foreground',
  },
}

const countResults = (
  rules: TScanRuleResult[],
  result: TScanRuleResult['result']
) => rules.filter((rule) => rule.result === result).length

export const RuleResults: React.FC<RuleResultsProps> = ({
  rules,
  findings,
  catalog,
  scores,
}) => {
  const [filter, setFilter] = useState<TRuleFilter>('ALL')
  const visibleRules = rules.filter(
    (rule) => filter === 'ALL' || rule.result === filter
  )

  return (
    <section aria-labelledby='rules-heading' className='grid gap-3.5'>
      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
        <h2
          id='rules-heading'
          className='flex items-center gap-2 text-base font-semibold'
        >
          <ListChecks className='size-4.5 text-muted-foreground' aria-hidden />
          Rule results
        </h2>
        <ScanFilterGroup
          id='rule-filter-label'
          label='Show'
          value={filter}
          options={[
            { value: 'ALL', label: 'All', count: rules.length },
            {
              value: 'FAIL',
              label: 'Failing',
              count: countResults(rules, 'FAIL'),
            },
            {
              value: 'PASS',
              label: 'Passing',
              count: countResults(rules, 'PASS'),
            },
          ]}
          onChange={(value) => setFilter(value as TRuleFilter)}
        />
      </div>

      {visibleRules.length === 0 && (
        <p className='rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          No rules match this filter.
        </p>
      )}

      {categoryOrder.map((category) => {
        const categoryRules = rules.filter((rule) => rule.category === category)
        const shownRules = visibleRules.filter(
          (rule) => rule.category === category
        )
        if (shownRules.length === 0) return null

        const failing = countResults(categoryRules, 'FAIL')
        const passing = countResults(categoryRules, 'PASS')
        const summary =
          [
            failing > 0 && `${failing} failing`,
            passing > 0 && `${passing} passing`,
          ]
            .filter(Boolean)
            .join(' · ') ||
          (categoryRules.some((rule) => rule.result === 'NEEDS_RENDERED')
            ? ruleResultLabels.NEEDS_RENDERED
            : ruleResultLabels.NOT_APPLICABLE)
        const score = getCategoryScore(scores, category)

        return (
          <section
            key={category}
            aria-labelledby={`category-${category}`}
            className='overflow-hidden rounded-lg border border-border'
          >
            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-card px-4 py-3'>
              <h3
                id={`category-${category}`}
                className='text-[15px] font-semibold'
              >
                {categoryLabels[category]}
              </h3>
              <span className='text-[13px] text-muted-foreground'>
                {categoryQuestions[category]}
              </span>
              <span className='ms-auto text-[13px] text-muted-foreground'>
                {summary}
              </span>
              <span
                className={cn(
                  'text-[15px] font-semibold',
                  score === null ? 'text-muted-foreground' : getScoreTone(score)
                )}
              >
                <span className='sr-only'>Score </span>
                {score ?? '—'}
              </span>
            </div>
            <ul>
              {shownRules.map((rule) => {
                const ruleFindings = findings.filter(
                  (finding) => finding.ruleID === rule.ruleID
                )
                const meta = catalog.find((entry) => entry.id === rule.ruleID)
                const resultIcon = resultIcons[rule.result]
                const ResultIcon = resultIcon.icon
                return (
                  <li key={rule.ruleID} className='border-t border-border'>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3'>
                      <span
                        aria-hidden
                        className={cn(
                          'flex size-5.5 shrink-0 items-center justify-center rounded-sm',
                          resultIcon.className
                        )}
                      >
                        <ResultIcon className='size-3.25' strokeWidth={3} />
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
                      <span
                        className={cn(
                          'ms-auto text-[13px] font-medium',
                          resultTones[rule.result]
                        )}
                      >
                        {ruleResultLabels[rule.result]}
                        {rule.result === 'FAIL' &&
                          ` · ${rule.findingsCount} ${rule.findingsCount === 1 ? 'finding' : 'findings'}`}
                      </span>
                    </div>
                    {ruleFindings.length > 0 && (
                      <div className='grid grid-cols-[minmax(0,1fr)] gap-2.5 px-4 pb-4 sm:ps-12.5'>
                        {ruleFindings.map((finding) => (
                          <FindingCard
                            key={finding.id}
                            finding={finding}
                            rule={meta}
                          />
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </section>
  )
}
