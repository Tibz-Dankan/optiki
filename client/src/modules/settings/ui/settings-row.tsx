import { cn } from '@utils/classname'

type SettingsRowProps = {
  label: React.ReactNode
  desc?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  desc,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border py-5',
        'sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        className
      )}
    >
      <div className='space-y-1'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          {label}
        </div>
        {desc && <p className='text-sm text-muted-foreground'>{desc}</p>}
      </div>
      {children && (
        <div className='flex shrink-0 items-center gap-2 sm:justify-end'>
          {children}
        </div>
      )}
    </div>
  )
}
