import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { TRule } from '@typings/rules'
import { cn } from '@utils/classname'

type RulePagerProps = {
  rule: TRule
  rules: TRule[]
}

type PagerLinkProps = {
  rule: TRule
  isNext?: boolean
}

const PagerLink: React.FC<PagerLinkProps> = ({ rule, isNext = false }) => {
  return (
    <Link
      to={`/rules/${rule.id}`}
      className={cn(
        'mt-4 flex flex-col gap-1 rounded-lg border border-border px-4.5 py-4 transition-colors hover:border-input hover:bg-muted/60',
        isNext && 'items-end text-end'
      )}
    >
      <span className='inline-flex items-center gap-1.5 text-[13px] text-muted-foreground'>
        {!isNext && <ArrowLeft className='size-3.5' aria-hidden />}
        {isNext ? 'Next rule' : 'Previous rule'}
        {isNext && <ArrowRight className='size-3.5' aria-hidden />}
      </span>
      <span className='text-[15px] font-semibold'>
        <span className='font-mono text-primary'>{rule.id}</span> {rule.name}
      </span>
    </Link>
  )
}

export const RulePager: React.FC<RulePagerProps> = ({ rule, rules }) => {
  const index = rules.findIndex((entry) => entry.id === rule.id)
  if (index === -1) return null

  const previous = rules[index - 1]
  const next = rules[index + 1]

  return (
    <nav
      aria-label='Previous and next rule'
      className='grid grid-cols-[minmax(0,1fr)] gap-x-3.5 border-t border-border pt-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
    >
      <div>{previous && <PagerLink rule={previous} />}</div>
      <div>{next && <PagerLink rule={next} isNext />}</div>
    </nav>
  )
}
