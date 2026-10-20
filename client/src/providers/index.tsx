import type { ReactNode } from 'react'
import { Toaster } from '@shared/ui/sonner'
import { DirectionProvider } from './direction'
import { FontProvider } from './font'
import { ReactQueryProvider } from './react-query'
import { ThemeProvider } from './theme'

type ProvidersProps = {
  children: ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ReactQueryProvider>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <Toaster duration={5000} />
            {children}
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
