import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { ruleModeLabels } from '@constants/rules'
import type { TRule } from '@typings/rules'
import { getRuleModes } from '@utils/get-rule-modes'
import { parseWcag } from '@utils/parse-wcag'
import { RuleSetPill } from '@modules/rules/ui/rule-set-pill'
import { SeverityPill } from '@modules/rules/ui/severity-pill'

type RuleRowProps = {
  rule: TRule
}

export const RuleRow: React.FC<RuleRowProps> = ({ rule }) => {
  const isCore = rule.ruleSets.includes('CORE')
  const wcag = parseWcag(rule.wcag)
    .map((item) => item.criterion)
    .join(', ')

  return (
    <li className='group relative rounded-lg border border-border bg-card transition-colors hover:border-input hover:bg-muted/40 has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50'>
      <div className='grid grid-cols-[minmax(0,1fr)_20px] items-center gap-x-5 gap-y-2 px-5 py-4.5 md:grid-cols-[84px_minmax(0,1fr)_auto_20px]'>
        <span
          aria-hidden
          className='self-start pt-0.5 font-mono text-[13px] font-semibold text-primary max-md:col-start-1'
        >
          {rule.id}
        </span>
        <div className='min-w-0 max-md:col-start-1'>
          <h3 className='text-base leading-[1.4] font-semibold'>
            <Link
              to={`/rules/${rule.id}`}
              className='outline-none after:absolute after:inset-0 after:rounded-lg'
            >
              <span className='sr-only'>{rule.id} </span>
              {rule.name}
            </Link>
          </h3>
          <p className='mt-1 text-sm leading-[1.55] text-pretty text-muted-foreground'>
            {rule.summary}
          </p>
          <p className='mt-2 font-mono text-xs text-muted-foreground'>
            {wcag ? `WCAG ${wcag}` : 'No direct WCAG criterion'} ·{' '}
            {ruleModeLabels[getRuleModes(rule)].short}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-1.5 max-md:col-start-1 md:justify-end'>
          <SeverityPill severity={rule.severity} />
          <RuleSetPill isCore={isCore}>
            {isCore ? 'Core' : 'Full only'}
          </RuleSetPill>
        </div>
        <ChevronRight
          aria-hidden
          className='size-4.5 text-muted-foreground transition-[color,translate] group-hover:translate-x-0.75 group-hover:text-primary max-md:col-start-2 max-md:row-start-1'
        />
      </div>
    </li>
  )
}
