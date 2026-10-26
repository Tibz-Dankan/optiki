import { cn } from '@utils/classname'

type LandingSectionProps = {
  labelledBy: string
  id?: string
  isBand?: boolean
  className?: string
  containerClassName?: string
  children: React.ReactNode
}

export const LandingSection: React.FC<LandingSectionProps> = ({
  labelledBy,
  id,
  isBand = false,
  className,
  containerClassName,
  children,
}) => {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        'py-[clamp(72px,9vw,112px)]',
        isBand && 'border-y border-border bg-muted/60 dark:bg-card/40',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-300 reveal px-[clamp(16px,4vw,32px)]',
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
