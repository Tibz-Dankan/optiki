import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { EyeOff } from 'lucide-react'
import { severityAccents } from '@constants/rules'
import { isHttpError } from '@api/http-error'
import { rulesAPI, rulesKeys } from '@api/rules'
import { cn } from '@utils/classname'
import { useNavigationScroll } from '@hooks/use-navigation-scroll'
import { Skeleton } from '@shared/ui/skeleton'
import { NotFoundError } from '@shared/pages/not-found-error'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { RuleDetails } from '@modules/rules/ui/rule-details'
import { RuleExample } from '@modules/rules/ui/rule-example'
import { RuleHero } from '@modules/rules/ui/rule-hero'
import { RulePager } from '@modules/rules/ui/rule-pager'
import { RuleSiblings } from '@modules/rules/ui/rule-siblings'
import { RuleTryCard } from '@modules/rules/ui/rule-try-card'

const sectionHeadingClassName = 'text-[22px] font-bold tracking-[-0.02em]'

export const Rule: React.FC = () => {
  const { id = '' } = useParams()
  const { data, isPending, isError, error } = useQuery({
    queryKey: rulesKeys.detail(id),
    queryFn: () => rulesAPI.getOne(id),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  })
  const { data: list } = useQuery({
    queryKey: rulesKeys.list(),
    queryFn: rulesAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })
  useNavigationScroll(true)

  if (isError && isHttpError(error) && error.status === 404) {
    return <NotFoundError />
  }

  const rule = data?.data

  return (
    <HomeLayout>
      {isPending && (
        <div className='mx-auto grid max-w-300 gap-6 px-[clamp(16px,4vw,32px)] py-12'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-14 w-2/3' />
          <Skeleton className='h-6 w-full max-w-180' />
          <Skeleton className='mt-6 h-96 w-full' />
        </div>
      )}
      {isError && (
        <p
          role='alert'
          className='mx-auto max-w-300 px-[clamp(16px,4vw,32px)] py-12 text-sm text-destructive'
        >
          {error.message}
        </p>
      )}

      {rule && (
        <>
          <RuleHero rule={rule} />
          <div className='mx-auto grid max-w-300 grid-cols-[minmax(0,1fr)] items-start gap-12 px-[clamp(16px,4vw,32px)] pt-12 pb-24 lg:grid-cols-[minmax(0,1fr)_320px]'>
            <div className='grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12'>
              <section aria-labelledby='why-heading'>
                <h2 id='why-heading' className={sectionHeadingClassName}>
                  Why agents fail
                </h2>
                <div
                  className={cn(
                    'mt-3.5 grid grid-cols-[40px_minmax(0,1fr)] gap-4 rounded-lg border border-s-3 border-border bg-card px-5.5 py-5',
                    severityAccents[rule.severity].border
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'inline-flex size-10 items-center justify-center rounded-lg',
                      severityAccents[rule.severity].icon
                    )}
                  >
                    <EyeOff className='size-5' />
                  </span>
                  <p className='text-[17px] leading-[1.65] text-pretty'>
                    {rule.why}
                  </p>
                </div>
              </section>

              <section aria-labelledby='fix-heading'>
                <h2 id='fix-heading' className={sectionHeadingClassName}>
                  How to fix
                </h2>
                <p className='mt-3 max-w-180 text-[17px] leading-[1.65] text-pretty'>
                  {rule.fix}
                </p>
                <div className='mt-5 grid grid-cols-[minmax(0,1fr)] gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
                  <RuleExample
                    variant='before'
                    ruleID={rule.id}
                    code={rule.fixBefore}
                  />
                  <RuleExample
                    variant='after'
                    ruleID={rule.id}
                    code={rule.fixAfter}
                  />
                </div>
              </section>

              {list && <RuleSiblings rule={rule} rules={list.data} />}
              {list && <RulePager rule={rule} rules={list.data} />}
            </div>

            <aside
              aria-label='Rule details'
              className='grid gap-4 lg:sticky lg:top-23'
            >
              <RuleDetails rule={rule} />
              <RuleTryCard rule={rule} />
            </aside>
          </div>
        </>
      )}
    </HomeLayout>
  )
}
