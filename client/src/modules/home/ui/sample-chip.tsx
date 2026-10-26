import { cn } from '@utils/classname'

type TChipTone = 'danger' | 'warning' | 'success' | 'neutral'

const chipTones: Record<TChipTone, string> = {
  danger: 'bg-destructive/15 dark:bg-destructive',
  warning: 'bg-warning/20 dark:bg-warning',
  success: 'bg-success/15 dark:bg-success',
  neutral: 'bg-muted dark:text-foreground',
}

type SampleChipProps = {
  tone: TChipTone
  className?: string
  children: React.ReactNode
}

export const SampleChip: React.FC<SampleChipProps> = ({
  tone,
  className,
  children,
}) => {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-xs px-2 py-0.5 font-mono text-xs font-bold text-foreground dark:text-background',
        chipTones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
