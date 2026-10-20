import { Monitor, Moon, Sun } from 'lucide-react'
import type { TTheme } from '@typings/appearance'
import { cn } from '@utils/classname'
import { useTheme } from '@providers/theme'
import { SettingsRow } from '@modules/settings/ui/settings-row'

const themeOptions: {
  value: TTheme
  label: string
  icon: React.ElementType
}[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export const PreferencesSection: React.FC = () => {
  const { theme, setTheme } = useTheme()

  return (
    <section className='mt-10'>
      <h3 className='text-sm font-semibold text-muted-foreground'>
        Preferences
      </h3>

      <SettingsRow
        label='Appearance'
        desc='Choose how optikí looks on this device.'
      >
        <div
          role='radiogroup'
          aria-label='Appearance'
          className='flex items-center gap-1 rounded-lg border border-border p-1'
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type='button'
              role='radio'
              title={option.label}
              aria-label={option.label}
              aria-checked={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex size-8 items-center justify-center rounded-md transition-colors',
                theme === option.value
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <option.icon className='size-4' />
            </button>
          ))}
        </div>
      </SettingsRow>
    </section>
  )
}
