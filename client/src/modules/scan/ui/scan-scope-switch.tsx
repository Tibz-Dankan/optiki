import { multiplePageScanMaxPages } from '@constants/scan'
import type { TScanScope } from '@typings/scan'

const scopes: { value: TScanScope; label: string }[] = [
  { value: 'single', label: 'Single page' },
  {
    value: 'multiple',
    label: `Multiple pages (up to ${multiplePageScanMaxPages})`,
  },
]

type ScanScopeSwitchProps = {
  scope: TScanScope
  disabled: boolean
  onChange: (scope: TScanScope) => void
}

export const ScanScopeSwitch: React.FC<ScanScopeSwitchProps> = ({
  scope,
  disabled,
  onChange,
}) => {
  return (
    <fieldset className='grid gap-2' disabled={disabled}>
      <legend className='mb-2 text-sm font-medium'>What to scan</legend>
      <div className='flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1'>
        {scopes.map((option) => (
          <label
            key={option.value}
            className='cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm has-[:disabled]:cursor-not-allowed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
          >
            <input
              type='radio'
              name='scan-scope'
              value={option.value}
              checked={scope === option.value}
              onChange={() => onChange(option.value)}
              className='sr-only'
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
