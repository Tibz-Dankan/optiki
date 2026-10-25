import { useQuery } from '@tanstack/react-query'
import { apiTokenPermissionLabels } from '@constants/api-token'
import type { TAPITokenPermission } from '@typings/api-token'
import { apiTokenAPI, apiTokenKeys } from '@api/api-token'
import { Checkbox } from '@shared/ui/checkbox'
import { Label } from '@shared/ui/label'
import { Skeleton } from '@shared/ui/skeleton'

type PermissionCheckboxesProps = {
  value: TAPITokenPermission[]
  error?: string
  onChange: (permissions: TAPITokenPermission[]) => void
}

export const PermissionCheckboxes: React.FC<PermissionCheckboxesProps> = ({
  value,
  error,
  onChange,
}) => {
  const { data, isPending } = useQuery({
    queryKey: apiTokenKeys.permissions(),
    queryFn: apiTokenAPI.getPermissions,
    staleTime: 60 * 60 * 1000,
  })

  const toggle = (permission: TAPITokenPermission, checked: boolean) => {
    onChange(
      checked
        ? [...value, permission]
        : value.filter((current) => current !== permission)
    )
  }

  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-medium'>Permissions</legend>
      {isPending && <Skeleton className='h-24 w-full' />}
      {data?.data.map((permission) => {
        const id = `permission-${permission.name.replaceAll(':', '-')}`
        return (
          <div key={permission.name} className='flex items-start gap-3'>
            <Checkbox
              id={id}
              checked={value.includes(permission.name)}
              onCheckedChange={(checked) =>
                toggle(permission.name, checked === true)
              }
              aria-describedby={`${id}-description`}
            />
            <div className='grid gap-0.5'>
              <Label htmlFor={id}>
                {apiTokenPermissionLabels[permission.name]}
                <code className='text-xs font-normal text-muted-foreground'>
                  {permission.name}
                </code>
              </Label>
              <p
                id={`${id}-description`}
                className='text-xs text-muted-foreground'
              >
                {permission.description}
              </p>
            </div>
          </div>
        )
      })}
      {error && <p className='text-sm text-destructive'>{error}</p>}
    </fieldset>
  )
}
