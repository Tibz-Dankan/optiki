import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { severityAccents } from '@constants/rules'
import { severityLabels } from '@constants/scan'
import type { TRule, TRuleFilters, TRuleSetFilter } from '@typings/rules'
import type { TSeverity } from '@typings/scan'
import { ScanFilterGroup } from '@modules/scan/ui/scan-filter-group'

type RuleFiltersProps = {
  rules: TRule[]
  filters: TRuleFilters
  onChange: (filters: TRuleFilters) => void
}

const severities: TSeverity[] = ['CRITICAL', 'SERIOUS', 'MODERATE', 'MINOR']

export const RuleFilters: React.FC<RuleFiltersProps> = ({
  rules,
  filters,
  onChange,
}) => {
  const searchRef = useRef<HTMLInputElement>(null)

  const clearSearch = () => {
    onChange({ ...filters, query: '' })
    searchRef.current?.focus()
  }

  return (
    <div
      role='search'
      aria-label='Rules'
      className='z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background pt-5 pb-4 md:sticky md:top-17'
    >
      <div className='flex h-10 min-w-0 flex-[1_1_240px] items-center gap-2.5 rounded-lg border border-input bg-card px-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12'>
        <Search className='size-4 shrink-0 text-muted-foreground' aria-hidden />
        <label htmlFor='rule-search' className='sr-only'>
          Search rules
        </label>
        <input
          ref={searchRef}
          id='rule-search'
          type='search'
          autoComplete='off'
          placeholder='Search by ID, name or WCAG'
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          className='h-9.5 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden'
        />
        {filters.query && (
          <button
            type='button'
            aria-label='Clear search'
            onClick={clearSearch}
            className='inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'
          >
            <X className='size-3.5' strokeWidth={2.25} aria-hidden />
          </button>
        )}
      </div>
      <ScanFilterGroup
        id='rule-set-filter-label'
        label='Rule set'
        isLabelHidden
        value={filters.ruleSet}
        options={[
          { value: 'ALL', label: 'All rules', count: rules.length },
          {
            value: 'CORE',
            label: 'Core',
            count: rules.filter((rule) => rule.ruleSets.includes('CORE'))
              .length,
          },
        ]}
        onChange={(value) =>
          onChange({ ...filters, ruleSet: value as TRuleSetFilter })
        }
      />
      <ScanFilterGroup
        id='severity-filter-label'
        label='Severity'
        isLabelHidden
        value={filters.severity}
        options={[
          { value: 'ALL', label: 'All severities' },
          ...severities.map((severity) => ({
            value: severity,
            label: severityLabels[severity],
            dotClassName: severityAccents[severity].dot,
          })),
        ]}
        onChange={(value) =>
          onChange({
            ...filters,
            severity: value as TRuleFilters['severity'],
          })
        }
      />
    </div>
  )
}
