import type { THighlightLanguage } from '@typings/code'
import { cn } from '@utils/classname'
import { CopyButton } from '@shared/ui/copy-button'
import { HighlightedCode } from '@shared/ui/highlighted-code'

type CodeBlockProps = {
  code: string
  language: THighlightLanguage
  title: string
  copyLabel: string
  className?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  title,
  copyLabel,
  className,
}) => {
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      <div className='flex h-10 items-center gap-2 border-b bg-muted/40 ps-4 pe-1.5'>
        <span className='truncate font-mono text-xs text-muted-foreground'>
          {title}
        </span>
        <CopyButton value={code} label={copyLabel} className='ms-auto' />
      </div>
      <HighlightedCode code={code} language={language} className='max-h-128' />
    </div>
  )
}
