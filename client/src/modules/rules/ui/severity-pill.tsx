import { severityAccents } from '@constants/rules'
import { severityLabels } from '@constants/scan'
import type { TSeverity } from '@typings/scan'
import { cn } from '@utils/classname'

type SeverityPillProps = {
  severity: TSeverity
  className?: string
}

export const SeverityPill: React.FC<SeverityPillProps> = ({
  severity,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-xs px-2 text-xs font-semibold whitespace-nowrap text-foreground',
        severityAccents[severity].pill,
        className
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', severityAccents[severity].dot)}
      />
      {severityLabels[severity]}
    </span>
  )
}
