import { AppLogo } from '@shared/ui/app-logo'

export const LoadingPage: React.FC = () => {
  return (
    <div className='h-svh w-full bg-background'>
      <div
        role='status'
        className='m-auto flex h-full w-full flex-col items-center justify-center gap-4'
      >
        <AppLogo
          alt=''
          className='size-16 motion-safe:animate-pulse md:size-20'
        />
        <span className='text-2xl font-bold tracking-tight text-foreground md:text-3xl'>
          optikí
        </span>
        <span className='sr-only'>Loading</span>
      </div>
    </div>
  )
}
