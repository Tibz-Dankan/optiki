import { Link } from 'react-router-dom'
import { cn } from '@utils/classname'
import { AppLogo } from '@shared/ui/app-logo'

type AuthLayoutProps = {
  children: React.ReactNode
  className?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <main id='content' className='container grid h-svh max-w-none items-center'>
      <div
        className={cn(
          'mx-auto flex w-full max-w-sm flex-col justify-center space-y-2 py-8 sm:p-8',
          className
        )}
      >
        <div className='mb-4 flex items-center justify-center'>
          <Link to='/' className='flex items-center'>
            <AppLogo alt='' className='me-2 size-8' />
            <h1 className='text-xl font-medium'>optikí</h1>
          </Link>
        </div>
        {children}
      </div>
    </main>
  )
}
