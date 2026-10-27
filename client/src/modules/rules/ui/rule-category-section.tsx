import { categoryBlurbs } from '@constants/rules'
import {
  categoryLabels,
  categoryQuestions,
  categoryWeights,
} from '@constants/scan'
import type { TRule } from '@typings/rules'
import type { TRuleCategory } from '@typings/scan'
import { RuleRow } from '@modules/rules/ui/rule-row'

type RuleCategorySectionProps = {
  category: TRuleCategory
  position: number
  rules: TRule[]
  total: number
}

export const RuleCategorySection: React.FC<RuleCategorySectionProps> = ({
  category,
  position,
  rules,
  total,
}) => {
  const anchor = `rules-${category.toLowerCase()}`

  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-title`}
      className='mt-9 scroll-mt-22 md:scroll-mt-52'
    >
      <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-4'>
        <div className='min-w-0'>
          <p className='font-mono text-xs font-semibold tracking-widest text-primary uppercase'>
            {String(position).padStart(2, '0')} · {categoryWeights[category]}%
            of the score
          </p>
          <h2
            id={`${anchor}-title`}
            className='mt-1.5 text-[26px] font-bold tracking-[-0.02em]'
          >
            {categoryLabels[category]}
          </h2>
          <p className='mt-1.5 max-w-155 text-[15px] text-muted-foreground'>
            {categoryQuestions[category]} {categoryBlurbs[category]}
          </p>
        </div>
        <span className='text-[13px] text-muted-foreground tabular-nums'>
          {rules.length === total
            ? `${total} rules`
            : `${rules.length} of ${total} rules`}
        </span>
      </div>
      <ul className='grid gap-2'>
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </ul>
    </section>
  )
}
