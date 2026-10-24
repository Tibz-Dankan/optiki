import { Fragment, type ReactNode } from 'react'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { isHttpError } from '@api/http-error'
import { endSession } from '@utils/end-session'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      refetchOnWindowFocus: import.meta.env.PROD,
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) return false
        if (failureCount > 3) return false
        return !(isHttpError(error) && [401, 403].includes(error.status))
      },
    },
    mutations: {
      networkMode: 'always',
      onError: (error) => toast.error(error.message),
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (!isHttpError(error)) return
      const isAuthenticatedPath = window.location.pathname.includes('/u/')

      if (error.status === 401 && isAuthenticatedPath) {
        toast.error('Session expired!')
        endSession()
        return
      }

      if (error.status >= 500) {
        toast.error('Internal Server Error!')
      }
    },
  }),
})

type ReactQueryProviderProps = {
  children: ReactNode
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({
  children,
}) => {
  return (
    <Fragment>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Fragment>
  )
}
