import { useEffect, useState } from 'react'

export const useCopyToClipboard = (resetAfterMs = 2000) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), resetAfterMs)
    return () => window.clearTimeout(timeout)
  }, [copied, resetAfterMs])

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  return { copied, copy }
}
