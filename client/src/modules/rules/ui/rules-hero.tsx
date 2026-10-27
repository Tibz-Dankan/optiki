import { Link } from 'react-router-dom'
import { ScanSearch } from 'lucide-react'
import { categoryOrder } from '@constants/scan'
import type { TRule } from '@typings/rules'
import { cn } from '@utils/classname'
import { buttonVariants } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'

type RulesHeroProps = {
  rules?: TRule[]
}

export const RulesHero: React.FC<RulesHeroProps> = ({ rules }) => {
  const stats = [
    { label: 'Rules', value: rules?.length },
    { label: 'Categories', value: categoryOrder.length },
    {
      label: 'In the core set',
      value: rules?.filter((rule) => rule.ruleSets.includes('CORE')).length,
    },
    {
      label: 'Need a real browser',
      value: rules?.filter((rule) => rule.renderedOnly).length,
    },
  ]

  return (
    <div className='min-w-0 flex-[1_1_440px]'>
      <p className='font-mono text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
        Rule catalog
      </p>
      <h1
        id='rules-title'
        className='mt-3.5 text-[clamp(44px,6vw,64px)] leading-[1.02] font-[750] tracking-[-0.04em]'
      >
        Rules
      </h1>
      <p className='mt-5 max-w-135 text-[19px] leading-[1.55] text-pretty text-muted-foreground'>
        17 checks for the problems that stop AI agents from using a page. Each
        rule explains why agents fail and shows the fix in code.
      </p>
      <dl className='mt-9 flex flex-wrap gap-x-10 gap-y-5'>
        {stats.map((stat) => (
          <div key={stat.label} className='flex flex-col-reverse gap-0.5'>
            <dt className='text-[13px] text-muted-foreground'>{stat.label}</dt>
            <dd className='text-[28px] leading-tight font-bold tracking-[-0.02em] tabular-nums'>
              {stat.value ?? <Skeleton className='my-1 h-7 w-9' />}
            </dd>
          </div>
        ))}
      </dl>
      <div className='mt-9 flex flex-wrap gap-3'>
        <Link
          to='/scan'
          className={cn(
            buttonVariants(),
            'h-11 px-4.5 text-[15px] font-semibold text-primary-foreground has-[>svg]:px-4.5'
          )}
        >
          <ScanSearch className='size-4.25' aria-hidden />
          Scan a page
        </Link>
        <Link
          to='/#ci'
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-11 px-4.5 text-[15px]'
          )}
        >
          Run them from CI
        </Link>
      </div>
    </div>
  )
}
