import { cn } from '@utils/classname'

type ScanFilterGroupProps = {
  id: string
  label: string
  isLabelHidden?: boolean
  value: string
  options: {
    value: string
    label: string
    count?: number
    dotClassName?: string
  }[]
  onChange: (value: string) => void
}

export const ScanFilterGroup: React.FC<ScanFilterGroupProps> = ({
  id,
  label,
  isLabelHidden = false,
  value,
  options,
  onChange,
}) => {
  return (
    <div className='flex items-center gap-2.5'>
      <span
        id={id}
        className={cn(
          'text-[13px] text-muted-foreground',
          isLabelHidden && 'sr-only'
        )}
      >
        {label}
      </span>
      <div
        role='group'
        aria-labelledby={id}
        className='inline-flex flex-wrap gap-0.5 rounded-lg border border-border bg-card p-0.75'
      >
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <button
              key={option.value}
              type='button'
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                isSelected
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {option.dotClassName && (
                <span
                  aria-hidden
                  className={cn('size-1.75 rounded-full', option.dotClassName)}
                />
              )}
              {option.label}
              {option.count !== undefined && (
                <span className='text-xs text-muted-foreground'>
                  {option.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
