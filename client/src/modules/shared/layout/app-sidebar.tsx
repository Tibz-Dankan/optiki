import type { TRoute } from '@typings/routes'
import { useLayout } from '@providers/layout'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@shared/ui/sidebar'
import { AppTitle } from './app-title'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

type AppSidebarProps = {
  routes: TRoute
  header?: React.ReactNode
  children?: React.ReactNode
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  routes,
  header,
  children,
}) => {
  const { collapsible, variant } = useLayout()

  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className='group-data-[variant=inset]:border-e'
    >
      <SidebarHeader>
        <AppTitle homePath={routes.homePath} />
        {header}
      </SidebarHeader>
      <SidebarContent>
        {routes.groups.map((group, index) => (
          <NavGroup key={group.title ?? index} {...group} />
        ))}
        {children}
      </SidebarContent>
      <SidebarFooter className='shrink-0 border-t'>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
