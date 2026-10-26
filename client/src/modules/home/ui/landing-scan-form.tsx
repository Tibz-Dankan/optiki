import { guestScanLimit } from '@constants/scan'
import { useAuthStore } from '@stores/auth'
import { useGuestScanStore } from '@stores/guest-scan'
import { useCreateScan } from '@hooks/use-create-scan'
import { GuestScanLimitNotice } from '@modules/scan/ui/guest-scan-limit-notice'
import { UrlScanForm } from '@modules/scan/ui/url-scan-form'

type LandingScanFormProps = {
  id: string
  label?: string
  submitLabel?: React.ReactNode
  className?: string
}

export const LandingScanForm: React.FC<LandingScanFormProps> = ({
  id,
  label,
  submitLabel,
  className,
}) => {
  const isVerifiedUser = useAuthStore(
    (state) => !!state.auth.session.userID && state.auth.user.emailVerified
  )
  const isGuest = !isVerifiedUser
  const guestScanCount = useGuestScanStore((state) => state.scans.length)
  const { scan, isPending, isLimitError, errorMessage } = useCreateScan(isGuest)
  const isAtLimit =
    isGuest && (guestScanCount >= guestScanLimit || isLimitError)

  return (
    <div className={className}>
      {isAtLimit ? (
        <GuestScanLimitNotice />
      ) : (
        <UrlScanForm
          id={id}
          label={label}
          submitLabel={submitLabel}
          isPending={isPending}
          pendingMessage={
            isGuest
              ? 'Scanning…'
              : 'Scanning… rendered scans take a few seconds.'
          }
          error={errorMessage}
          onScan={(url) => scan(url)}
          hint={
            <span className='font-mono text-xs'>
              {isGuest
                ? `${guestScanLimit} free scans · no account · results in seconds`
                : 'All 17 rules · rendered in a real browser'}
            </span>
          }
        />
      )}
    </div>
  )
}
