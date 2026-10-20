import { cn } from '@utils/classname'

export const AppLogo: React.FC<React.ComponentProps<'img'>> = ({
  className,
  alt = 'optikí',
  ...props
}) => {
  return (
    <img
      src='/optiki-logo.svg'
      alt={alt}
      width={64}
      height={64}
      className={cn('size-8 shrink-0 object-contain', className)}
      {...props}
    />
  )
}
