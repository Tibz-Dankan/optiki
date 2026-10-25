import { MoreHorizontal } from 'lucide-react'
import type { TAPIToken } from '@typings/api-token'
import { Button } from '@shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'

type APITokenActionsProps = {
  token: TAPIToken
  onEdit: (token: TAPIToken) => void
  onRevoke: (token: TAPIToken) => void
  onDelete: (token: TAPIToken) => void
}

export const APITokenActions: React.FC<APITokenActionsProps> = ({
  token,
  onEdit,
  onRevoke,
  onDelete,
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='ghost' size='icon'>
          <MoreHorizontal aria-hidden />
          <span className='sr-only'>Actions for token {token.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          disabled={token.isRevoked}
          onSelect={() => onEdit(token)}
        >
          Edit token {token.name}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={token.isRevoked}
          onSelect={() => onRevoke(token)}
        >
          Revoke token {token.name}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant='destructive'
          onSelect={() => onDelete(token)}
        >
          Delete token {token.name}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
