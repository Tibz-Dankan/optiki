import { cn } from '@utils/classname'

type SectionHeadingProps = {
  id: string
  eyebrow: string
  title: string
  className?: string
  children?: React.ReactNode
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  id,
  eyebrow,
  title,
  className,
  children,
}) => {
  return (
    <div className={cn('flex max-w-190 flex-col gap-4', className)}>
      <span className='font-mono text-xs font-medium tracking-[0.14em] text-primary uppercase'>
        {eyebrow}
      </span>
      <h2
        id={id}
        className='text-[clamp(30px,4.4vw,50px)] leading-[1.08] font-bold tracking-[-0.035em] text-balance'
      >
        {title}
      </h2>
      {children && (
        <p className='text-[clamp(16px,1.6vw,19px)] leading-[1.6] text-muted-foreground'>
          {children}
        </p>
      )}
    </div>
  )
}
