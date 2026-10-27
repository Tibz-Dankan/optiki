import { categoryLabels, categoryOrder, categoryWeights } from '@constants/scan'
import type { TRuleCategory } from '@typings/scan'
import { cn } from '@utils/classname'

const ruleSets = [
  {
    label: 'Core',
    count: '9 rules',
    className: 'bg-primary/10 text-primary',
    text: 'Signed-out scans. The page is fetched without a browser and checked as served.',
  },
  {
    label: 'Full',
    count: 'All 17',
    className: 'bg-muted text-foreground',
    text: 'Signed in, or with an API token. The page loads in Chromium, so rendered-only rules run too and a screenshot is saved.',
  },
]

const weightShades: Record<TRuleCategory, string> = {
  OPERABLE: 'bg-primary',
  PERCEIVABLE: 'bg-primary/70',
  STABLE: 'bg-primary/45',
  DISCOVERABLE: 'bg-primary/25',
}

export const RuleSetsCard: React.FC = () => {
  return (
    <section
      aria-labelledby='how-rules-run'
      className='max-w-135 min-w-0 flex-[1_1_420px] rounded-lg border border-border bg-card p-6 shadow-[0_30px_60px_-36px_rgb(15_23_42/0.22)] dark:shadow-[0_40px_80px_-40px_rgb(0_0_0/0.75)]'
    >
      <h2 id='how-rules-run' className='text-[15px] font-semibold'>
        Which rules run on a scan
      </h2>
      <ul className='mt-3.5 grid gap-2.5'>
        {ruleSets.map((ruleSet) => (
          <li
            key={ruleSet.label}
            className='grid grid-cols-[76px_minmax(0,1fr)] items-start gap-3.5 rounded-lg border border-border bg-muted/40 p-3.5 dark:bg-background'
          >
            <span className='flex flex-col gap-0.5'>
              <span
                className={cn(
                  'self-start rounded-xs px-2 py-0.5 text-xs font-semibold',
                  ruleSet.className
                )}
              >
                {ruleSet.label}
              </span>
              <span className='text-[13px] text-muted-foreground tabular-nums'>
                {ruleSet.count}
              </span>
            </span>
            <span className='text-sm leading-normal'>{ruleSet.text}</span>
          </li>
        ))}
      </ul>

      <h2 className='mt-6 text-[15px] font-semibold'>
        How the score is weighted
      </h2>
      <div
        aria-hidden='true'
        className='mt-3 flex h-2.5 gap-0.75 overflow-hidden rounded-full'
      >
        {categoryOrder.map((category) => (
          <div
            key={category}
            className={weightShades[category]}
            style={{ flex: `${categoryWeights[category]} 1 0` }}
          />
        ))}
      </div>
      <ul className='mt-3 grid grid-cols-2 gap-x-4 gap-y-2'>
        {categoryOrder.map((category) => (
          <li key={category} className='flex items-center gap-2 text-[13px]'>
            <span
              aria-hidden='true'
              className={cn('size-2 rounded-xs', weightShades[category])}
            />
            <span>{categoryLabels[category]}</span>
            <span className='ms-auto text-muted-foreground tabular-nums'>
              {categoryWeights[category]}%
            </span>
          </li>
        ))}
      </ul>
      <p className='mt-4 border-t border-border pt-3.5 text-[13px] leading-[1.55] text-muted-foreground'>
        Inside a category, each rule counts by its severity: Critical&nbsp;10,
        Serious&nbsp;7, Moderate&nbsp;3, Minor&nbsp;1. A category's score is the
        weighted share of its rules that pass.
      </p>
    </section>
  )
}
