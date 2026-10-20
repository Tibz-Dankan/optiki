import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useAuthStore } from '@stores/auth'
import useDialogState from '@hooks/use-dialog-state'
import { Button } from '@shared/ui/button'
import { ChangePasswordDialog } from '@modules/settings/ui/change-password-dialog'
import { SettingsRow } from '@modules/settings/ui/settings-row'

export const AccountSection: React.FC = () => {
  const [open, setOpen] = useDialogState<'password'>()
  const [copied, setCopied] = useState(false)
  const user = useAuthStore((state) => state.auth.user)

  const copyUserID = async () => {
    await navigator.clipboard.writeText(user.id)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <h3 className='text-sm font-semibold text-muted-foreground'>Account</h3>

      <SettingsRow label='User ID'>
        <code className='rounded-md bg-muted px-2 py-1 font-mono text-xs'>
          {user.id}
        </code>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label='Copy user ID'
          onClick={copyUserID}
        >
          {copied ? <Check className='text-primary' /> : <Copy />}
        </Button>
      </SettingsRow>

      <SettingsRow label='Email' desc={user.email} />

      <SettingsRow
        label='Password'
        desc='Change the password you use to sign in.'
      >
        <Button
          type='button'
          variant='outline'
          onClick={() => setOpen('password')}
        >
          Change password
        </Button>
      </SettingsRow>

      <ChangePasswordDialog
        open={open === 'password'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'password' : null)}
      />
    </section>
  )
}
