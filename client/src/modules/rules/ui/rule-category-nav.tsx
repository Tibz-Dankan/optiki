import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  categoryLabels,
  categoryOrder,
  categoryQuestions,
} from '@constants/scan'
import type { TRule } from '@typings/rules'

type RuleCategoryNavProps = {
  rules: TRule[]
  shownRules: TRule[]
}

const entryClassName =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 rounded-lg px-3 py-2.5'

export const RuleCategoryNav: React.FC<RuleCategoryNavProps> = ({
  rules,
  shownRules,
}) => {
  return (
    <nav aria-label='Rule categories' className='sticky top-25'>
      <p className='ms-3 mb-2.5 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
        Categories
      </p>
      <ul className='grid gap-0.5'>
        {categoryOrder.map((category) => {
          const total = rules.filter(
            (rule) => rule.category === category
          ).length
          const shown = shownRules.filter(
            (rule) => rule.category === category
          ).length
          const content = (
            <>
              <span className='text-sm font-semibold'>
                {categoryLabels[category]}
              </span>
              <span className='text-[13px] text-muted-foreground tabular-nums'>
                {shown === total ? total : `${shown} of ${total}`}
              </span>
              <span className='col-span-full text-xs text-muted-foreground'>
                {categoryQuestions[category]}
              </span>
            </>
          )

          return (
            <li key={category}>
              {shown > 0 ? (
                <a
                  href={`#rules-${category.toLowerCase()}`}
                  className={`${entryClassName} transition-colors hover:bg-muted/60`}
                >
                  {content}
                </a>
              ) : (
                <div className={`${entryClassName} opacity-45`}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
      <div className='mx-3 mt-5 grid gap-2.5 border-t border-border pt-4 text-[13px] text-muted-foreground'>
        <p>Every rule page has the fix as before-and-after code.</p>
        <Link
          to='/scan'
          className='inline-flex items-center gap-1.5 font-semibold text-primary hover:underline hover:underline-offset-4'
        >
          Check a page against them
          <ArrowRight className='size-3.5' aria-hidden />
        </Link>
      </div>
    </nav>
  )
}
