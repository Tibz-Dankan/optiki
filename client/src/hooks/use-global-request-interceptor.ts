import { useEffect } from 'react'
import { SERVER_URL } from '@constants/urls'

export const useGlobalRequestInterceptor = () => {
  useEffect(() => {
    const originalFetch = globalThis.fetch

    globalThis.fetch = async (...args) => {
      if (!args[0]?.toString().startsWith(SERVER_URL)) {
        return await originalFetch(...args)
      }

      const options: RequestInit = args[1] || {}
      options.credentials = 'include'
      args[1] = options

      return await originalFetch(...args)
    }

    return () => {
      globalThis.fetch = originalFetch
    }
  }, [])
}
