import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { TNavGroup, TPage } from '@typings/routes'
import { Badge } from '@shared/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@shared/ui/sidebar'

export const NavGroup: React.FC<TNavGroup> = ({ title, pages }) => {
  const { state, isMobile } = useSidebar()
  const { pathname } = useLocation()

  const visible = pages.filter((page) => page.showInSidebar)

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {visible.map((page) => {
          const key = `${page.title}-${page.path}`
          const subPages = page.children?.filter((child) => child.showInSidebar)

          if (!subPages?.length)
            return <SidebarMenuLink key={key} page={page} pathname={pathname} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                page={page}
                subPages={subPages}
                pathname={pathname}
              />
            )

          return (
            <SidebarMenuCollapsible
              key={key}
              page={page}
              subPages={subPages}
              pathname={pathname}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

interface NavBadgeProps {
  children: ReactNode
}

const NavBadge: React.FC<NavBadgeProps> = ({ children }) => {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

interface SidebarMenuLinkProps {
  page: TPage
  pathname: string
}

const SidebarMenuLink: React.FC<SidebarMenuLinkProps> = ({
  page,
  pathname,
}) => {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(pathname, page)}
        tooltip={page.title}
      >
        <Link to={page.path} onClick={() => setOpenMobile(false)}>
          {page.icon &&
            (page.highlightIcon ? (
              <span className='-m-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent'>
                <page.icon className='size-4' />
              </span>
            ) : (
              <page.icon />
            ))}
          <span>{page.title}</span>
          {page.badge && <NavBadge>{page.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

interface SidebarMenuCollapsibleProps {
  page: TPage
  subPages: TPage[]
  pathname: string
}

const SidebarMenuCollapsible: React.FC<SidebarMenuCollapsibleProps> = ({
  page,
  subPages,
  pathname,
}) => {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(pathname, page, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={page.title}>
            {page.icon && <page.icon />}
            <span>{page.title}</span>
            {page.badge && <NavBadge>{page.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {subPages.map((subPage) => (
              <SidebarMenuSubItem key={subPage.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(pathname, subPage)}
                >
                  <Link to={subPage.path} onClick={() => setOpenMobile(false)}>
                    {subPage.icon && <subPage.icon />}
                    <span>{subPage.title}</span>
                    {subPage.badge && <NavBadge>{subPage.badge}</NavBadge>}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

interface SidebarMenuCollapsedDropdownProps {
  page: TPage
  subPages: TPage[]
  pathname: string
}

const SidebarMenuCollapsedDropdown: React.FC<
  SidebarMenuCollapsedDropdownProps
> = ({ page, subPages, pathname }) => {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={page.title}
            isActive={checkIsActive(pathname, page)}
          >
            {page.icon && <page.icon />}
            <span>{page.title}</span>
            {page.badge && <NavBadge>{page.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {page.title} {page.badge ? `(${page.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {subPages.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.path}`} asChild>
              <Link
                to={sub.path}
                className={checkIsActive(pathname, sub) ? 'bg-secondary' : ''}
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(pathname: string, page: TPage, mainNav = false) {
  const path = pathname.split('?')[0]

  return (
    path === page.path ||
    !!page.children?.some((child) => child.path === path) ||
    (mainNav &&
      path.split('/')[1] !== '' &&
      path.split('/')[1] === page.path.split('/')[1])
  )
}
