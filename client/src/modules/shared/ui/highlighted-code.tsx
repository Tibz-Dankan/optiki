import { Fragment } from 'react'
import type { THighlightLanguage } from '@typings/code'
import { cn } from '@utils/classname'
import { useHighlightedCode } from '@hooks/use-highlighted-code'

type TCodeToken = { content: string; htmlStyle?: Record<string, string> }

type HighlightedCodeProps = {
  code: string
  language: THighlightLanguage
  showLineNumbers?: boolean
  className?: string
}

const CodeTokens: React.FC<{ line: TCodeToken[] }> = ({ line }) =>
  line.map((token, tokenIndex) => (
    <span
      key={tokenIndex}
      style={token.htmlStyle as React.CSSProperties}
      className='text-(color:--shiki-light) dark:text-(color:--shiki-dark)'
    >
      {token.content}
    </span>
  ))

export const HighlightedCode: React.FC<HighlightedCodeProps> = ({
  code,
  language,
  showLineNumbers = false,
  className,
}) => {
  const { tokens } = useHighlightedCode(code, language)

  if (showLineNumbers) {
    const lines: TCodeToken[][] =
      tokens ?? code.split('\n').map((content) => [{ content }])

    return (
      <pre
        className={cn(
          'overflow-auto py-3.5 font-mono text-[13px] leading-[1.75] [tab-size:4]',
          className
        )}
      >
        <code>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className='block pe-4'>
              <span
                aria-hidden
                className='inline-block w-11 pe-4 text-end text-muted-foreground/60 select-none'
              >
                {lineIndex + 1}
              </span>
              <CodeTokens line={line} />
            </span>
          ))}
        </code>
      </pre>
    )
  }

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
                <CodeTokens line={line} />
              </Fragment>
            ))
          : code}
      </code>
    </pre>
  )
}
