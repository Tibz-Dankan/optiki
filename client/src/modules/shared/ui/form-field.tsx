import { cn } from '@utils/classname'
import { Label } from '@shared/ui/label'

type FormFieldProps = {
  name: string
  label: React.ReactNode
  error?: string
  touched?: boolean
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  error,
  touched,
  action,
  className,
  children,
}) => {
  const showError = Boolean(touched && error)

  return (
    <div className={cn('grid gap-2', className)}>
      <div className='flex items-center justify-between'>
        <Label htmlFor={name}>{label}</Label>
        {action}
      </div>
      {children}
      {showError && (
        <p id={`${name}-error`} className='text-sm text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
