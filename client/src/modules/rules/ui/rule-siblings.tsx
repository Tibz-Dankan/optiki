import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { categoryLabels } from '@constants/scan'
import type { TRule } from '@typings/rules'
import { SeverityPill } from '@modules/rules/ui/severity-pill'

type RuleSiblingsProps = {
  rule: TRule
  rules: TRule[]
}

export const RuleSiblings: React.FC<RuleSiblingsProps> = ({ rule, rules }) => {
  const siblings = rules.filter(
    (sibling) => sibling.category === rule.category && sibling.id !== rule.id
  )
  if (siblings.length === 0) return null

  const label = categoryLabels[rule.category]

  return (
    <section aria-labelledby='more-heading'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2
          id='more-heading'
          className='text-[22px] font-bold tracking-[-0.02em]'
        >
          More {label} rules
        </h2>
        <Link
          to={`/rules#rules-${rule.category.toLowerCase()}`}
          className='text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-primary'
        >
          See all in {label}
        </Link>
      </div>
      <ul className='mt-3.5 grid gap-2'>
        {siblings.map((sibling) => (
          <li
            key={sibling.id}
            className='group relative rounded-lg border border-border bg-card transition-colors hover:border-input hover:bg-muted/40 has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50'
          >
            <div className='grid grid-cols-[minmax(0,1fr)_auto_18px] items-center gap-4 py-3.5 ps-4.5 pe-4 sm:grid-cols-[80px_minmax(0,1fr)_auto_18px]'>
              <span
                aria-hidden
                className='hidden font-mono text-[13px] font-semibold text-primary sm:block'
              >
                {sibling.id}
              </span>
              <Link
                to={`/rules/${sibling.id}`}
                className='min-w-0 text-[15px] font-semibold outline-none after:absolute after:inset-0 after:rounded-lg'
              >
                <span className='sr-only'>{sibling.id} </span>
                {sibling.name}
              </Link>
              <SeverityPill severity={sibling.severity} className='h-5.5' />
              <ChevronRight
                aria-hidden
                className='size-4.5 text-muted-foreground transition-[color,translate] group-hover:translate-x-0.75 group-hover:text-primary'
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
