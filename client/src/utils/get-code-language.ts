import type { THighlightLanguage } from '@typings/code'

export function getCodeLanguage(code: string): THighlightLanguage {
  return code.trimStart().startsWith('<') ? 'html' : 'css'
}
