import { Check, X } from 'lucide-react'
import type { TMultiplePageScanStatus, TScanStatus } from '@typings/scan'
import { cn } from '@utils/classname'

type TBadgeStatus = TScanStatus | TMultiplePageScanStatus

const statusTones: Record<TBadgeStatus, string> = {
  COMPLETED: 'bg-success/15 dark:bg-success/90',
  FAILED: 'bg-destructive/15 dark:bg-destructive/90',
  RUNNING: 'bg-info/15 dark:bg-info/90',
  QUEUED: 'bg-muted dark:bg-muted-foreground/90',
}

type ScanStatusBadgeProps = {
  status: TBadgeStatus
  label: string
}

export const ScanStatusBadge: React.FC<ScanStatusBadgeProps> = ({
  status,
  label,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xs py-0.5 ps-1.5 pe-2 text-xs font-semibold text-foreground dark:text-background',
        statusTones[status]
      )}
    >
      {status === 'COMPLETED' && (
        <Check className='size-3' strokeWidth={3} aria-hidden />
      )}
      {status === 'FAILED' && (
        <X className='size-3' strokeWidth={3} aria-hidden />
      )}
      {(status === 'RUNNING' || status === 'QUEUED') && (
        <span
          aria-hidden
          className={cn(
            'mx-0.75 size-1.5 rounded-full bg-current',
            status === 'RUNNING' && 'animate-pulse motion-reduce:animate-none'
          )}
        />
      )}
      {label}
    </span>
  )
}
