import { useQuery } from '@tanstack/react-query'
import type { THighlightLanguage } from '@typings/code'
import { getCodeHighlighter } from '@utils/get-code-highlighter'

export const useHighlightedCode = (
  code: string,
  language: THighlightLanguage
) => {
  const { data } = useQuery({
    queryKey: ['code-highlight', language, code],
    queryFn: async () => {
      const highlighter = await getCodeHighlighter()
      return highlighter.codeToTokens(code, {
        lang: language,
        themes: {
          light: 'github-light-default',
          dark: 'github-dark-default',
        },
        defaultColor: false,
      }).tokens
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  return { tokens: data ?? null }
}
