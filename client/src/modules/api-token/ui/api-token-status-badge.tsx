import { apiTokenStatusLabels } from '@constants/api-token'
import type { TAPIToken } from '@typings/api-token'
import { cn } from '@utils/classname'
import { getAPITokenStatus } from '@utils/get-api-token-status'

const tones = {
  ACTIVE: 'border-success/40 bg-success/10 text-foreground',
  EXPIRING: 'border-warning/50 bg-warning/15 text-foreground',
  EXPIRED: 'border-border bg-muted text-muted-foreground',
  REVOKED: 'border-destructive/40 bg-destructive/10 text-destructive',
}

type APITokenStatusBadgeProps = {
  token: TAPIToken
}

export const APITokenStatusBadge: React.FC<APITokenStatusBadgeProps> = ({
  token,
}) => {
  const status = getAPITokenStatus(token)
  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-0.5 text-xs font-medium',
        tones[status]
      )}
    >
      {apiTokenStatusLabels[status]}
    </span>
  )
}
