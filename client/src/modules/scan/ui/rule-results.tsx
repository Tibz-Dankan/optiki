import { Link } from 'react-router-dom'
import {
  categoryLabels,
  categoryOrder,
  ruleResultLabels,
  severityLabels,
} from '@constants/scan'
import type { TRule } from '@typings/rules'
import type { TScanFinding, TScanRuleResult } from '@typings/scan'
import { cn } from '@utils/classname'
import { FindingCard } from '@modules/scan/ui/finding-card'

type RuleResultsProps = {
  rules: TScanRuleResult[]
  findings: TScanFinding[]
  catalog: TRule[]
}

const resultTones: Record<TScanRuleResult['result'], string> = {
  PASS: 'text-success',
  FAIL: 'text-destructive',
  NOT_APPLICABLE: 'text-muted-foreground',
  NEEDS_RENDERED: 'text-muted-foreground',
}

export const RuleResults: React.FC<RuleResultsProps> = ({
  rules,
  findings,
  catalog,
}) => {
  return (
    <div className='grid grid-cols-[minmax(0,1fr)] gap-8'>
      {categoryOrder.map((category) => {
        const categoryRules = rules.filter((rule) => rule.category === category)
        if (categoryRules.length === 0) return null
        return (
          <section key={category} aria-labelledby={`category-${category}`}>
            <h2 id={`category-${category}`} className='text-lg font-semibold'>
              {categoryLabels[category]}
            </h2>
            <ul className='mt-3 grid grid-cols-[minmax(0,1fr)] gap-3'>
              {categoryRules.map((rule) => {
                const ruleFindings = findings.filter(
                  (finding) => finding.ruleID === rule.ruleID
                )
                const meta = catalog.find((entry) => entry.id === rule.ruleID)
                return (
                  <li
                    key={rule.ruleID}
                    className='rounded-lg border border-border p-4'
                  >
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                      <Link
                        to={`/rules/${rule.ruleID}`}
                        className='font-mono text-sm font-semibold underline-offset-4 hover:underline'
                      >
                        {rule.ruleID}
                      </Link>
                      <span className='font-medium'>{rule.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        {severityLabels[rule.severity]}
                      </span>
                      <span
                        className={cn(
                          'ms-auto text-sm font-medium',
                          resultTones[rule.result]
                        )}
                      >
                        {ruleResultLabels[rule.result]}
                        {rule.result === 'FAIL' &&
                          ` · ${rule.findingsCount} ${rule.findingsCount === 1 ? 'finding' : 'findings'}`}
                      </span>
                    </div>
                    {ruleFindings.length > 0 && (
                      <div className='mt-3 grid grid-cols-[minmax(0,1fr)] gap-3'>
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
    </div>
  )
}
