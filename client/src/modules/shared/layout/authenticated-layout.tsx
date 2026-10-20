import type { TRoute } from '@typings/routes'
import { cn } from '@utils/classname'
import { getCookie } from '@utils/cookies'
import { LayoutProvider } from '@providers/layout'
import { SearchProvider } from '@providers/search'
import { SidebarInset, SidebarProvider } from '@shared/ui/sidebar'
import { SkipToMain } from '@shared/ui/skip-to-main'
import { AppSidebar } from './app-sidebar'

type AuthenticatedLayoutProps = {
  routes: TRoute
  sidebarHeader?: React.ReactNode
  sidebarContent?: React.ReactNode
  children?: React.ReactNode
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  routes,
  sidebarHeader,
  sidebarContent,
  children,
}) => {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar routes={routes} header={sidebarHeader}>
            {sidebarContent}
          </AppSidebar>
          <SidebarInset
            className={cn(
              '@container/content',

              'has-data-[layout=fixed]:h-svh',

              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            {children}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
