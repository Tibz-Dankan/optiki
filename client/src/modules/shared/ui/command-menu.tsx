import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Laptop, Moon, Sun } from 'lucide-react'
import type { TPage } from '@typings/routes'
import { useSearch } from '@providers/search'
import { useTheme } from '@providers/theme'
import { userRoutes } from '@routes/user-routes'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@shared/ui/command'
import { ScrollArea } from '@shared/ui/scroll-area'

export const CommandMenu: React.FC = () => {
  const navRoutes = userRoutes

  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>No results found.</CommandEmpty>
          {navRoutes.groups.map((group, index) => (
            <CommandGroup key={group.title ?? index} heading={group.title}>
              {group.pages
                .filter((page) => page.showInSidebar)
                .map((page) =>
                  page.children?.length ? (
                    page.children.map((sub) => (
                      <CommandItem
                        key={`${page.title}-${sub.path}`}
                        value={`${page.title} ${sub.title}`}
                        onSelect={() => runCommand(() => navigate(sub.path))}
                      >
                        <div className='flex size-4 items-center justify-center'>
                          <ArrowRight className='size-2 text-muted-foreground/80' />
                        </div>
                        {page.title} <ChevronRight className='size-3' />{' '}
                        {sub.title}
                      </CommandItem>
                    ))
                  ) : (
                    <NavigateItem
                      key={`${page.title}-${page.path}`}
                      page={page}
                      onSelect={() => runCommand(() => navigate(page.path))}
                    />
                  )
                )}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}

interface NavigateItemProps {
  page: TPage
  onSelect: () => void
}

const NavigateItem: React.FC<NavigateItemProps> = ({ page, onSelect }) => {
  return (
    <CommandItem value={page.title} onSelect={onSelect}>
      <div className='flex size-4 items-center justify-center'>
        {page.icon ? (
          <page.icon className='size-2 text-muted-foreground/80' />
        ) : (
          <ArrowRight className='size-2 text-muted-foreground/80' />
        )}
      </div>
      {page.title}
    </CommandItem>
  )
}
