import { Fragment } from 'react'
import type { THighlightLanguage } from '@typings/code'
import { cn } from '@utils/classname'
import { useHighlightedCode } from '@hooks/use-highlighted-code'

type HighlightedCodeProps = {
  code: string
  language: THighlightLanguage
  className?: string
}

export const HighlightedCode: React.FC<HighlightedCodeProps> = ({
  code,
  language,
  className,
}) => {
  const { tokens } = useHighlightedCode(code, language)

  return (
    <pre
      className={cn(
        'overflow-auto p-4 font-mono text-[13px] leading-relaxed [tab-size:4]',
        className
      )}
    >
      <code>
        {tokens
          ? tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && '\n'}
                {line.map((token, tokenIndex) => (
                  <span
                    key={tokenIndex}
                    style={token.htmlStyle as React.CSSProperties}
                    className='text-(color:--shiki-light) dark:text-(color:--shiki-dark)'
                  >
                    {token.content}
                  </span>
                ))}
              </Fragment>
            ))
          : code}
      </code>
    </pre>
  )
}
