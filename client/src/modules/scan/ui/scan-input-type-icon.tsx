import { Dumbbell, FileCode, Globe } from 'lucide-react'
import type { TScanInputType } from '@typings/scan'

const inputTypeIcons: Record<TScanInputType, React.ElementType> = {
  URL: Globe,
  GYM: Dumbbell,
  HTML: FileCode,
}

type ScanInputTypeIconProps = {
  inputType?: TScanInputType
}

export const ScanInputTypeIcon: React.FC<ScanInputTypeIconProps> = ({
  inputType = 'URL',
}) => {
  const Icon = inputTypeIcons[inputType]
  return (
    <span
      aria-hidden
      className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'
    >
      <Icon className='size-4' />
    </span>
  )
}
