import { Check, Copy } from 'lucide-react'
import { cn } from '@utils/classname'
import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard'
import { Button } from '@shared/ui/button'

type CopyButtonProps = {
  value: string
  label: string
  className?: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label,
  className,
}) => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('size-7 text-muted-foreground', className)}
      onClick={() => copy(value)}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check className='text-success' /> : <Copy />}
    </Button>
  )
}
