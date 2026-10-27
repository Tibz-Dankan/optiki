import { Link } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import { ruleModeLabels } from '@constants/rules'
import { categoryLabels, categoryQuestions } from '@constants/scan'
import type { TRule } from '@typings/rules'
import { getRuleModes } from '@utils/get-rule-modes'
import { HeroBackdrop } from '@modules/rules/ui/hero-backdrop'
import { RuleSetPill } from '@modules/rules/ui/rule-set-pill'
import { SeverityPill } from '@modules/rules/ui/severity-pill'

type RuleHeroProps = {
  rule: TRule
}

const crumbClassName = 'transition-colors hover:text-foreground'

const factClassName = 'h-7.5 px-2.5 text-[13px]'

export const RuleHero: React.FC<RuleHeroProps> = ({ rule }) => {
  const isCore = rule.ruleSets.includes('CORE')

  return (
    <section
      aria-labelledby='rule-title'
      className='relative overflow-hidden border-b border-border'
    >
      <HeroBackdrop />
      <div className='relative mx-auto max-w-300 px-[clamp(16px,4vw,32px)] pt-6 pb-[clamp(40px,5vw,56px)]'>
        <nav
          aria-label='Breadcrumb'
          className='flex flex-wrap items-center gap-3'
        >
          <Link
            to='/rules'
            className='inline-flex h-8 items-center gap-1.5 rounded-lg border border-border ps-2 pe-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'
          >
            <ArrowLeft className='size-3.75' aria-hidden />
            All rules
          </Link>
          <ol className='flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground'>
            <li>
              <Link to='/rules' className={crumbClassName}>
                Rules
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link
                to={`/rules#rules-${rule.category.toLowerCase()}`}
                className={crumbClassName}
              >
                {categoryLabels[rule.category]}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <span aria-current='page' className='font-mono text-foreground'>
                {rule.id}
              </span>
            </li>
          </ol>
        </nav>

        <div className='mt-9 flex flex-wrap items-center gap-x-3.5 gap-y-2.5'>
          <span className='inline-flex h-7 items-center rounded-[4px] bg-primary/10 px-2.5 font-mono text-sm font-bold tracking-[0.02em] text-primary'>
            {rule.id}
          </span>
          <span className='text-sm text-muted-foreground'>
            {categoryLabels[rule.category]} · {categoryQuestions[rule.category]}
          </span>
        </div>
        <h1
          id='rule-title'
          className='mt-3.5 max-w-205 text-[clamp(36px,5vw,56px)] leading-[1.05] font-[750] tracking-[-0.035em] text-balance'
        >
          {rule.name}
        </h1>
        <p className='mt-4 max-w-180 text-[19px] leading-[1.55] text-pretty text-muted-foreground'>
          {rule.summary}
        </p>
        <ul aria-label='Rule facts' className='mt-6 flex flex-wrap gap-2'>
          <li className='flex'>
            <SeverityPill severity={rule.severity} className={factClassName} />
          </li>
          <li className='flex'>
            <RuleSetPill isCore={isCore} className={factClassName}>
              {isCore ? 'Core rule set' : 'Full rule set'}
            </RuleSetPill>
          </li>
          <li className='inline-flex h-7.5 items-center gap-1.75 rounded-xs bg-muted px-2.5 text-[13px] font-medium'>
            <Monitor className='size-3.5' aria-hidden />
            {ruleModeLabels[getRuleModes(rule)].pill}
          </li>
        </ul>
      </div>
    </section>
  )
}
