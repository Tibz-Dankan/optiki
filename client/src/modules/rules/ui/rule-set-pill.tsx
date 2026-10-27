import { cn } from '@utils/classname'

type RuleSetPillProps = {
  isCore: boolean
  className?: string
  children: React.ReactNode
}

export const RuleSetPill: React.FC<RuleSetPillProps> = ({
  isCore,
  className,
  children,
}) => {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-xs px-2 text-xs font-semibold whitespace-nowrap',
        isCore
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-foreground dark:text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  )
}
