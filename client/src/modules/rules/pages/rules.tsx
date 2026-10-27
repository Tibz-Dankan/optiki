import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryOrder } from '@constants/scan'
import type { TRuleFilters } from '@typings/rules'
import { rulesAPI, rulesKeys } from '@api/rules'
import { filterRules } from '@utils/filter-rules'
import { useNavigationScroll } from '@hooks/use-navigation-scroll'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { HeroBackdrop } from '@modules/rules/ui/hero-backdrop'
import { RuleCategoryNav } from '@modules/rules/ui/rule-category-nav'
import { RuleCategorySection } from '@modules/rules/ui/rule-category-section'
import { RuleFilters } from '@modules/rules/ui/rule-filters'
import { RuleSetsCard } from '@modules/rules/ui/rule-sets-card'
import { RulesCta } from '@modules/rules/ui/rules-cta'
import { RulesHero } from '@modules/rules/ui/rules-hero'

const initialFilters: TRuleFilters = {
  query: '',
  ruleSet: 'ALL',
  severity: 'ALL',
}

export const Rules: React.FC = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: rulesKeys.list(),
    queryFn: rulesAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })
  const [filters, setFilters] = useState(initialFilters)
  useNavigationScroll(!!data)

  const rules = data?.data ?? []
  const shownRules = filterRules(rules, filters)

  return (
    <HomeLayout>
      <section
        aria-labelledby='rules-title'
        className='relative overflow-hidden border-b border-border'
      >
        <HeroBackdrop />
        <div className='relative mx-auto flex max-w-300 flex-wrap items-start gap-x-16 gap-y-12 px-[clamp(16px,4vw,32px)] pt-[clamp(48px,7vw,80px)] pb-[clamp(48px,6vw,64px)]'>
          <RulesHero rules={data?.data} />
          <RuleSetsCard />
        </div>
      </section>

      <div className='mx-auto grid max-w-300 grid-cols-[minmax(0,1fr)] gap-12 px-[clamp(16px,4vw,32px)] pb-24 lg:grid-cols-[232px_minmax(0,1fr)]'>
        <aside className='hidden pt-8 lg:block'>
          {data && <RuleCategoryNav rules={rules} shownRules={shownRules} />}
        </aside>

        <div className='min-w-0'>
          {isPending && (
            <div className='mt-8 grid gap-2'>
              <Skeleton className='mb-4 h-10 w-full' />
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className='h-28 w-full' />
              ))}
            </div>
          )}
          {isError && (
            <p role='alert' className='mt-8 text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {data && (
            <>
              <RuleFilters
                rules={rules}
                filters={filters}
                onChange={setFilters}
              />
              <p
                role='status'
                className='mt-3.5 text-[13px] text-muted-foreground'
              >
                {shownRules.length === rules.length
                  ? `Showing all ${rules.length} rules`
                  : `Showing ${shownRules.length} of ${rules.length} rules`}
              </p>

              {categoryOrder.map((category, index) => {
                const categoryRules = shownRules.filter(
                  (rule) => rule.category === category
                )
                if (categoryRules.length === 0) return null

                return (
                  <RuleCategorySection
                    key={category}
                    category={category}
                    position={index + 1}
                    rules={categoryRules}
                    total={
                      rules.filter((rule) => rule.category === category).length
                    }
                  />
                )
              })}

              {shownRules.length === 0 && (
                <div className='mt-9 rounded-lg border border-dashed border-input px-6 py-14 text-center'>
                  <p className='font-semibold'>No rules match these filters</p>
                  <p className='mt-1.5 text-sm text-muted-foreground'>
                    Try another word, or search by ID like “106” or a WCAG
                    number like “4.1.2”.
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    className='mt-4.5 h-9 px-3.5 text-[13px]'
                    onClick={() => setFilters(initialFilters)}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </>
          )}

          <RulesCta />
        </div>
      </div>
    </HomeLayout>
  )
}
