import type { HighlighterCore } from 'shiki/core'

let highlighter: Promise<HighlighterCore> | null = null

export function getCodeHighlighter(): Promise<HighlighterCore> {
  highlighter ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
    createHighlighterCore({
      themes: [
        import('shiki/themes/github-light-default.mjs'),
        import('shiki/themes/github-dark-default.mjs'),
      ],
      langs: [import('shiki/langs/html.mjs'), import('shiki/langs/css.mjs')],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    })
  )

  return highlighter
}
