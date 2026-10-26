import { useState } from 'react'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import type { TMultiplePageScanSummary } from '@typings/scan'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { Button } from '@shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { DeleteMultiplePageScanDialog } from '@modules/scan/ui/delete-multiple-page-scan-dialog'

type MultiplePageScanActionsProps = {
  scan: TMultiplePageScanSummary
  label?: string
  redirectTo?: string
}

export const MultiplePageScanActions: React.FC<
  MultiplePageScanActionsProps
> = ({ scan, label = 'Scan actions', redirectTo }) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-8'
          >
            <EllipsisVertical aria-hidden />
            <span className='sr-only'>{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            variant='destructive'
            disabled={isMultiplePageScanActive(scan)}
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2 aria-hidden />
            Delete scan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteMultiplePageScanDialog
        scan={isDeleteOpen ? scan : null}
        onOpenChange={(isOpen) => !isOpen && setIsDeleteOpen(false)}
        redirectTo={redirectTo}
      />
    </>
  )
}
