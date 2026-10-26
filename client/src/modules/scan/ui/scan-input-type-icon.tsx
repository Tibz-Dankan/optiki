import { Dumbbell, FileCode, Globe } from 'lucide-react'
import type { TScanInputType } from '@typings/scan'
import { cn } from '@utils/classname'

const inputTypeIcons: Record<TScanInputType, React.ElementType> = {
  URL: Globe,
  GYM: Dumbbell,
  HTML: FileCode,
}

type ScanInputTypeIconProps = {
  inputType?: TScanInputType
  className?: string
}

export const ScanInputTypeIcon: React.FC<ScanInputTypeIconProps> = ({
  inputType = 'URL',
  className,
}) => {
  const Icon = inputTypeIcons[inputType]
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
        className
      )}
    >
      <Icon className='size-4' />
    </span>
  )
}
