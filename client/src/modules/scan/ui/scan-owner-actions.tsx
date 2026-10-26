import { useState } from 'react'
import { EllipsisVertical, Link2, Lock, Trash2, Users } from 'lucide-react'
import type { TScanSummary } from '@typings/scan'
import { Button } from '@shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { CopyScanLinkDialog } from '@modules/scan/ui/copy-scan-link-dialog'
import { DeleteScanDialog } from '@modules/scan/ui/delete-scan-dialog'
import { ScanVisibilityDialog } from '@modules/scan/ui/scan-visibility-dialog'

type ScanOwnerActionsProps = {
  scan: TScanSummary
}

type TScanActionDialog = 'visibility' | 'copy-link' | 'delete'

export const ScanOwnerActions: React.FC<ScanOwnerActionsProps> = ({ scan }) => {
  const [openDialog, setOpenDialog] = useState<TScanActionDialog | null>(null)
  const isPublic = scan.visibility === 'PUBLIC'
  const closeDialog = (isOpen: boolean) => !isOpen && setOpenDialog(null)

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
            <span className='sr-only'>Scan actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onSelect={() => setOpenDialog('visibility')}>
            {isPublic ? <Lock aria-hidden /> : <Users aria-hidden />}
            {isPublic ? 'Make scan private' : 'Make scan public'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenDialog('copy-link')}>
            <Link2 aria-hidden />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            variant='destructive'
            onSelect={() => setOpenDialog('delete')}
          >
            <Trash2 aria-hidden />
            Delete scan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScanVisibilityDialog
        scan={scan}
        open={openDialog === 'visibility'}
        onOpenChange={closeDialog}
      />
      <CopyScanLinkDialog
        scan={scan}
        open={openDialog === 'copy-link'}
        onOpenChange={closeDialog}
      />
      <DeleteScanDialog
        scan={openDialog === 'delete' ? scan : null}
        onOpenChange={closeDialog}
        redirectTo='/u/scans'
      />
    </>
  )
}
