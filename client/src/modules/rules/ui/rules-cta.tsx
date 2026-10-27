import { Link } from 'react-router-dom'
import { cn } from '@utils/classname'
import { buttonVariants } from '@shared/ui/button'

export const RulesCta: React.FC = () => {
  return (
    <section
      aria-labelledby='rules-cta'
      className='mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-lg border border-border bg-card bg-linear-135 from-primary/10 to-transparent to-60% p-[clamp(20px,4vw,32px)]'
    >
      <div className='min-w-0 flex-[1_1_360px]'>
        <h2
          id='rules-cta'
          className='text-[22px] font-bold tracking-[-0.02em] text-balance'
        >
          Which of these does your page fail?
        </h2>
        <p className='mt-2 text-[15px] text-muted-foreground'>
          Paste an address and get a score, every failing rule with where it
          happens, and a fix report your coding agent can apply.
        </p>
      </div>
      <Link
        to='/scan'
        className={cn(
          buttonVariants(),
          'h-11 px-5 text-[15px] font-semibold text-primary-foreground'
        )}
      >
        Scan a page
      </Link>
    </section>
  )
}
